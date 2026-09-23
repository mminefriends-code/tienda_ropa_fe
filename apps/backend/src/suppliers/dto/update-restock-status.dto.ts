import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RestockStatus } from '@prisma/client';

export class UpdateRestockStatusDto {
  @ApiProperty({ enum: RestockStatus, example: RestockStatus.RECEIVED })
  @IsEnum(RestockStatus)
  status: RestockStatus;
}