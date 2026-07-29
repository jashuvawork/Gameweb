import { Controller, Get } from '@nestjs/common';
import { LivingWorldService } from './living-world.service';

@Controller('living-world')
export class LivingWorldController {
  constructor(private living: LivingWorldService) {}

  @Get()
  current() {
    return this.living.current();
  }

  @Get('rotation')
  rotation() {
    return this.living.catalog();
  }
}
