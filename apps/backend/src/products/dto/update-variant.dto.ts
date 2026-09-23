import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVariantDto {
  @ApiPropertyOptional({ example: 'L' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  size?: string;

  @ApiPropertyOptional({ example: 'Azul' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: '#0000FF' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  colorHex?: string;

  @ApiPropertyOptional({ example: 44.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 54.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}