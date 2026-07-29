import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { FreeTierService } from './free-tier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('free-tier')
export class FreeTierController {
  constructor(private free: FreeTierService) {}

  @Get('overview')
  @UseGuards(OptionalJwtGuard)
  overview(@CurrentUser() user?: { id: string }) {
    return this.free.overview(user?.id);
  }

  @Get('missions')
  @UseGuards(JwtAuthGuard)
  missions(@CurrentUser() user: { id: string }) {
    return this.free.dailyMissions(user.id);
  }

  @Post('missions/:key/complete')
  @UseGuards(JwtAuthGuard)
  completeMission(@CurrentUser() user: { id: string }, @Param('key') key: string) {
    return this.free.completeMission(user.id, key);
  }

  @Get('weekly')
  @UseGuards(OptionalJwtGuard)
  weekly() {
    return this.free.weeklyChallenge();
  }

  @Get('season')
  season() {
    return this.free.seasonalEvent();
  }

  @Get('leaderboard')
  leaderboard(@Query('game') game?: string, @Query('take') take?: string) {
    return this.free.leaderboard(game, take ? Number(take) : 20);
  }

  @Post('rewarded-ad')
  @UseGuards(JwtAuthGuard)
  rewarded(
    @CurrentUser() user: { id: string },
    @Body() body: { reward: 'double_coins' | 'extra_life' | 'chest' | 'spin' },
  ) {
    return this.free.claimRewardedAd(user.id, body.reward || 'double_coins');
  }

  @Post('collect')
  @UseGuards(JwtAuthGuard)
  collect(
    @CurrentUser() user: { id: string },
    @Body() body: { gems?: number; crystals?: number; relics?: number; heroCards?: number; coins?: number },
  ) {
    return this.free.addCollectibles(user.id, body);
  }
}
