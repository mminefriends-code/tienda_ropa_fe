import { IsString, MinLength, MaxLength, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Vestidos' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Vestidos para toda ocasión' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/vestidos.jpg' })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiPropertyOptional({ example: 'uuid-de-categoria-padre' })
  @IsOptional()
  @IsString()
  parentId?: string;
}