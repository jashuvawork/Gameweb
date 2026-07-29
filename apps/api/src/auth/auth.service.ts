import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { createHash, randomBytes } from 'crypto';
import { Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../common/audit.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
    private audit: AuditService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email.toLowerCase() }, { username: dto.username.toLowerCase() }] },
    });
    if (existing) throw new BadRequestException('Email or username already in use');

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username.toLowerCase(),
        displayName: dto.displayName || dto.username,
        passwordHash,
        role: Role.USER,
        emailVerifyToken: randomBytes(32).toString('hex'),
      },
    });

    await this.audit.log({
      userId: user.id,
      action: 'AUTH_REGISTER',
      resource: 'user',
      resourceId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return this.issueTokens(user.id, user.email, user.role, ip, userAgent);
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const failKey = `auth:fail:${ip || 'unknown'}:${dto.email.toLowerCase()}`;
    const fails = Number((await this.redis.get(failKey)) || '0');
    if (fails >= Number(this.config.get('AUTH_THROTTLE_LIMIT') || 5)) {
      if (!dto.captchaToken) {
        throw new HttpException('CAPTCHA required after failed attempts', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    const invalid = async (reason: string) => {
      await this.redis.incr(failKey);
      await this.redis.set(failKey, String(fails + 1), 900);
      if (user) {
        await this.prisma.loginHistory.create({
          data: { userId: user.id, ipAddress: ip, userAgent, success: false, reason },
        });
      }
      throw new UnauthorizedException('Invalid credentials');
    };

    if (!user || !user.passwordHash) await invalid('not_found');
    if (user!.status === UserStatus.BANNED || user!.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account restricted');
    }
    if (user!.status === UserStatus.DELETED) await invalid('deleted');

    const ok = await argon2.verify(user!.passwordHash!, dto.password);
    if (!ok) await invalid('bad_password');

    if (user!.twoFactorEnabled) {
      if (!dto.totpCode) {
        return { requires2FA: true, tempToken: await this.signTemp(user!.id) };
      }
      const valid = authenticator.verify({ token: dto.totpCode, secret: user!.twoFactorSecret! });
      if (!valid) await invalid('bad_2fa');
    }

    await this.redis.del(failKey);
    await this.prisma.user.update({
      where: { id: user!.id },
      data: { lastLoginAt: new Date(), lastActiveAt: new Date() },
    });
    await this.prisma.loginHistory.create({
      data: { userId: user!.id, ipAddress: ip, userAgent, success: true },
    });
    await this.audit.log({
      userId: user!.id,
      action: 'AUTH_LOGIN',
      resource: 'user',
      resourceId: user!.id,
      ipAddress: ip,
      userAgent,
    });

    return this.issueTokens(user!.id, user!.email, user!.role, ip, userAgent, dto.deviceFingerprint);
  }

  async ownerLogin(dto: LoginDto, ip?: string, userAgent?: string) {
    const result = await this.login(dto, ip, userAgent);
    if ('requires2FA' in result) return result;

    const payload = this.jwt.decode(result.accessToken) as { role: Role };
    if (payload.role !== Role.SUPER_OWNER && payload.role !== Role.ADMIN) {
      throw new ForbiddenException('Owner access denied');
    }
    if (payload.role === Role.SUPER_OWNER && !dto.totpCode) {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
      if (user?.twoFactorEnabled) {
        return { requires2FA: true, tempToken: await this.signTemp(user.id) };
      }
    }
    return result;
  }

  private async signTemp(userId: string) {
    return this.jwt.sign({ sub: userId, purpose: '2fa' }, { expiresIn: '5m' });
  }

  async issueTokens(
    userId: string,
    email: string,
    role: Role,
    ip?: string,
    userAgent?: string,
    deviceFingerprint?: string,
  ) {
    const accessToken = this.jwt.sign({ sub: userId, email, role });
    const refreshToken = randomBytes(48).toString('hex');
    const refreshHash = this.hashToken(refreshToken);
    const days = 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: refreshHash,
        ipAddress: ip,
        userAgent,
        deviceId: deviceFingerprint,
        expiresAt,
      },
    });

    if (deviceFingerprint) {
      await this.prisma.device.upsert({
        where: { userId_fingerprint: { userId, fingerprint: deviceFingerprint } },
        create: {
          userId,
          fingerprint: deviceFingerprint,
          name: userAgent?.slice(0, 80) || 'Unknown device',
          lastIp: ip,
        },
        update: { lastSeenAt: new Date(), lastIp: ip },
      });
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
      user: await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          avatarUrl: true,
          xp: true,
          level: true,
          coins: true,
          credits: true,
          subscription: true,
          twoFactorEnabled: true,
        },
      }),
    };
  }

  async refresh(refreshToken: string, ip?: string, userAgent?: string) {
    const hash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: hash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!session) throw new UnauthorizedException('Invalid refresh token');

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(session.userId, session.user.email, session.user.role, ip, userAgent);
  }

  async logout(refreshToken: string, userId?: string) {
    const hash = this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, ...(userId ? { userId } : {}) },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      userId,
      action: 'AUTH_REVOKE_ALL_SESSIONS',
      resource: 'session',
      resourceId: userId,
    });
    return { ok: true };
  }

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'Jgames', secret);
    const qr = await QRCode.toDataURL(otpauth);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
    return { secret, qr };
  }

  async enable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) throw new BadRequestException('2FA not initialized');
    const valid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!valid) throw new BadRequestException('Invalid 2FA code');
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    await this.audit.log({ userId, action: 'AUTH_2FA_ENABLED', resource: 'user', resourceId: userId });
    return { ok: true };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE) return null;
    return user;
  }

  async handleOAuthLogin(
    provider: 'google' | 'apple',
    profile: { id: string; email: string; displayName?: string },
    ip?: string,
    userAgent?: string,
  ) {
    const field = provider === 'google' ? 'googleId' : 'appleId';
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ [field]: profile.id }, { email: profile.email.toLowerCase() }] },
    });

    if (!user) {
      const base = (profile.displayName || profile.email.split('@')[0]).replace(/\W/g, '').toLowerCase() || 'player';
      let username = base.slice(0, 20);
      let n = 0;
      while (await this.prisma.user.findUnique({ where: { username } })) {
        n += 1;
        username = `${base.slice(0, 16)}${n}`;
      }
      user = await this.prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          username,
          displayName: profile.displayName || username,
          [field]: profile.id,
          emailVerified: true,
          role: Role.USER,
        },
      });
    } else if (!user[field]) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { [field]: profile.id, emailVerified: true },
      });
    }

    return this.issueTokens(user.id, user.email, user.role, ip, userAgent);
  }
}
