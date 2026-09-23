import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRoles } from '../auth/decorators/roles.decorator';

const RECEIPTS_DIR = process.env.UPLOAD_DIR
  ? join(process.env.UPLOAD_DIR, 'receipts')
  : join(process.cwd(), 'apps', 'backend', 'uploads', 'receipts');

function receiptStorage() {
  mkdirSync(RECEIPTS_DIR, { recursive: true });
  return diskStorage({
    destination: RECEIPTS_DIR,
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${extname(file.originalname)}`);
    },
  });
}

@ApiTags('Pedidos')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear pedido desde carrito' })
  async create(@Request() req: any, @Body() data: CreateOrderDto) {
    return this.ordersService.create(req.user.sub, data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis pedidos (admin: todos)' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Request() req: any) {
    return this.ordersService.findAll(req.user.sub, req.user.role, Number(page), Number(limit));
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiOperation({ summary: 'Estadísticas del dashboard (admin)' })
  async getStats() {
    return this.ordersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findById(req.user.sub, req.user.role, id);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Obtener pedido por número' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string, @Request() req: any) {
    return this.ordersService.findByOrderNumber(req.user.sub, req.user.role, orderNumber);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiOperation({ summary: 'Actualizar estado del pedido (admin)' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }

  @Put(':id/payment')
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiOperation({ summary: 'Actualizar estado de pago del pedido (admin)' })
  async updatePaymentStatus(@Param('id') id: string, @Body('paymentStatus') paymentStatus: string) {
    if (!['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(paymentStatus)) {
      throw new BadRequestException('Estado de pago no válido');
    }
    return this.ordersService.updatePaymentStatus(id, paymentStatus);
  }

  @Post(':id/receipt')
  @ApiOperation({ summary: 'Subir comprobante de pago (cliente)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('receipt', {
    storage: receiptStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = /\.(jpg|jpeg|png|webp|pdf)$/i;
      if (!allowed.test(extname(file.originalname))) {
        return cb(new BadRequestException('Formato no permitido (usa jpg, png, webp o pdf)'), false);
      }
      cb(null, true);
    },
  }))
  async uploadReceipt(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo no recibido');
    }
    const baseUrl = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
    const receiptUrl = `${baseUrl}/uploads/receipts/${file.filename}`;
    return this.ordersService.uploadReceipt(req.user.sub, req.user.role, id, receiptUrl);
  }
}