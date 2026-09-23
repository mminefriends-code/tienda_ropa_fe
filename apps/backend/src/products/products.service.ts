import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    const { variants, images, arModels, ...productData } = data;
    
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug: this.generateSlug(productData.name),
        variants: variants ? { create: variants } : undefined,
        images: images ? { create: images } : undefined,
        arModels: arModels ? { create: arModels } : undefined,
      },
      include: this.getIncludeOptions(),
    });
    return product;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    colors?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isFeatured?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      search,
      minPrice,
      maxPrice,
      sizes,
      colors,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isFeatured,
    } = params;

    const where: any = { isActive: true };

    if (categoryId) {
      const categoryIds = await this.getCategoryTreeIds(categoryId);
      where.categoryId = { in: categoryIds };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          isActive: true,
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
        },
      };
    }

    if (sizes && sizes.length > 0) {
      where.variants = {
        ...where.variants,
        some: {
          ...where.variants?.some,
          size: { in: sizes },
        },
      };
    }

    if (colors && colors.length > 0) {
      where.variants = {
        ...where.variants,
        some: {
          ...where.variants?.some,
          color: { in: colors },
        },
      };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: this.getIncludeOptions(),
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async findBySlugOrId(slugOrId: string) {
    try {
      return await this.findById(slugOrId);
    } catch {
      return this.findBySlug(slugOrId);
    }
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async findFeatured(limit = 8) {
    return this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: this.getIncludeOptions(),
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRelated(productId: string, limit = 4) {
    const product = await this.findById(productId);
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        id: { not: productId },
      },
      include: this.getIncludeOptions(),
      take: limit,
    });
  }

  async update(id: string, data: UpdateProductDto) {
    await this.findById(id);
    const { variants, images, arModels, ...productData } = data;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        slug: productData.name ? this.generateSlug(productData.name) : undefined,
        variants: variants?.length
          ? {
              upsert: variants.map((v) => {
                const { size, color, ...rest } = v;
                return {
                  where: { productId_size_color: { productId: id, size, color } },
                  create: v,
                  update: rest,
                };
              }),
            }
          : undefined,
        images: images
          ? {
              deleteMany: { productId: id, variantId: null },
              create: images,
            }
          : undefined,
        arModels: arModels ? { create: arModels } : undefined,
      },
      include: this.getIncludeOptions(),
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async createVariant(productId: string, data: CreateVariantDto) {
    await this.findById(productId);
    return this.prisma.productVariant.create({
      data: { ...data, productId },
      include: { images: true },
    });
  }

  async updateVariant(variantId: string, data: UpdateVariantDto) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variante no encontrada');
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data,
      include: { images: true },
    });
  }

  async deleteVariant(variantId: string) {
    return this.prisma.productVariant.delete({ where: { id: variantId } });
  }

  async getSizeRecommendation(productId: string, userId?: string) {
    const product = await this.findById(productId);
    const availableSizes = Array.from(
      new Set(product.variants.filter((v: { isActive: boolean }) => v.isActive).map((v: { size: string }) => v.size)),
    );
    const isNumeric = availableSizes.some((size: string) => /^\d+$/.test(size));
    const chart = isNumeric ? this.numericSizeChart() : this.letterSizeChart();

    let measurements: any = null;
    if (userId) {
      measurements = await this.prisma.bodyMeasurement.findUnique({ where: { userId } });
    }

    const toNum = (value: any) => (value != null && value.toString() !== '' ? Number(value) : null);
    const m = measurements
      ? {
          bust: toNum(measurements.bust),
          waist: toNum(measurements.waist),
          hips: toNum(measurements.hips),
        }
      : null;
    const hasMeasurements = !!(m && (m.bust || m.waist || m.hips));

    let recommendedSize: string | null = null;
    if (hasMeasurements) {
      recommendedSize = this.bestSizeForMeasurements(m, chart, availableSizes);
    }

    return { recommendedSize, hasMeasurements, availableSizes, sizeChart: chart };
  }

  private letterSizeChart(): Record<string, { label: string; range: string }> {
    return {
      XS: { label: 'XS', range: 'Pecho 78-83 · Cintura 61-66 · Cadera 86-91' },
      S: { label: 'S', range: 'Pecho 84-89 · Cintura 67-72 · Cadera 92-97' },
      M: { label: 'M', range: 'Pecho 90-95 · Cintura 73-78 · Cadera 98-103' },
      L: { label: 'L', range: 'Pecho 96-102 · Cintura 79-85 · Cadera 104-110' },
      XL: { label: 'XL', range: 'Pecho 103-109 · Cintura 86-92 · Cadera 111-117' },
      XXL: { label: 'XXL', range: 'Pecho 110-116 · Cintura 93-100 · Cadera 118-124' },
    };
  }

  private numericSizeChart(): Record<string, { label: string; range: string }> {
    return {
      '34': { label: '34', range: 'Cintura 60-65 · Cadera 84-90' },
      '36': { label: '36', range: 'Cintura 66-71 · Cadera 91-96' },
      '38': { label: '38', range: 'Cintura 72-77 · Cadera 97-103' },
      '40': { label: '40', range: 'Cintura 78-83 · Cadera 104-110' },
      '42': { label: '42', range: 'Cintura 84-90 · Cadera 111-117' },
      '44': { label: '44', range: 'Cintura 91-97 · Cadera 118-124' },
    };
  }

  private bestSizeForMeasurements(
    m: { bust?: number | null; waist?: number | null; hips?: number | null },
    chart: Record<string, { label: string; range: string }>,
    availableSizes: string[],
  ): string | null {
    const candidates = Object.keys(chart);

    const score = (size: string) => {
      let total = 0;
      const ranges = this.parseRanges(chart[size].range);
      for (const [key, min, max] of ranges) {
        const value = m[key as 'bust' | 'waist' | 'hips'];
        if (value == null) continue;
        if (value >= min && value <= max) total += 2;
        if (value < min) total -= (min - value) / 10;
        if (value > max) total -= (value - max) / 10;
      }
      return total;
    };

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const size of candidates) {
      const s = score(size);
      if (s > bestScore) {
        bestScore = s;
        best = size;
      }
    }
    if (best == null) return null;

    if (availableSizes.includes(best)) return best;
    const idx = candidates.indexOf(best);
    for (let i = 1; i < candidates.length; i++) {
      for (const candidate of [candidates[idx - i], candidates[idx + i]]) {
        if (candidate && availableSizes.includes(candidate)) return candidate;
      }
    }
    return availableSizes[Math.floor(availableSizes.length / 2)] || null;
  }

  private parseRanges(range: string): Array<[string, number, number]> {
    const result: Array<[string, number, number]> = [];
    const labels: Record<string, string> = { Pecho: 'bust', Cintura: 'waist', Cadera: 'hips' };
    for (const part of range.split('·')) {
      const match = part.match(/^\s*(\w+)\s+(\d+)-(\d+)/);
      if (match) {
        result.push([labels[match[1]] || 'waist', Number(match[2]), Number(match[3])]);
      }
    }
    return result;
  }

  async getFilters(categoryId?: string) {
    const where: any = { isActive: true };
    if (categoryId) {
      const categoryIds = await this.getCategoryTreeIds(categoryId);
      where.categoryId = { in: categoryIds };
    }

    const [sizes, colors, priceRange] = await Promise.all([
      this.prisma.productVariant.findMany({
        where: { product: where, isActive: true },
        select: { size: true },
        distinct: ['size'],
      }),
      this.prisma.productVariant.findMany({
        where: { product: where, isActive: true },
        select: { color: true, colorHex: true },
        distinct: ['color'],
      }),
      this.prisma.productVariant.aggregate({
        where: { product: where, isActive: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return {
      sizes: sizes.map((s: { size: string }) => s.size).sort(),
      colors: colors.map((c: { color: string; colorHex: string }) => ({ name: c.color, hex: c.colorHex })),
      priceRange: {
        min: Number(priceRange._min.price || 0),
        max: Number(priceRange._max.price || 0),
      },
    };
  }

  private async getCategoryTreeIds(categoryId: string): Promise<string[]> {
    const ids = [categoryId];
    const children = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });
    for (const child of children) {
      ids.push(...await this.getCategoryTreeIds(child.id));
    }
    return ids;
  }

  private getIncludeOptions(): Prisma.ProductInclude {
    return {
      category: true,
      variants: {
        where: { isActive: true },
        include: { images: true },
        orderBy: [{ size: 'asc' }, { color: 'asc' }],
      },
      images: { orderBy: { position: 'asc' } },
      arModels: { where: { isActive: true } },
      _count: { select: { reviews: true } },
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}