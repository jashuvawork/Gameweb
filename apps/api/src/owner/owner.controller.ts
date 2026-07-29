import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Role, UserStatus, GameAccess } from '@prisma/client';
import { OwnerService } from './owner.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Require2FA } from './require-2fa.decorator';
import { TwoFactorGuard } from './two-factor.guard';

@Controller('owner')
@UseGuards(JwtAuthGuard, RolesGuard, TwoFactorGuard)
@Roles(Role.SUPER_OWNER)
@Require2FA()
export class OwnerController {
  constructor(private owner: OwnerService) {}

  private noIndex(res: Response) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: { id: string }, @Res({ passthrough: true }) res: Response) {
    this.noIndex(res);
    return this.owner.dashboard(user.id);
  }

  @Get('users')
  users(
    @Res({ passthrough: true }) res: Response,
    @Query('q') q?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.noIndex(res);
    return this.owner.listUsers(q, take ? Number(take) : 50, skip ? Number(skip) : 0);
  }

  @Patch('users/:id/status')
  status(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { status: UserStatus },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.updateUserStatus(user.id, id, body.status, req.ip);
  }

  @Post('users/:id/credits')
  credits(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { credits: number },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.grantCredits(user.id, id, body.credits, req.ip);
  }

  @Post('users/:id/premium')
  premium(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { days: number },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.grantPremium(user.id, id, body.days || 30, req.ip);
  }

  @Post('users/:id/reset-password')
  resetPassword(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.resetPassword(user.id, id, body.password, req.ip);
  }

  @Get('games')
  async games(@Res({ passthrough: true }) res: Response) {
    this.noIndex(res);
    return this.owner.listGames();
  }

  @Post('games')
  createGame(
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      slug: string;
      title: string;
      description: string;
      genres: string[];
      access?: GameAccess;
      creditCost?: number;
      engine?: string;
      featured?: boolean;
      trending?: boolean;
      endlessStory?: boolean;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.upsertGame(user.id, {
      slug: body.slug,
      title: body.title,
      description: body.description,
      genres: body.genres,
      tags: [],
      access: body.access || GameAccess.FREE,
      creditCost: body.creditCost || 0,
      engine: body.engine || 'canvas',
      featured: body.featured || false,
      trending: body.trending || false,
      endlessStory: body.endlessStory || false,
    });
  }

  @Patch('games/:id')
  updateGame(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.upsertGame(user.id, body as never, id);
  }

  @Delete('games/:id')
  deleteGame(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.deleteGame(user.id, id);
  }

  @Get('analytics')
  analytics(@Res({ passthrough: true }) res: Response) {
    this.noIndex(res);
    return this.owner.analytics();
  }

  @Get('server-status')
  serverStatus(@Res({ passthrough: true }) res: Response) {
    this.noIndex(res);
    return this.owner.serverStatus();
  }

  @Get('logs')
  logs(@Res({ passthrough: true }) res: Response, @Query('take') take?: string) {
    this.noIndex(res);
    return this.owner.logs(take ? Number(take) : 100);
  }

  @Get('settings')
  settings(@Res({ passthrough: true }) res: Response) {
    this.noIndex(res);
    return this.owner.getSettings();
  }

  @Post('settings')
  setSetting(
    @CurrentUser() user: { id: string },
    @Body() body: { key: string; value: unknown },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.setSetting(user.id, body.key, body.value as never);
  }

  @Post('backups')
  backup(@CurrentUser() user: { id: string }, @Res({ passthrough: true }) res: Response) {
    this.noIndex(res);
    return this.owner.createBackup(user.id);
  }

  @Post('backups/:id/restore')
  restore(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.restoreBackup(user.id, id);
  }

  @Post('notifications/broadcast')
  broadcast(
    @CurrentUser() user: { id: string },
    @Body() body: { title: string; body: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.broadcastNotification(user.id, body.title, body.body);
  }

  @Get('reports')
  reports(@Res({ passthrough: true }) res: Response, @Query('status') status?: string) {
    this.noIndex(res);
    return this.owner.listReports(status || 'open');
  }

  @Post('reports/:id/resolve')
  resolveReport(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { resolution: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.resolveReport(user.id, id, body.resolution);
  }

  @Post('coupons')
  coupon(
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      code: string;
      discountPct?: number;
      discountAmt?: number;
      creditBonus?: number;
      maxUses?: number;
      expiresAt?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.noIndex(res);
    return this.owner.createCoupon(user.id, body);
  }
}
