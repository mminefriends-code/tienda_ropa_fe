import { IsObject, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    example: {
      firstName: 'María',
      lastName: 'García',
      phone: '+59171234567',
      street: 'Av. Camacho 123',
      city: 'La Paz',
      state: 'La Paz',
      postalCode: '0000',
      country: 'BO',
    },
  })
  @IsObject()
  shippingAddress: Record<string, any>;

  @ApiPropertyOptional({
    example: {
      firstName: 'María',
      lastName: 'García',
      phone: '+59171234567',
      street: 'Av. Camacho 123',
      city: 'La Paz',
      state: 'La Paz',
      postalCode: '0000',
      country: 'BO',
    },
  })
  @IsOptional()
  @IsObject()
  billingAddress?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Entregar en horario de mañana' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: 'qr', enum: ['qr', 'cash'] })
  @IsOptional()
  @IsIn(['qr', 'cash'])
  paymentMethod?: string;
}