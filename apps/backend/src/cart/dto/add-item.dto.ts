import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({ example: 'clx1abc123...' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'clx1def456...' })
  @IsString()
  variantId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
