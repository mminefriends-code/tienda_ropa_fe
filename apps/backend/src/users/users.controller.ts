import { Controller, Get, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRoles } from '../auth/decorators/roles.decorator';

@ApiTags('Usuarios')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  async me(@Request() req: any) {
    return this.usersService.findById(req.user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  async updateMe(@Request() req: any, @Body() data: UpdateUserDto) {
    return this.usersService.update(req.user.sub, data);
  }

  @Get('me/measurements')
  @ApiOperation({ summary: 'Obtener mis medidas corporales' })
  async getMyMeasurements(@Request() req: any) {
    return this.usersService.getMeasurements(req.user.sub);
  }

  @Put('me/measurements')
  @ApiOperation({ summary: 'Actualizar mis medidas corporales' })
  async updateMyMeasurements(@Request() req: any, @Body() data: any) {
    return this.usersService.updateMeasurements(req.user.sub, data);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiOperation({ summary: 'Listar usuarios (admin)' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('role') role?: string) {
    return this.usersService.findAll(Number(page), Number(limit), role);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiOperation({ summary: 'Obtener usuario por ID (admin)' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Actualizar usuario (admin)' })
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Eliminar usuario (admin)' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}