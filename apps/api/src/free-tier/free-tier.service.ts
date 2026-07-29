import { BadRequestException, Injectable } from '@nestjs/common';
import { FREE_TIER_GAMES } from '../seed/catalog/free-tier';
import { PrismaService } from '../prisma/prisma.service';

const DAILY_MISSIONS = [
  { key: 'finish_3_races', title: 'Finish 3 races', description: 'Complete 3 runs in any Racing free game', reward: { coins: 40, xp: 30, gems: 2 } },
  { key: 'defeat_50', title: 'Defeat 50 enemies', description: 'Clear 50 foes in Action free games', reward: { coins: 50, xp: 40, crystals: 1 } },
  { key: 'no_damage_level', title: 'Flawless clear', description: 'Complete one run without taking a fatal hit (survive 60s)', reward: { coins: 60, xp: 50, relics: 1 } },
];

const WEEKLY = [
  { key: 'time_trial', title: 'Beat a time trial', description: 'Score 8,000+ in Neon Drift or Street Sprint' },
  { key: 'hidden_areas', title: 'Discover hidden areas', description: 'Find 3 secrets across Adventure games' },
  { key: 'bonus_achievements', title: 'Earn bonus achievements', description: 'Unlock 2 achievements this week' },
];

const SEASONS = [
  { key: 'halloween', title: 'Halloween Zombie Event', description: 'Extra hero cards in Zombie Escape. Cosmetic pumpkin trails.', month: 10 },
  { key: 'christmas', title: 'Christmas Snow Festival', description: 'Snow skins for racers + double gems weekends.', month: 12 },
  { key: 'summer', title: 'Summer Racing Cup', description: 'Leaderboard cups across all free racers.', month: 7 },
  { key: 'lunar', title: 'Lunar New Year Celebration', description: 'Lucky chests and red-frame cosmetics.', month: 2 },
];

@Injectable()
export class FreeTierService {
  constructor(private prisma: PrismaService) {}

  async overview(userId?: string) {
    const season = this.seasonalEvent();
    const weekly = this.weeklyChallenge();
    let wallet: {
      coins: number;
      gems: number;
      crystals: number;
      relics: number;
      heroCards: number;
      xp: number;
      level: number;
      avatarClass: string | null;
    } | null = null;
    let missions = DAILY_MISSIONS.map((m) => ({ ...m, completed: false }));
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { coins: true, gems: true, crystals: true, relics: true, heroCards: true, xp: true, level: true, avatarClass: true },
      });
      wallet = user;
      const done = await this.prisma.inventoryItem.findMany({
        where: { userId, itemType: 'daily_mission', acquiredAt: { gte: startOfDay() } },
      });
      const keys = new Set(done.map((d) => d.itemKey));
      missions = DAILY_MISSIONS.map((m) => ({ ...m, completed: keys.has(m.key) }));
    }
    return {
      freeGames: FREE_TIER_GAMES,
      missions,
      weekly,
      season,
      wallet,
      philosophy: 'Free games are complete — attract, build trust, convert with clear Premium value.',
      benefits: [
        'Unlimited free games',
        'Cloud save',
        'Daily rewards & missions',
        'Achievements & leaderboards',
        'Basic avatar customisation',
        'Seasonal events',
        'Friends list',
      ],
    };
  }

  dailyMissions(userId: string) {
    return this.overview(userId).then((o) => ({ missions: o.missions, wallet: o.wallet }));
  }

  async completeMission(userId: string, key: string) {
    const mission = DAILY_MISSIONS.find((m) => m.key === key);
    if (!mission) throw new BadRequestException('Unknown mission');
    const existing = await this.prisma.inventoryItem.findFirst({
      where: { userId, itemType: 'daily_mission', itemKey: key, acquiredAt: { gte: startOfDay() } },
    });
    if (existing) throw new BadRequestException('Already completed today');

    await this.prisma.$transaction([
      this.prisma.inventoryItem.create({
        data: { userId, itemType: 'daily_mission', itemKey: key, metadata: { title: mission.title } },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: mission.reward.coins },
          xp: { increment: mission.reward.xp },
          gems: { increment: mission.reward.gems || 0 },
          crystals: { increment: mission.reward.crystals || 0 },
          relics: { increment: mission.reward.relics || 0 },
        },
      }),
    ]);
    return { ok: true, reward: mission.reward };
  }

  weeklyChallenge() {
    const week = Math.floor(Date.now() / (7 * 86400000));
    return WEEKLY[week % WEEKLY.length];
  }

  seasonalEvent() {
    const month = new Date().getUTCMonth() + 1;
    return SEASONS.find((s) => s.month === month) || {
      key: 'living-pulse',
      title: 'Living Pulse Festival',
      description: 'Rotating free-tier cosmetics and double daily mission rewards this month.',
      month,
    };
  }

  async leaderboard(gameSlug?: string, take = 20) {
    const where = gameSlug
      ? { game: { slug: gameSlug }, endedAt: { not: null } }
      : { endedAt: { not: null }, game: { access: 'FREE' as const } };
    const sessions = await this.prisma.playSession.findMany({
      where,
      orderBy: { score: 'desc' },
      take,
      include: {
        user: { select: { username: true, displayName: true, avatarClass: true, playerTitle: true } },
        game: { select: { slug: true, title: true } },
      },
    });
    return {
      items: sessions.map((s, i) => ({
        rank: i + 1,
        score: s.score,
        username: s.user.username,
        displayName: s.user.displayName,
        avatarClass: s.user.avatarClass,
        title: s.user.playerTitle,
        game: s.game.title,
        slug: s.game.slug,
      })),
    };
  }

  async claimRewardedAd(userId: string, reward: string) {
    const today = await this.prisma.inventoryItem.count({
      where: { userId, itemType: 'rewarded_ad', acquiredAt: { gte: startOfDay() } },
    });
    if (today >= 8) throw new BadRequestException('Daily rewarded ad limit reached — stay in control');

    const grants: Record<string, { coins?: number; gems?: number; crystals?: number; note: string }> = {
      double_coins: { coins: 40, note: 'Double coins for your next match vibe' },
      extra_life: { coins: 15, gems: 1, note: 'Extra life token (cosmetic cheer + soft assist)' },
      chest: { coins: 25, gems: 2, crystals: 1, note: 'Treasure chest opened' },
      spin: { coins: 30, gems: 3, note: 'Extra daily spin result' },
    };
    const g = grants[reward] || grants.double_coins;

    await this.prisma.$transaction([
      this.prisma.inventoryItem.create({
        data: { userId, itemType: 'rewarded_ad', itemKey: reward, metadata: g },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: g.coins || 0 },
          gems: { increment: g.gems || 0 },
          crystals: { increment: g.crystals || 0 },
        },
      }),
    ]);
    return { ok: true, reward: g, remainingToday: 7 - today };
  }

  async addCollectibles(
    userId: string,
    body: { gems?: number; crystals?: number; relics?: number; heroCards?: number; coins?: number },
  ) {
    const clamp = (n?: number) => Math.max(0, Math.min(25, Math.floor(n || 0)));
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        gems: { increment: clamp(body.gems) },
        crystals: { increment: clamp(body.crystals) },
        relics: { increment: clamp(body.relics) },
        heroCards: { increment: clamp(body.heroCards) },
        coins: { increment: clamp(body.coins) },
      },
      select: { coins: true, gems: true, crystals: true, relics: true, heroCards: true, xp: true, level: true },
    });
  }
}

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
