import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FREE_GAMES, PREMIUM_GAME_SEEDS, ACHIEVEMENTS, ALL_SEED_GAMES, SIGNATURE_FREE_SEEDS } from './seed.data';

@Module({})
export class SeedModule implements OnModuleInit {
  private readonly logger = new Logger(SeedModule.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureSuperOwner();
      await this.ensureGames();
      await this.ensureAchievements();
      await this.ensureSettings();
    } catch (err) {
      this.logger.error(`Seed failed (continuing boot): ${(err as Error).message}`);
    }
  }

  private async ensureSuperOwner() {
    const email = (this.config.get('OWNER_EMAIL') || 'jashuvawork@gmail.com').toLowerCase();
    const name = this.config.get('OWNER_NAME') || 'Jashuva';
    let password = this.config.get<string>('OWNER_PASSWORD');

    const existing = await this.prisma.user.findFirst({ where: { role: Role.SUPER_OWNER } });
    if (existing) {
      this.logger.log('SUPER_OWNER already exists');
      return;
    }

    if (!password) {
      password = randomBytes(18).toString('base64url');
      this.logger.warn(`Generated OWNER_PASSWORD (store securely): ${password}`);
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await this.prisma.user.create({
      data: {
        email,
        username: 'jashuva',
        displayName: name,
        passwordHash,
        role: Role.SUPER_OWNER,
        emailVerified: true,
        coins: 999999,
        credits: 999999,
        level: 99,
        xp: 999999,
      },
    });
    this.logger.log(`SUPER_OWNER created for ${email}`);
  }

  private async ensureGames() {
    const games = ALL_SEED_GAMES.length ? ALL_SEED_GAMES : [...FREE_GAMES, ...SIGNATURE_FREE_SEEDS, ...PREMIUM_GAME_SEEDS];
    for (const g of games) {
      await this.prisma.game.upsert({
        where: { slug: g.slug },
        create: g,
        update: {
          title: g.title,
          description: g.description,
          genres: g.genres,
          access: g.access,
          featured: g.featured,
          trending: g.trending,
          endlessStory: g.endlessStory,
          tagline: g.tagline,
        },
      });
    }
    this.logger.log(`Seeded ${games.length} games (classics + signatures + expandable)`);
  }

  private async ensureAchievements() {
    for (const a of ACHIEVEMENTS) {
      await this.prisma.achievement.upsert({
        where: { key: a.key },
        create: a,
        update: { title: a.title, description: a.description },
      });
    }
  }

  private async ensureSettings() {
    const defaults: Record<string, unknown> = {
      websiteName: 'JASHUVA GAMES',
      tagline: 'Play Forever.',
      maintenanceMode: false,
      adsEnabled: true,
      theme: 'dark-neon',
    };
    for (const [key, value] of Object.entries(defaults)) {
      await this.prisma.setting.upsert({
        where: { key },
        create: { key, value: value as never },
        update: {},
      });
    }
  }
}
