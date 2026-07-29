import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { GameAccess, PublishChannel, PublishJobStatus, QueueItemStatus, Role } from '@prisma/client';
import { PublisherService } from './publisher.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Require2FA } from '../owner/require-2fa.decorator';
import { TwoFactorGuard } from '../owner/two-factor.guard';

@Controller('owner/publisher')
@UseGuards(JwtAuthGuard, RolesGuard, TwoFactorGuard)
@Roles(Role.SUPER_OWNER)
@Require2FA()
export class PublisherController {
  constructor(private publisher: PublisherService) {}

  private noIndex(res: Response) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  @Get('jobs')
  listJobs(@Res({ passthrough: true }) res: Response, @Query('status') status?: PublishJobStatus) {
    this.noIndex(res);
    return this.publisher.listJobs(status);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    this.noIndex(res);
    return this.publisher.getJob(id);
  }

  @Post('jobs')
  createJob(
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      title: string;
      slug?: string;
      description: string;
      tagline?: string;
      genres?: string[];
      access?: GameAccess;
      creditCost?: number;
      engine?: string;
      featured?: boolean;
      trailerUrl?: string;
      screenshotUrls?: string[];
      thumbnailUrl?: string;
      coverUrl?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.publisher.createJob(user.id, body);
  }

  @Patch('jobs/:id')
  updateJob(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.publisher.updateJob(user.id, id, body);
  }

  @Post('jobs/:id/generate-assets')
  generate(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.publisher.generateAssets(user.id, id);
  }

  @Post('jobs/:id/publish-site')
  publishSite(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.publisher.publishSite(user.id, id);
  }

  @Post('jobs/:id/queue-external')
  queueExternal(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { channels?: PublishChannel[] },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.publisher.queueExternal(user.id, id, body.channels);
  }

  @Get('queue')
  listQueue(@Res({ passthrough: true }) res: Response, @Query('status') status?: QueueItemStatus) {
    this.noIndex(res);
    return this.publisher.listQueue(status);
  }

  @Post('queue/:id/review')
  review(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { decision: 'approve' | 'reject' | 'export'; note?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.publisher.reviewQueueItem(user.id, id, body.decision, body.note);
  }

  @Get('analytics')
  analytics(@Res({ passthrough: true }) res: Response) {
    this.noIndex(res);
    return this.publisher.analyticsOverview();
  }

  @Get('ads-config')
  adsConfig(@Res({ passthrough: true }) res: Response) {
    this.noIndex(res);
    return this.publisher.getAdsConfig();
  }

  @Post('ads-config')
  setAdsConfig(
    @CurrentUser() user: { id: string },
    @Body() body: { adsEnabled?: boolean; adsenseClient?: string; slots?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.publisher.setAdsConfig(user.id, body);
  }
}

/** Public ads flags — no auth; used by website to hide ads when owner disables them */
@Controller('public')
export class PublicPublisherController {
  constructor(private publisher: PublisherService) {}

  @Get('ads-flags')
  adsFlags() {
    return this.publisher.publicAdsFlags();
  }
}
