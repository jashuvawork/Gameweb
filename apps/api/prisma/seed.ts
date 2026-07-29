import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { FREE_GAMES, PREMIUM_GAME_SEEDS, ACHIEVEMENTS } from '../src/seed/seed.data';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.OWNER_EMAIL || 'jashuvawork@gmail.com').toLowerCase();
  const existing = await prisma.user.findFirst({ where: { role: Role.SUPER_OWNER } });
  if (!existing) {
    const password = process.env.OWNER_PASSWORD || randomBytes(18).toString('base64url');
    console.log('SUPER_OWNER password:', password);
    await prisma.user.create({
      data: {
        email,
        username: 'jashuva',
        displayName: process.env.OWNER_NAME || 'J',
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
        role: Role.SUPER_OWNER,
        emailVerified: true,
        credits: 999999,
        coins: 999999,
      },
    });
  }

  for (const g of [...FREE_GAMES, ...PREMIUM_GAME_SEEDS]) {
    await prisma.game.upsert({
      where: { slug: g.slug },
      create: g,
      update: { title: g.title, description: g.description },
    });
  }
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      create: a,
      update: {},
    });
  }
  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
