import { Injectable, BadRequestException } from '@nestjs/common';
import { AVATAR_CLASSES, COMPANION_TYPES } from '@jashuva/shared';
import { PrismaService } from '../prisma/prisma.service';

const DAILY_REWARDS = [
  { day: 1, coins: 50, credits: 0, xp: 25 },
  { day: 2, coins: 75, credits: 0, xp: 30 },
  { day: 3, coins: 100, credits: 1, xp: 40 },
  { day: 4, coins: 125, credits: 0, xp: 50 },
  { day: 5, coins: 150, credits: 2, xp: 60 },
  { day: 6, coins: 200, credits: 0, xp: 75 },
  { day: 7, coins: 300, credits: 5, xp: 100, cosmeticId: 'frame-streak-7' },
];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async profile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        avatarClass: true,
        companionType: true,
        companionName: true,
        playerTitle: true,
        cosmetics: true,
        role: true,
        xp: true,
        level: true,
        coins: true,
        credits: true,
        gems: true,
        crystals: true,
        relics: true,
        heroCards: true,
        subscription: true,
        subscriptionEnds: true,
        twoFactorEnabled: true,
        achievements: { include: { achievement: true } },
        inventory: true,
        createdAt: true,
      },
    });
  }

  async stats(userId: string) {
    const [plays, totalTime, achievements] = await Promise.all([
      this.prisma.playSession.count({ where: { userId } }),
      this.prisma.playSession.aggregate({ where: { userId }, _sum: { duration: true } }),
      this.prisma.userAchievement.count({ where: { userId } }),
    ]);
    return {
      plays,
      totalPlayTime: totalTime._sum.duration || 0,
      achievements,
    };
  }

  async claimDaily(userId: string) {
    const last = await this.prisma.dailyRewardClaim.findFirst({
      where: { userId },
      orderBy: { claimedAt: 'desc' },
    });
    const now = new Date();
    if (last) {
      const sameDay = last.claimedAt.toDateString() === now.toDateString();
      if (sameDay) throw new BadRequestException('Already claimed today');
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const streakContinues = last && last.claimedAt.toDateString() === yesterday.toDateString();
    const streak = streakContinues ? last!.streak + 1 : 1;
    const day = ((streak - 1) % 7) + 1;
    const reward = DAILY_REWARDS[day - 1];

    await this.prisma.$transaction([
      this.prisma.dailyRewardClaim.create({
        data: { userId, day, streak },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: reward.coins },
          credits: { increment: reward.credits },
          xp: { increment: reward.xp },
        },
      }),
    ]);

    if (reward.cosmeticId) {
      await this.prisma.inventoryItem.create({
        data: {
          userId,
          itemType: 'frame',
          itemKey: reward.cosmeticId,
          metadata: { name: 'Streak Frame', source: 'daily' },
        },
      });
    }

    return { reward, streak, day };
  }

  async devices(userId: string) {
    return this.prisma.device.findMany({ where: { userId }, orderBy: { lastSeenAt: 'desc' } });
  }

  async loginHistory(userId: string) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      avatarUrl?: string;
      avatarClass?: string;
      companionType?: string;
      companionName?: string;
      playerTitle?: string;
      cosmetics?: Record<string, string>;
    },
  ) {
    if (data.avatarClass && !AVATAR_CLASSES.includes(data.avatarClass as never)) {
      throw new BadRequestException('Invalid avatar class');
    }
    if (data.companionType && !COMPANION_TYPES.includes(data.companionType as never)) {
      throw new BadRequestException('Invalid companion type');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        avatarClass: data.avatarClass,
        companionType: data.companionType,
        companionName: data.companionName,
        playerTitle: data.playerTitle,
        cosmetics: data.cosmetics as never,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        avatarClass: true,
        companionType: true,
        companionName: true,
        playerTitle: true,
        cosmetics: true,
      },
    });
  }

  async equipItem(userId: string, itemId: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id: itemId, userId } });
    if (!item) throw new BadRequestException('Item not found');
    await this.prisma.$transaction([
      this.prisma.inventoryItem.updateMany({
        where: { userId, itemType: item.itemType },
        data: { equipped: false },
      }),
      this.prisma.inventoryItem.update({
        where: { id: item.id },
        data: { equipped: true },
      }),
    ]);
    return { ok: true, equipped: item.itemKey };
  }

  async friends(userId: string) {
    return this.prisma.friendship.findMany({
      where: { OR: [{ userId }, { friendId: userId }], status: 'accepted' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarClass: true } },
        friend: { select: { id: true, username: true, displayName: true, avatarClass: true } },
      },
    });
  }

  async requestFriend(userId: string, friendUsername: string) {
    const friend = await this.prisma.user.findUnique({ where: { username: friendUsername.toLowerCase() } });
    if (!friend || friend.id === userId) throw new BadRequestException('User not found');
    return this.prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId: friend.id } },
      create: { userId, friendId: friend.id, status: 'pending' },
      update: { status: 'pending' },
    });
  }
}
