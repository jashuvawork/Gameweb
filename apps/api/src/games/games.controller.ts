import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { GameAccess } from '@prisma/client';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

@Controller('games')
export class GamesController {
  constructor(private games: GamesService) {}

  @Get()
  list(
    @Query('genre') genre?: string,
    @Query('access') access?: GameAccess,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
    @Query('trending') trending?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.games.list({
      genre,
      access,
      search,
      featured: featured === 'true',
      trending: trending === 'true',
      take: take ? Number(take) : 50,
      skip: skip ? Number(skip) : 0,
    });
  }

  @Get('continue')
  @UseGuards(JwtAuthGuard)
  continuePlaying(@CurrentUser() user: { id: string }) {
    return this.games.continuePlaying(user.id);
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.games.bySlug(slug);
  }

  @Get(':slug/access')
  @UseGuards(OptionalJwtGuard)
  access(@Param('slug') slug: string, @CurrentUser() user?: { id: string }) {
    return this.games.canPlay(user?.id, slug);
  }

  @Post(':slug/unlock')
  @UseGuards(JwtAuthGuard)
  unlock(@Param('slug') slug: string, @CurrentUser() user: { id: string }) {
    return this.games.unlockWithCredits(user.id, slug);
  }

  @Post(':slug/play')
  @UseGuards(JwtAuthGuard)
  async play(@Param('slug') slug: string, @CurrentUser() user: { id: string }) {
    const access = await this.games.canPlay(user.id, slug);
    if (!access.allowed && !access.unlockWithCredits) {
      return access;
    }
    const session = await this.games.startPlay(user.id, access.game.id);
    return { session, game: access.game };
  }

  @Post('sessions/:id/end')
  @UseGuards(JwtAuthGuard)
  end(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { score?: number; duration?: number },
  ) {
    return this.games.endPlay(user.id, id, body.score || 0, body.duration || 0);
  }

  @Post(':slug/cloud-save')
  @UseGuards(JwtAuthGuard)
  async cloudSave(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body() body: { slot?: number; data: object },
  ) {
    const game = await this.games.bySlug(slug);
    return this.games.saveCloud(user.id, game.id, body.slot ?? 0, body.data);
  }

  @Get(':slug/cloud-save')
  @UseGuards(JwtAuthGuard)
  async cloudLoad(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Query('slot') slot?: string,
  ) {
    const game = await this.games.bySlug(slug);
    return this.games.loadCloud(user.id, game.id, slot ? Number(slot) : 0);
  }
}
