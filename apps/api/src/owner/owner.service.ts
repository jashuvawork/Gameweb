import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Role, UserStatus, GameAccess, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../common/audit.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OwnerService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  private assertSuperOwner(role: Role) {
    if (role !== Role.SUPER_OWNER) throw new ForbiddenException('SUPER_OWNER only');
  }

  async dashboard(actorId: string) {
    const [users, games, revenue, sessions, subscriptions] = await Promise.all([
      this.prisma.user.count({ where: { status: { not: UserStatus.DELETED } } }),
      this.prisma.game.count(),
      this.prisma.purchase.aggregate({ _sum: { amount: true } }),
      this.prisma.playSession.count({
        where: { startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.user.groupBy({ by: ['subscription'], _count: true }),
    ]);

    await this.audit.log({
      userId: actorId,
      action: 'OWNER_DASHBOARD_VIEW',
      resource: 'dashboard',
    });

    return {
      users,
      games,
      revenue: revenue._sum.amount || 0,
      dailyPlaySessions: sessions,
      subscriptions,
      redis: await this.redis.health(),
      timestamp: new Date().toISOString(),
    };
  }

  async listUsers(q?: string, take = 50, skip = 0) {
    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { username: { contains: q, mode: 'insensitive' as const } },
          ],
          role: { not: Role.SUPER_OWNER },
        }
      : { role: { not: Role.SUPER_OWNER } };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          status: true,
          subscription: true,
          credits: true,
          coins: true,
          level: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async updateUserStatus(actorId: string, userId: string, status: UserStatus, ip?: string) {
    const target = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (target.role === Role.SUPER_OWNER) throw new ForbiddenException('Cannot modify SUPER_OWNER');
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { status } });
    await this.audit.log({
      userId: actorId,
      action: `USER_${status}`,
      resource: 'user',
      resourceId: userId,
      ipAddress: ip,
    });
    return updated;
  }

  async grantCredits(actorId: string, userId: string, credits: number, ip?: string) {
    const target = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (target.role === Role.SUPER_OWNER && actorId !== userId) {
      throw new ForbiddenException();
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: credits } },
    });
    await this.prisma.purchase.create({
      data: {
        userId,
        type: 'GRANT',
        amount: 0,
        credits,
        metadata: { grantedBy: actorId },
      },
    });
    await this.audit.log({
      userId: actorId,
      action: credits >= 0 ? 'CREDITS_GRANT' : 'CREDITS_REMOVE',
      resource: 'user',
      resourceId: userId,
      ipAddress: ip,
      metadata: { credits },
    });
    return updated;
  }

  async grantPremium(actorId: string, userId: string, days: number, ip?: string) {
    const ends = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscription: 'PREMIUM_MONTHLY',
        subscriptionEnds: ends,
      },
    });
    await this.audit.log({
      userId: actorId,
      action: 'PREMIUM_GRANT',
      resource: 'user',
      resourceId: userId,
      ipAddress: ip,
      metadata: { days },
    });
    return updated;
  }

  async resetPassword(actorId: string, userId: string, newPassword: string, ip?: string) {
    const target = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (target.role === Role.SUPER_OWNER) throw new ForbiddenException('Reset SUPER_OWNER via secure channel');
    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      userId: actorId,
      action: 'PASSWORD_RESET',
      resource: 'user',
      resourceId: userId,
      ipAddress: ip,
    });
    return { ok: true };
  }

  async upsertGame(actorId: string, data: Prisma.GameCreateInput, id?: string) {
    const game = id
      ? await this.prisma.game.update({ where: { id }, data })
      : await this.prisma.game.create({ data });
    await this.audit.log({
      userId: actorId,
      action: id ? 'GAME_UPDATE' : 'GAME_CREATE',
      resource: 'game',
      resourceId: game.id,
    });
    return game;
  }

  async deleteGame(actorId: string, id: string) {
    await this.prisma.game.delete({ where: { id } });
    await this.audit.log({ userId: actorId, action: 'GAME_DELETE', resource: 'game', resourceId: id });
    return { ok: true };
  }

  async getSettings() {
    const rows = await this.prisma.setting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async setSetting(actorId: string, key: string, value: Prisma.InputJsonValue) {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    await this.audit.log({
      userId: actorId,
      action: 'SETTING_UPDATE',
      resource: 'setting',
      resourceId: key,
    });
    return setting;
  }

  async analytics() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [dau, mau, topGames, revenue] = await Promise.all([
      this.prisma.playSession.groupBy({
        by: ['userId'],
        where: { startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: since } } }),
      this.prisma.game.findMany({ orderBy: { playCount: 'desc' }, take: 10 }),
      this.prisma.purchase.groupBy({
        by: ['type'],
        _sum: { amount: true },
        where: { createdAt: { gte: since } },
      }),
    ]);
    return {
      dailyUsers: dau.length,
      monthlyUsers: mau,
      topGames,
      revenueByType: revenue,
    };
  }

  async serverStatus() {
    const mem = process.memoryUsage();
    return {
      uptime: process.uptime(),
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
      },
      node: process.version,
      redis: await this.redis.health(),
      env: process.env.NODE_ENV,
    };
  }

  async logs(take = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { email: true, username: true, role: true } } },
    });
  }

  async createBackup(actorId: string) {
    const dir = this.config.get('BACKUP_PATH') || './backups';
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const snapshot = {
      users: await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          credits: true,
          subscription: true,
        },
      }),
      games: await this.prisma.game.findMany(),
      settings: await this.prisma.setting.findMany(),
      createdAt: new Date().toISOString(),
    };

    const keyMaterial = this.config.get('BACKUP_ENCRYPTION_KEY') || 'dev-backup-key';
    const key = scryptSync(keyMaterial, 'jashuva-salt', 32);
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const json = JSON.stringify(snapshot);
    const enc = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const filename = `backup-${Date.now()}.jgenc`;
    const payload = Buffer.concat([iv, tag, enc]);
    writeFileSync(join(dir, filename), payload);

    const record = await this.prisma.backup.create({
      data: { filename, sizeBytes: payload.length, encrypted: true },
    });
    await this.audit.log({
      userId: actorId,
      action: 'BACKUP_CREATE',
      resource: 'backup',
      resourceId: record.id,
    });
    return record;
  }

  async restoreBackup(actorId: string, backupId: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id: backupId } });
    if (!backup) throw new NotFoundException('Backup not found');
    const dir = this.config.get('BACKUP_PATH') || './backups';
    const raw = readFileSync(join(dir, backup.filename));
    const iv = raw.subarray(0, 16);
    const tag = raw.subarray(16, 32);
    const data = raw.subarray(32);
    const keyMaterial = this.config.get('BACKUP_ENCRYPTION_KEY') || 'dev-backup-key';
    const key = scryptSync(keyMaterial, 'jashuva-salt', 32);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    const snapshot = JSON.parse(json) as { settings: { key: string; value: Prisma.InputJsonValue }[] };

    for (const s of snapshot.settings || []) {
      await this.prisma.setting.upsert({
        where: { key: s.key },
        create: { key: s.key, value: s.value },
        update: { value: s.value },
      });
    }

    await this.audit.log({
      userId: actorId,
      action: 'BACKUP_RESTORE',
      resource: 'backup',
      resourceId: backupId,
    });
    return { ok: true, restoredSettings: snapshot.settings?.length || 0 };
  }

  async broadcastNotification(actorId: string, title: string, body: string) {
    const n = await this.prisma.notification.create({
      data: { title, body, broadcast: true, type: 'announcement' },
    });
    await this.audit.log({
      userId: actorId,
      action: 'NOTIFICATION_BROADCAST',
      resource: 'notification',
      resourceId: n.id,
    });
    return n;
  }

  async listGames() {
    return this.prisma.game.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async listReports(status = 'open') {
    return this.prisma.report.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      include: { reporter: { select: { username: true, email: true } } },
    });
  }

  async resolveReport(actorId: string, id: string, resolution: string) {
    const report = await this.prisma.report.update({
      where: { id },
      data: { status: 'resolved', resolution, resolvedAt: new Date() },
    });
    await this.audit.log({
      userId: actorId,
      action: 'REPORT_RESOLVE',
      resource: 'report',
      resourceId: id,
    });
    return report;
  }

  async createCoupon(actorId: string, data: {
    code: string;
    discountPct?: number;
    discountAmt?: number;
    creditBonus?: number;
    maxUses?: number;
    expiresAt?: string;
  }) {
    const coupon = await this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountPct: data.discountPct,
        discountAmt: data.discountAmt,
        creditBonus: data.creditBonus || 0,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    await this.audit.log({
      userId: actorId,
      action: 'COUPON_CREATE',
      resource: 'coupon',
      resourceId: coupon.id,
    });
    return coupon;
  }
}
