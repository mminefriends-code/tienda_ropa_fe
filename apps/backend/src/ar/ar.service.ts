import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ArFormat } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArService {
  constructor(private prisma: PrismaService) {}

  async getArModelsForProduct(productId: string) {
    return this.prisma.arModel.findMany({
      where: { productId, isActive: true },
      include: { variant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArModelsForProductAdmin(productId: string) {
    return this.prisma.arModel.findMany({
      where: { productId },
      include: { variant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArModelById(id: string) {
    const model = await this.prisma.arModel.findUnique({
      where: { id },
      include: { product: true, variant: true },
    });
    if (!model) throw new NotFoundException('Modelo AR no encontrado');
    return model;
  }

  async createArSession(userId: string, data: { productId: string; variantId?: string; arModelId: string }) {
    const arModel = await this.getArModelById(data.arModelId);
    if (arModel.productId !== data.productId) {
      throw new BadRequestException('El modelo AR no pertenece al producto');
    }

    return this.prisma.arSession.create({
      data: {
        userId,
        productId: data.productId,
        variantId: data.variantId,
        arModelId: data.arModelId,
      },
      include: { arModel: true, product: true, variant: true },
    });
  }

  async endArSession(sessionId: string, userId: string, data: { duration?: number; screenshotUrl?: string; rating?: number; feedback?: string }) {
    const session = await this.prisma.arSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Sesión AR no encontrada');

    return this.prisma.arSession.update({
      where: { id: sessionId },
      data,
    });
  }

  async getUserArSessions(userId: string) {
    return this.prisma.arSession.findMany({
      where: { userId },
      include: { arModel: true, product: true, variant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArAnalytics(productId?: string) {
    const where = productId ? { productId } : {};
    const [totalSessions, avgDuration, avgRating, modelsUsed] = await Promise.all([
      this.prisma.arSession.count({ where }),
      this.prisma.arSession.aggregate({ where, _avg: { duration: true } }),
      this.prisma.arSession.aggregate({ where, _avg: { rating: true } }),
      this.prisma.arSession.groupBy({
        by: ['arModelId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const modelDetails = await this.prisma.arModel.findMany({
      where: { id: { in: modelsUsed.map((m: { arModelId: string }) => m.arModelId) } },
    });

    return {
      totalSessions,
      avgDuration: avgDuration._avg.duration || 0,
      avgRating: avgRating._avg.rating || 0,
      topModels: modelsUsed.map((m: { arModelId: string; _count: { id: number } }) => ({
        ...modelDetails.find((md: { id: string }) => md.id === m.arModelId),
        usageCount: m._count.id,
      })),
    };
  }

  async createArModel(data: {
    productId: string;
    variantId?: string;
    name: string;
    modelUrl: string;
    thumbnailUrl?: string;
    format?: string;
    scale?: number;
    position?: Record<string, number>;
    rotation?: Record<string, number>;
    overlayImage?: string;
    overlayScale?: number;
    overlayOffsetY?: number;
  }) {
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.arModel.create({
      data: {
        ...data,
        modelUrl: data.modelUrl || '2d-overlay',
        format: data.format as any || 'GLB',
        scale: data.scale || 1.0,
      },
    });
  }

  async updateArModel(id: string, data: Partial<{
    name: string;
    modelUrl: string;
    thumbnailUrl: string;
    format: ArFormat;
    scale: number;
    position: Record<string, number>;
    rotation: Record<string, number>;
    overlayImage: string;
    overlayScale: number;
    overlayOffsetY: number;
    isActive: boolean;
  }>) {
    return this.prisma.arModel.update({ where: { id }, data });
  }

  async deleteArModel(id: string) {
    return this.prisma.arModel.delete({ where: { id } });
  }
}