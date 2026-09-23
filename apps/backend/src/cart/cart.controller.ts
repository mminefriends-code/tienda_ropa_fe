import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-item.dto';
import { UpdateCartItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Carrito')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener carrito del usuario' })
  async getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: 'Añadir item al carrito' })
  async addItem(@Request() req: any, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(req.user.sub, dto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Actualizar cantidad de un item' })
  async updateItem(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(req.user.sub, id, dto.quantity);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Eliminar item del carrito' })
  async removeItem(@Request() req: any, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.sub, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Vaciar carrito' })
  async clear(@Request() req: any) {
    return this.cartService.clear(req.user.sub);
  }
}
