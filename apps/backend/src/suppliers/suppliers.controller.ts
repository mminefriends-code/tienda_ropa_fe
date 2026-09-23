import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateRestockOrderDto } from './dto/create-restock-order.dto';
import { UpdateRestockStatusDto } from './dto/update-restock-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRoles } from '../auth/decorators/roles.decorator';

@ApiTags('Proveedores')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ADMIN, UserRoles.MANAGER)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar proveedores (admin)' })
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get('reorder-alerts')
  @ApiOperation({ summary: 'Alertas de stock bajo con proveedor recomendado (admin)' })
  reorderAlerts() {
    return this.suppliersService.reorderAlerts();
  }

  @Get('restock-orders')
  @ApiOperation({ summary: 'Listar pedidos de reposición (admin)' })
  findRestockOrders() {
    return this.suppliersService.findRestockOrders();
  }

  @Post('restock-orders')
  @ApiOperation({ summary: 'Crear pedido de reposición a un proveedor (admin)' })
  createRestockOrder(@Body() data: CreateRestockOrderDto) {
    return this.suppliersService.createRestockOrder(data);
  }

  @Put('restock-orders/:id/status')
  @ApiOperation({ summary: 'Cambiar estado del pedido de reposición. RECEIVED incrementa el stock (admin)' })
  updateRestockStatus(@Param('id') id: string, @Body() data: UpdateRestockStatusDto) {
    return this.suppliersService.updateRestockStatus(id, data.status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener proveedor (admin)' })
  findById(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear proveedor con sus categorías (admin)' })
  create(@Body() data: CreateSupplierDto) {
    return this.suppliersService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar proveedor (admin)' })
  update(@Param('id') id: string, @Body() data: UpdateSupplierDto) {
    return this.suppliersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar proveedor (admin)' })
  delete(@Param('id') id: string) {
    return this.suppliersService.delete(id);
  }
}