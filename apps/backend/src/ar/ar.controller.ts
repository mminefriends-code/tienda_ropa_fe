import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArService } from './ar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRoles } from '../auth/decorators/roles.decorator';

@ApiTags('Realidad Aumentada')
@Controller('ar')
export class ArController {
  constructor(private arService: ArService) {}

  @Get('models/:productId')
  @ApiOperation({ summary: 'Obtener modelos AR para un producto' })
  async getModels(@Param('productId') productId: string) {
    return this.arService.getArModelsForProduct(productId);
  }

  @Get('models/admin/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los modelos AR de un producto (admin)' })
  async getModelsAdmin(@Param('productId') productId: string) {
    return this.arService.getArModelsForProductAdmin(productId);
  }

  @Get('models/detail/:id')
  @ApiOperation({ summary: 'Obtener modelo AR por ID' })
  async getModelById(@Param('id') id: string) {
    return this.arService.getArModelById(id);
  }

  @Post('session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar sesión AR' })
  async createSession(@Request() req: any, @Body() data: { productId: string; variantId?: string; arModelId: string }) {
    return this.arService.createArSession(req.user.sub, data);
  }

  @Put('session/:sessionId/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Finalizar sesión AR' })
  async endSession(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
    @Body() data: { duration?: number; screenshotUrl?: string; rating?: number; feedback?: string },
  ) {
    return this.arService.endArSession(sessionId, req.user.sub, data);
  }

  @Get('sessions/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis sesiones AR' })
  async getMySessions(@Request() req: any) {
    return this.arService.getUserArSessions(req.user.sub);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analytics AR (admin)' })
  async getAnalytics(@Query('productId') productId?: string) {
    return this.arService.getArAnalytics(productId);
  }

  @Post('models')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear modelo AR (admin)' })
  async createModel(@Body() data: {
    productId: string;
    variantId?: string;
    name: string;
    modelUrl: string;
    thumbnailUrl?: string;
    format?: string;
    scale?: number;
    position?: Record<string, number>;
    rotation?: Record<string, number>;
    overlayImage?: string;
    overlayScale?: number;
    overlayOffsetY?: number;
  }) {
    return this.arService.createArModel(data);
  }

  @Put('models/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar modelo AR (admin)' })
  async updateModel(@Param('id') id: string, @Body() data: any) {
    return this.arService.updateArModel(id, data);
  }

  @Delete('models/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar modelo AR (admin)' })
  async deleteModel(@Param('id') id: string) {
    return this.arService.deleteArModel(id);
  }
}