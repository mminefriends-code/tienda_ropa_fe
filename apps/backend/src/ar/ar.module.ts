import { Module } from '@nestjs/common';
import { ArService } from './ar.service';
import { ArController } from './ar.controller';

@Module({
  controllers: [ArController],
  providers: [ArService],
  exports: [ArService],
})
export class ArModule {}