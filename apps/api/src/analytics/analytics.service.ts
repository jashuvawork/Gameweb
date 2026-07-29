import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(event: string, userId?: string, meta?: object) {
    // Lightweight event store via audit log for MVP analytics pipeline
    return this.prisma.auditLog.create({
      data: {
        userId,
        action: `ANALYTICS_${event}`,
        resource: 'analytics',
        metadata: meta as never,
      },
    });
  }

  async publicSummary() {
    const [games, plays] = await Promise.all([
      this.prisma.game.count({ where: { published: true, hidden: false } }),
      this.prisma.playSession.count(),
    ]);
    return { games, plays, brand: 'Jgames' };
  }
}
