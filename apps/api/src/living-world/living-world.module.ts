import { Module } from '@nestjs/common';
import { LivingWorldService } from './living-world.service';
import { LivingWorldController } from './living-world.controller';

@Module({
  controllers: [LivingWorldController],
  providers: [LivingWorldService],
  exports: [LivingWorldService],
})
export class LivingWorldModule {}
