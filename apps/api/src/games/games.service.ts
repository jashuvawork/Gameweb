import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GameAccess, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async list(query: {
    genre?: string;
    access?: GameAccess;
    search?: string;
    featured?: boolean;
    trending?: boolean;
    take?: number;
    skip?: number;
  }) {
    const where: Record<string, unknown> = { published: true, hidden: false };
    if (query.genre) where.genres = { has: query.genre };
    if (query.access) where.access = query.access;
    if (query.featured) where.featured = true;
    if (query.trending) where.trending = true;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search.toLowerCase() } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { trending: 'desc' }, { playCount: 'desc' }],
        take: query.take ?? 50,
        skip: query.skip ?? 0,
      }),
      this.prisma.game.count({ where }),
    ]);
    return { items, total };
  }

  async bySlug(slug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game || game.hidden || !game.published) throw new NotFoundException('Game not found');
    return game;
  }

  async canPlay(userId: string | undefined, slug: string) {
    const game = await this.bySlug(slug);
    if (game.access === GameAccess.FREE) return { allowed: true, game };

    if (!userId) throw new ForbiddenException('Login required');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const premium =
      user.subscription === SubscriptionTier.PREMIUM_MONTHLY ||
      user.subscription === SubscriptionTier.PREMIUM_YEARLY ||
      user.subscription === SubscriptionTier.FAMILY;

    if (premium) return { allowed: true, game };

    const unlocked = await this.prisma.inventoryItem.findFirst({
      where: { userId, itemType: 'game_unlock', itemKey: game.slug },
    });
    if (unlocked) return { allowed: true, game };

    if (game.access === GameAccess.CREDITS) {
      const cost = game.creditCost || 25;
      if (user.credits >= cost) {
        return { allowed: true, game, unlockWithCredits: true, cost };
      }
      return { allowed: false, game, reason: 'credits_required', cost };
    }

    return { allowed: false, game, reason: 'premium_required' };
  }

  async unlockWithCredits(userId: string, slug: string) {
    const { game, allowed, unlockWithCredits, cost } = await this.canPlay(userId, slug);
    if (allowed && !unlockWithCredits) return { unlocked: true, game };
    if (!unlockWithCredits) throw new ForbiddenException('Cannot unlock with credits');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost || 0 } },
      }),
      this.prisma.inventoryItem.create({
        data: {
          userId,
          itemType: 'game_unlock',
          itemKey: game.slug,
        },
      }),
      this.prisma.purchase.create({
        data: {
          userId,
          type: 'CREDIT_SPEND',
          amount: 0,
          credits: -(cost || 0),
          metadata: { gameSlug: game.slug },
        },
      }),
    ]);
    return { unlocked: true, game };
  }

  async startPlay(userId: string, gameId: string) {
    const session = await this.prisma.playSession.create({
      data: { userId, gameId },
    });
    await this.prisma.game.update({
      where: { id: gameId },
      data: { playCount: { increment: 1 } },
    });
    return session;
  }

  async endPlay(userId: string, sessionId: string, score: number, duration: number) {
    return this.prisma.playSession.updateMany({
      where: { id: sessionId, userId },
      data: { score, duration, endedAt: new Date() },
    });
  }

  async saveCloud(userId: string, gameId: string, slot: number, data: object) {
    return this.prisma.cloudSave.upsert({
      where: { userId_gameId_slot: { userId, gameId, slot } },
      create: { userId, gameId, slot, data },
      update: { data, version: { increment: 1 } },
    });
  }

  async loadCloud(userId: string, gameId: string, slot = 0) {
    return this.prisma.cloudSave.findUnique({
      where: { userId_gameId_slot: { userId, gameId, slot } },
    });
  }

  async continuePlaying(userId: string) {
    const sessions = await this.prisma.playSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 12,
      include: { game: true },
      distinct: ['gameId'],
    });
    return sessions.map((s) => s.game);
  }
}
