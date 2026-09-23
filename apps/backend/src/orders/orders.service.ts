import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, data: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Carrito vacío');
      }

      const variantIds = cart.items.map((item: { variantId: string }) => item.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
      });

      const variantMap = new Map<string, any>(variants.map((v: { id: string }) => [v.id, v]));
      let subtotal = 0;

      for (const item of cart.items) {
        const variant = variantMap.get(item.variantId);
        if (!variant || !variant.isActive) {
          throw new BadRequestException(`Variante ${item.variantId} no disponible`);
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${variant.productId}`);
        }
        subtotal += Number(variant.price) * item.quantity;
      }

      // Descuento de stock atómico: solo decrementa si hay stock suficiente,
      // evitando carreras entre peticiones simultáneas.
      for (const item of cart.items) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new BadRequestException(`Stock insuficiente para una de las variantes`);
        }
      }

      const tax = subtotal * 0.21;
      const shipping = subtotal > 100 ? 0 : 4.99;
      const total = subtotal + tax + shipping;

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          tax,
          shipping,
          total,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress || data.shippingAddress,
          notes: data.notes,
          paymentMethod: data.paymentMethod || 'qr',
          items: {
            create: cart.items.map((item: { variantId: string; quantity: number }) => {
              const variant = variantMap.get(item.variantId)!;
              return {
                productId: variant.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: variant.price,
                total: Number(variant.price) * item.quantity,
              };
            }),
          },
        },
        include: { items: { include: { product: { include: { images: true } }, variant: { include: { images: true, product: { include: { images: true } } } } } } },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  }

  async findAll(userId: string, role: string, page = 1, limit = 20) {
    const isAdmin = role === 'ADMIN' || role === 'MANAGER';
    const where = isAdmin ? {} : { userId };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: { include: { product: { include: { images: true } }, variant: { include: { images: true, product: { include: { images: true } } } } } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(userId: string, role: string, id: string) {
    const isAdmin = role === 'ADMIN' || role === 'MANAGER';
    const order = await this.prisma.order.findFirst({
      where: isAdmin ? { id } : { id, userId },
      include: {
        items: { include: { product: { include: { images: true } }, variant: { include: { images: true, product: { include: { images: true } } } } } },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async findByOrderNumber(userId: string, role: string, orderNumber: string) {
    const isAdmin = role === 'ADMIN' || role === 'MANAGER';
    const order = await this.prisma.order.findFirst({
      where: isAdmin ? { orderNumber } : { orderNumber, userId },
      include: {
        items: { include: { product: { include: { images: true } }, variant: { include: { images: true, product: { include: { images: true } } } } } },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');

      const cancelled = status === 'CANCELLED' || status === 'RETURNED';
      const wasCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';

      if (cancelled && !wasCancelled && !order.stockReleased) {
        await releaseStock(tx, order);
      } else if (!cancelled && wasCancelled && order.stockReleased) {
        await holdStock(tx, order);
      }

      return tx.order.update({
        where: { id },
        data: { status: status as any },
      });
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: string) {
    const isRejected = paymentStatus === 'FAILED' || paymentStatus === 'REFUNDED';
    const isPaid = paymentStatus === 'PAID';

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');

      if (isRejected && !order.stockReleased) {
        await releaseStock(tx, order);
      } else if (isPaid && order.stockReleased) {
        await holdStock(tx, order);
      }

      return tx.order.update({
        where: { id },
        data: { paymentStatus: paymentStatus as any },
      });
    });
  }

  async uploadReceipt(userId: string, role: string, id: string, receiptUrl: string) {
    const isAdmin = role === 'ADMIN' || role === 'MANAGER';
    const order = await this.prisma.order.findFirst({
      where: isAdmin ? { id } : { id, userId },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return this.prisma.order.update({
      where: { id },
      data: { receiptUrl },
    });
  }

  async getStats() {
    const [todaySales, monthSales, totalSales, pendingOrders, totalOrders, totalUsers, totalProducts, recentOrders, monthlySales, topProducts] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: { not: 'CANCELLED' } },
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({
          where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, status: { not: 'CANCELLED' } },
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { total: true } }),
        this.prisma.order.count({ where: { status: 'PENDING' } }),
        this.prisma.order.count(),
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
include: { items: { include: { product: { include: { images: true } }, variant: { include: { images: true, product: { include: { images: true } } } } } } },
        }),
        this.prisma.$queryRawUnsafe(
          `SELECT to_char("createdAt", 'YYYY-MM') AS month, SUM(total) AS sales
           FROM orders
           WHERE status <> 'CANCELLED' AND "createdAt" >= NOW() - INTERVAL '12 months'
           GROUP BY month
           ORDER BY month DESC`,
        ) as Promise<{ month: string; sales: string | number }[]>,
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true, total: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
      ]);

    const topProductIds = topProducts.map((p) => p.productId);
    const topProductDetails = topProductIds.length > 0
      ? await this.prisma.product.findMany({
          where: { id: { in: topProductIds } },
          include: { variants: true, images: true, category: true },
        })
      : [];

    return {
      todaySales: Number(todaySales._sum.total || 0),
      monthSales: Number(monthSales._sum.total || 0),
      totalSales: Number(totalSales._sum.total || 0),
      pendingOrders,
      totalOrders,
      totalUsers,
      totalProducts,
      recentOrders,
      topProducts: topProducts.map((p) => {
        const product = topProductDetails.find((d) => d.id === p.productId);
        return {
          product,
          totalSold: Number(p._sum.quantity || 0),
          revenue: Number(p._sum.total || 0),
        };
      }),
      monthlySales: monthlySales
        .map((m) => ({
          month: m.month,
          sales: Number(m.sales),
        }))
        .reverse(),
    };
  }
}

async function releaseStock(tx: Prisma.TransactionClient, order: { id: string; items: { variantId: string; quantity: number }[] }) {
  for (const item of order.items) {
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
  }
  await tx.order.update({
    where: { id: order.id },
    data: { stockReleased: true },
  });
}

async function holdStock(tx: Prisma.TransactionClient, order: { id: string; items: { variantId: string; quantity: number }[] }) {
  for (const item of order.items) {
    const result = await tx.productVariant.updateMany({
      where: { id: item.variantId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (result.count === 0) {
      throw new BadRequestException('Stock insuficiente para re-servar el pedido');
    }
  }
  await tx.order.update({
    where: { id: order.id },
    data: { stockReleased: false },
  });
}