import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DAILY_REWARDS = [
  { day: 1, coins: 50, credits: 0, xp: 25 },
  { day: 2, coins: 75, credits: 0, xp: 30 },
  { day: 3, coins: 100, credits: 1, xp: 40 },
  { day: 4, coins: 125, credits: 0, xp: 50 },
  { day: 5, coins: 150, credits: 2, xp: 60 },
  { day: 6, coins: 200, credits: 0, xp: 75 },
  { day: 7, coins: 300, credits: 5, xp: 100 },
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
        role: true,
        xp: true,
        level: true,
        coins: true,
        credits: true,
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
      const sameDay =
        last.claimedAt.toDateString() === now.toDateString();
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

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });
  }
}
