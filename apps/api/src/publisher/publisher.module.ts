import { Module } from '@nestjs/common';
import { PublisherController, PublicPublisherController } from './publisher.controller';
import { PublisherService } from './publisher.service';
import { AuditService } from '../common/audit.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PublisherController, PublicPublisherController],
  providers: [PublisherService, AuditService],
  exports: [PublisherService],
})
export class PublisherModule {}
