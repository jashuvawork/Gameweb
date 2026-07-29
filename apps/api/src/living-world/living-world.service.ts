import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { currentLivingWorldEvent, LIVING_WORLD_ROTATION } from '@jashuva/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LivingWorldService implements OnModuleInit {
  private readonly logger = new Logger(LivingWorldService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureActiveEvent();
    } catch (err) {
      this.logger.warn(`Living World seed skipped: ${(err as Error).message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async rotate() {
    await this.ensureActiveEvent();
  }

  async ensureActiveEvent() {
    const event = currentLivingWorldEvent();
    const weekStart = new Date();
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    await this.prisma.livingWorldEvent.updateMany({
      where: { active: true, key: { not: event.key } },
      data: { active: false },
    });

    return this.prisma.livingWorldEvent.upsert({
      where: { key: event.key },
      create: {
        key: event.key,
        title: event.title,
        description: event.description,
        region: event.region,
        startsAt: weekStart,
        endsAt: weekEnd,
        active: true,
        rewards: { type: 'cosmetic', note: 'Cosmetics only — no power advantages' },
      },
      update: {
        title: event.title,
        description: event.description,
        region: event.region,
        startsAt: weekStart,
        endsAt: weekEnd,
        active: true,
      },
    });
  }

  async current() {
    const active = await this.prisma.livingWorldEvent.findFirst({
      where: { active: true },
      orderBy: { startsAt: 'desc' },
    });
    if (active) return { event: active, philosophy: 'The Living World evolves for everyone each week.' };
    const fallback = currentLivingWorldEvent();
    return { event: fallback, philosophy: 'The Living World evolves for everyone each week.' };
  }

  catalog() {
    return { rotation: LIVING_WORLD_ROTATION };
  }
}
