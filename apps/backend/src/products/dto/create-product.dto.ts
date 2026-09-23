import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsUrl, IsBoolean, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateVariantDto } from './create-variant.dto';

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://example.com/vestido1.jpg' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: 'Vestido rojo vista frontal' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isMain?: boolean;
}

export class CreateArModelDto {
  @ApiProperty({ example: 'Vestido rojo AR' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://cdn.example.com/models/vestido-rojo.glb' })
  @IsUrl()
  modelUrl: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/thumbs/vestido-rojo.jpg' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 'GLB', enum: ['GLTF', 'GLB', 'USDZ', 'OBJ'] })
  @IsOptional()
  format?: 'GLTF' | 'GLB' | 'USDZ' | 'OBJ';

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  scale?: number;

  @ApiPropertyOptional({ example: '{ "x": 0, "y": 0, "z": 0 }' })
  @IsOptional()
  position?: Record<string, number>;

  @ApiPropertyOptional({ example: '{ "x": 0, "y": 0, "z": 0 }' })
  @IsOptional()
  rotation?: Record<string, number>;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Vestido Floral Verano' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Vestido ligero con estampado floral, perfecto para el verano.' })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ example: 59.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({ example: 'VEST-FLORAL-001' })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 'uuid-de-categoria' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ type: [CreateVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @ApiPropertyOptional({ type: [CreateProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];

  @ApiPropertyOptional({ type: [CreateArModelDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateArModelDto)
  arModels?: CreateArModelDto[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}