import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async forUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { OR: [{ userId }, { broadcast: true }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, OR: [{ userId }, { broadcast: true }] },
      data: { read: true },
    });
  }
}
