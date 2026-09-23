import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  @MaxLength(10)
  size: string;

  @ApiProperty({ example: 'Rojo' })
  @IsString()
  @MaxLength(50)
  color: string;

  @ApiProperty({ example: '#FF0000' })
  @IsString()
  @MaxLength(7)
  colorHex: string;

  @ApiProperty({ example: 'VEST-ROJO-M-001' })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 59.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}