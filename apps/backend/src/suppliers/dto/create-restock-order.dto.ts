import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RestockOrderItemDto {
  @ApiProperty({ example: 'uuid-de-variante' })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateRestockOrderDto {
  @ApiProperty({ example: 'uuid-de-proveedor' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiPropertyOptional({ example: 'Reposición urgente de vestidos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [RestockOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RestockOrderItemDto)
  items: RestockOrderItemDto[];
}