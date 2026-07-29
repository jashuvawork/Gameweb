import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('summary')
  summary() {
    return this.analytics.publicSummary();
  }

  @Post('track')
  @UseGuards(OptionalJwtGuard)
  track(
    @Body() body: { event: string; meta?: object },
    @CurrentUser() user?: { id: string },
  ) {
    return this.analytics.track(body.event, user?.id, body.meta);
  }
}
