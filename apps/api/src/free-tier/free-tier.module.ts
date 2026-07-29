import { Module } from '@nestjs/common';
import { FreeTierController } from './free-tier.controller';
import { FreeTierService } from './free-tier.service';

@Module({
  controllers: [FreeTierController],
  providers: [FreeTierService],
  exports: [FreeTierService],
})
export class FreeTierModule {}
