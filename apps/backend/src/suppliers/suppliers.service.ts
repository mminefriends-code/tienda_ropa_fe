import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RestockStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateRestockOrderDto } from './dto/create-restock-order.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  private supplierInclude = {
    categories: {
      include: { category: { select: { id: true, name: true } as const } },
    },
    _count: { select: { restockOrders: true } as const },
  } as const;

  async findAll() {
    return this.prisma.supplier.findMany({
      include: this.supplierInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: this.supplierInclude,
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async create(data: CreateSupplierDto) {
    const { categoryIds, ...supplierData } = data;
    return this.prisma.supplier.create({
      data: {
        ...supplierData,
        categories: categoryIds?.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: this.supplierInclude,
    });
  }

  async update(id: string, data: UpdateSupplierDto) {
    await this.findById(id);
    const { categoryIds, ...supplierData } = data;
    return this.prisma.$transaction(async (tx) => {
      if (categoryIds) {
        await tx.supplierCategory.deleteMany({ where: { supplierId: id } });
        if (categoryIds.length) {
          await tx.supplierCategory.createMany({
            data: [...new Set(categoryIds)].map((categoryId) => ({ supplierId: id, categoryId })),
          });
        }
      }
      return tx.supplier.update({
        where: { id },
        data: supplierData,
        include: this.supplierInclude,
      });
    });
  }

  async delete(id: string) {
    await this.findById(id);
    const orders = await this.prisma.restockOrder.count({ where: { supplierId: id } });
    if (orders > 0) {
      throw new BadRequestException('No se puede eliminar: el proveedor tiene pedidos de reposición');
    }
    return this.prisma.supplier.delete({ where: { id } });
  }

  async findRestockOrders() {
    return this.prisma.restockOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: { variant: { include: { product: { select: { id: true, name: true } as const } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRestockOrder(data: CreateRestockOrderDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    if (!supplier.isActive) throw new BadRequestException('El proveedor está inactivo');

    const variantIds = data.items.map((item) => item.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, isActive: true },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));
    for (const item of data.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) throw new BadRequestException(`Variante ${item.variantId} no existe`);
      if (!variant.isActive) throw new BadRequestException('Una de las variantes está inactiva');
    }

    const orderNumber = `REP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return this.prisma.restockOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        },
      },
      include: {
        supplier: true,
        items: { include: { variant: { include: { product: { select: { id: true, name: true } as const } } } } },
      },
    });
  }

  async updateRestockStatus(id: string, status: RestockStatus) {
    const order = await this.prisma.restockOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido de reposición no encontrado');
    if (order.status === status) return this.findOneRestockOrder(id);

    return this.prisma.$transaction(async (tx) => {
      if (status === RestockStatus.RECEIVED) {
        for (const item of order.items) {
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      return tx.restockOrder.update({
        where: { id },
        data: { status },
        include: {
          supplier: true,
          items: {
            include: { variant: { include: { product: { select: { id: true, name: true } as const } } } },
          },
        },
      });
    });
  }

  private async findOneRestockOrder(id: string) {
    const order = await this.prisma.restockOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { variant: { include: { product: { select: { id: true, name: true } as const } } } } },
      },
    });
    if (!order) throw new NotFoundException('Pedido de reposición no encontrado');
    return order;
  }

  async reorderAlerts() {
    const variants = await this.prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: { include: { category: true } } },
    });

    const alerts = variants.filter((v) => v.stock <= v.reorderPoint);
    if (alerts.length === 0) return [];

    const categoryIds = new Set<string>();
    for (const v of alerts) {
      categoryIds.add(v.product.categoryId);
      if (v.product.category.parentId) categoryIds.add(v.product.category.parentId);
    }

    const supplierCategories = await this.prisma.supplierCategory.findMany({
      where: { categoryId: { in: [...categoryIds] } },
      include: { supplier: true },
    });

    const suppliersByCategory = new Map<string, typeof supplierCategories[number][]>();
    for (const sc of supplierCategories) {
      if (!sc.supplier.isActive) continue;
      const list = suppliersByCategory.get(sc.categoryId) || [];
      list.push(sc);
      suppliersByCategory.set(sc.categoryId, list);
    }

    return alerts.map((v) => {
      const direct = suppliersByCategory.get(v.product.categoryId) || [];
      const parent = v.product.category.parentId
        ? suppliersByCategory.get(v.product.category.parentId) || []
        : [];

      const seen = new Set<string>();
      const recommended = [...direct, ...parent]
        .map((sc) => sc.supplier)
        .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));

      return {
        variantId: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        currentStock: v.stock,
        reorderPoint: v.reorderPoint,
        productId: v.productId,
        productName: v.product.name,
        categoryId: v.product.categoryId,
        categoryName: v.product.category.name,
        suppliers: recommended.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
        })),
      };
    });
  }
}