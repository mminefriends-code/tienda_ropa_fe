import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRoles } from '../auth/decorators/roles.decorator';

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos con filtros' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sizes') sizes?: string,
    @Query('colors') colors?: string,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
    @Query('isFeatured') isFeatured?: string,
  ) {
    return this.productsService.findAll({
      page: Number(page),
      limit: Number(limit),
      categoryId,
      search,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sizes: sizes?.split(','),
      colors: colors?.split(','),
      sortBy,
      sortOrder,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
    });
  }

  @Get('filters')
  @ApiOperation({ summary: 'Obtener filtros disponibles' })
  async getFilters(@Query('categoryId') categoryId?: string) {
    return this.productsService.getFilters(categoryId);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Productos destacados' })
  async findFeatured(@Query('limit') limit = 8) {
    return this.productsService.findFeatured(Number(limit));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Obtener producto por slug o id' })
  async findBySlugOrId(@Param('slug') slug: string) {
    return this.productsService.findBySlugOrId(slug);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Productos relacionados' })
  async findRelated(@Param('id') id: string, @Query('limit') limit = 4) {
    return this.productsService.findRelated(id, Number(limit));
  }

  @Get(':id/recommended-size')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Recomendar talla según medidas del usuario' })
  async getRecommendedSize(@Param('id') id: string, @Request() req: any) {
    return this.productsService.getSizeRecommendation(id, req.user?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear producto (admin)' })
  async create(@Body() data: CreateProductDto) {
    return this.productsService.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar producto (admin)' })
  async update(@Param('id') id: string, @Body() data: UpdateProductDto) {
    return this.productsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar producto (admin)' })
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear variante (admin)' })
  async createVariant(@Param('id') id: string, @Body() data: CreateVariantDto) {
    return this.productsService.createVariant(id, data);
  }

  @Put('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar variante (admin)' })
  async updateVariant(@Param('variantId') variantId: string, @Body() data: UpdateVariantDto) {
    return this.productsService.updateVariant(variantId, data);
  }

  @Delete('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar variante (admin)' })
  async deleteVariant(@Param('variantId') variantId: string) {
    return this.productsService.deleteVariant(variantId);
  }
}