import { Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { AuditService } from '../common/audit.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OwnerController],
  providers: [OwnerService, AuditService],
  exports: [OwnerService],
})
export class OwnerModule {}
