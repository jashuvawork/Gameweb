import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GameAccess, PublishChannel, PublishJobStatus, QueueItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { ConfigService } from '@nestjs/config';

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

function svgDataUrl(title: string, accent: string, kind: 'thumb' | 'banner') {
  const w = kind === 'banner' ? 1200 : 640;
  const h = kind === 'banner' ? 630 : 640;
  const safe = title.replace(/[<>&]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#05050a"/>
      <stop offset="55%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#0a1220"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * 0.82}" cy="${h * 0.22}" r="${h * 0.28}" fill="#ffffff18"/>
  <text x="48" y="${h * 0.42}" fill="#e8f7ff" font-family="Orbitron,sans-serif" font-size="${kind === 'banner' ? 54 : 42}" font-weight="700">${safe.slice(0, 28)}</text>
  <text x="48" y="${h * 0.52}" fill="#00f0ff" font-family="Sora,sans-serif" font-size="22">JASHUVA GAMES</text>
  <text x="48" y="${h * 0.72}" fill="#ffffff88" font-family="Sora,sans-serif" font-size="18">Play free · Go Premium</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const ACCENTS = ['#00f0ff', '#ff2bd6', '#ffc857', '#7cff6b', '#7aa2ff', '#c084fc'];

@Injectable()
export class PublisherService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  async listJobs(status?: PublishJobStatus) {
    return this.prisma.publishJob.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: { queueItems: true, game: { select: { id: true, slug: true, published: true } } },
      take: 100,
    });
  }

  async getJob(id: string) {
    const job = await this.prisma.publishJob.findUnique({
      where: { id },
      include: { queueItems: true, game: true },
    });
    if (!job) throw new NotFoundException('Publish job not found');
    return job;
  }

  async createJob(
    actorId: string,
    body: {
      title: string;
      slug?: string;
      description: string;
      tagline?: string;
      genres?: string[];
      access?: GameAccess;
      creditCost?: number;
      engine?: string;
      featured?: boolean;
      trailerUrl?: string;
      screenshotUrls?: string[];
      thumbnailUrl?: string;
      coverUrl?: string;
    },
  ) {
    const slug = slugify(body.slug || body.title);
    if (!slug) throw new BadRequestException('Invalid slug');
    const job = await this.prisma.publishJob.create({
      data: {
        slug,
        title: body.title.trim(),
        description: body.description.trim(),
        tagline: body.tagline?.trim(),
        genres: body.genres?.length ? body.genres : ['arcade'],
        access: body.access || GameAccess.FREE,
        creditCost: body.creditCost || 0,
        engine: body.engine || 'canvas',
        featured: !!body.featured,
        trailerUrl: body.trailerUrl,
        screenshotUrls: body.screenshotUrls || [],
        thumbnailUrl: body.thumbnailUrl,
        coverUrl: body.coverUrl,
        featureList: [],
        status: PublishJobStatus.DRAFT,
        createdBy: actorId,
      },
      include: { queueItems: true },
    });
    await this.audit.log({
      userId: actorId,
      action: 'PUBLISHER_JOB_CREATE',
      resource: 'publish_job',
      resourceId: job.id,
      metadata: { slug },
    });
    return job;
  }

  async updateJob(actorId: string, id: string, body: Record<string, unknown>) {
    await this.getJob(id);
    const allowed = [
      'title',
      'description',
      'tagline',
      'genres',
      'access',
      'creditCost',
      'engine',
      'featured',
      'trailerUrl',
      'screenshotUrls',
      'thumbnailUrl',
      'coverUrl',
      'releaseNotes',
      'featureList',
      'reviewNotes',
    ] as const;
    const data: Prisma.PublishJobUpdateInput = {};
    for (const key of allowed) {
      if (body[key] !== undefined) (data as Record<string, unknown>)[key] = body[key];
    }
    if (typeof body.slug === 'string') data.slug = slugify(body.slug);
    const job = await this.prisma.publishJob.update({
      where: { id },
      data,
      include: { queueItems: true },
    });
    await this.audit.log({
      userId: actorId,
      action: 'PUBLISHER_JOB_UPDATE',
      resource: 'publish_job',
      resourceId: id,
    });
    return job;
  }

  generateMarketingPack(job: {
    title: string;
    description: string;
    tagline?: string | null;
    genres: string[];
    access: GameAccess;
    slug: string;
  }) {
    const genre = job.genres[0] || 'arcade';
    const accent = ACCENTS[Math.abs(job.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % ACCENTS.length];
    const short = job.tagline || job.description.slice(0, 90);
    const seo = {
      title: `${job.title} — Play on JASHUVA GAMES`,
      description: job.description.slice(0, 155),
      keywords: [job.title, 'JGames', 'JASHUVA GAMES', genre, job.access === 'FREE' ? 'free online game' : 'premium game', 'browser game', 'PWA'],
      canonicalPath: `/play/${job.slug}`,
      ogTitle: job.title,
      ogDescription: short,
    };
    const marketing = {
      socialCaptions: {
        x: `🎮 ${job.title} is live on JGames — ${short} Play now → jgames.space/play/${job.slug}`,
        instagram: `${job.title}\n${short}\n\n#JGames #JashuvaGames #BrowserGames #${genre}`,
        facebook: `${job.title} just landed on JASHUVA GAMES.\n\n${job.description.slice(0, 220)}\n\nPlay free or go Premium for the full catalog.`,
        linkedin: `New release on JASHUVA GAMES: ${job.title}. ${short}`,
        discord: `**${job.title}** is ready — ${short}\nPlay: https://jgames.space/play/${job.slug}`,
      },
      youtube: {
        title: `${job.title} Gameplay Trailer | JASHUVA GAMES`,
        description: `${job.description}\n\nPlay on JGames: https://jgames.space/play/${job.slug}\n\n#JGames #Gameplay`,
        tags: ['JGames', job.title, genre, 'browser game'],
        privacyStatus: 'private',
        note: 'Upload only after owner approval. YouTube Data API requires OAuth.',
      },
    };
    const adsDraft = {
      policyNote:
        'Google Ads campaigns must be reviewed by a human before launch. This draft is export-only — nothing is submitted to Google Ads automatically.',
      campaignName: `JGames — ${job.title}`,
      headlines: [
        `Play ${job.title}`,
        'JASHUVA GAMES',
        job.access === 'FREE' ? 'Free Browser Game' : 'Premium Game World',
        'Instant Play · No Install',
        short.slice(0, 30),
      ].map((h) => h.slice(0, 30)),
      descriptions: [
        `${job.description.slice(0, 85)}`.slice(0, 90),
        `Play ${job.title} on JGames. Fair challenge. Premium removes ads.`.slice(0, 90),
      ],
      keywords: [
        job.title.toLowerCase(),
        `${genre} browser game`,
        'free online games',
        'jashuva games',
        'jgames',
        `${job.title} play online`,
      ],
      finalUrl: `https://jgames.space/play/${job.slug}`,
      exportFormat: 'google_ads_editor_csv_ready',
    };
    const featureList = [
      `${genre} gameplay tuned for fair challenge`,
      'Works on desktop, phone & tablet (PWA)',
      job.access === 'FREE' ? 'Free to play · optional Premium' : 'Premium / credits access',
      'Cloud-ready JGames platform',
    ];
    const releaseNotes = `Launching ${job.title} on JASHUVA GAMES. ${short}`;
    const thumbnailUrl = svgDataUrl(job.title, accent, 'thumb');
    const coverUrl = svgDataUrl(job.title, accent, 'banner');
    return { seo, marketing, adsDraft, featureList, releaseNotes, thumbnailUrl, coverUrl, accent };
  }

  async generateAssets(actorId: string, id: string) {
    const job = await this.getJob(id);
    const pack = this.generateMarketingPack(job);
    const updated = await this.prisma.publishJob.update({
      where: { id },
      data: {
        seo: pack.seo as Prisma.InputJsonValue,
        marketing: pack.marketing as Prisma.InputJsonValue,
        adsDraft: pack.adsDraft as Prisma.InputJsonValue,
        featureList: pack.featureList,
        releaseNotes: pack.releaseNotes,
        thumbnailUrl: job.thumbnailUrl || pack.thumbnailUrl,
        coverUrl: job.coverUrl || pack.coverUrl,
        status: PublishJobStatus.ASSETS_READY,
      },
      include: { queueItems: true },
    });
    await this.prisma.aiGeneratedContent.create({
      data: {
        type: 'publisher_assets',
        prompt: `Generate marketing pack for ${job.slug}`,
        content: pack as never,
        gameId: job.gameId || undefined,
        createdBy: actorId,
        assets: [updated.thumbnailUrl, updated.coverUrl].filter(Boolean) as string[],
      },
    });
    await this.audit.log({
      userId: actorId,
      action: 'PUBLISHER_GENERATE_ASSETS',
      resource: 'publish_job',
      resourceId: id,
    });
    return updated;
  }

  /** Publish game on the website immediately (owner-controlled). */
  async publishSite(actorId: string, id: string) {
    const job = await this.getJob(id);
    if (!job.seo || !job.marketing) {
      await this.generateAssets(actorId, id);
    }
    const fresh = await this.getJob(id);
    const gameData = {
      slug: fresh.slug,
      title: fresh.title,
      description: fresh.description,
      tagline: fresh.tagline || undefined,
      genres: fresh.genres,
      tags: fresh.featureList || [],
      access: fresh.access,
      creditCost: fresh.creditCost,
      engine: fresh.engine,
      featured: fresh.featured,
      thumbnail: fresh.thumbnailUrl || undefined,
      cover: fresh.coverUrl || undefined,
      trailerUrl: fresh.trailerUrl || undefined,
      published: true,
      hidden: false,
    };
    const game = await this.prisma.game.upsert({
      where: { slug: fresh.slug },
      create: gameData,
      update: {
        title: gameData.title,
        description: gameData.description,
        tagline: gameData.tagline,
        genres: gameData.genres,
        tags: gameData.tags,
        access: gameData.access,
        creditCost: gameData.creditCost,
        engine: gameData.engine,
        featured: gameData.featured,
        thumbnail: gameData.thumbnail,
        cover: gameData.cover,
        trailerUrl: gameData.trailerUrl,
        published: true,
        hidden: false,
      },
    });
    const updated = await this.prisma.publishJob.update({
      where: { id },
      data: {
        gameId: game.id,
        status: PublishJobStatus.PUBLISHED_SITE,
        publishedAt: new Date(),
        reviewedBy: actorId,
      },
      include: { queueItems: true, game: true },
    });
    await this.audit.log({
      userId: actorId,
      action: 'PUBLISHER_PUBLISH_SITE',
      resource: 'game',
      resourceId: game.id,
      metadata: { jobId: id, slug: game.slug },
    });
    return {
      job: updated,
      game,
      note: 'Live on site. External channels (YouTube, social, Google Ads) still require explicit review.',
    };
  }

  /** Queue external promotions — never auto-posts to Google Ads / YouTube / social. */
  async queueExternal(
    actorId: string,
    id: string,
    channels: PublishChannel[] = [
      PublishChannel.YOUTUBE,
      PublishChannel.SOCIAL_X,
      PublishChannel.SOCIAL_INSTAGRAM,
      PublishChannel.SOCIAL_DISCORD,
      PublishChannel.GOOGLE_ADS,
    ],
  ) {
    const job = await this.getJob(id);
    if (job.status === PublishJobStatus.DRAFT) {
      throw new BadRequestException('Generate assets (and ideally publish site) before queueing external channels');
    }
    const marketing = (job.marketing || {}) as Record<string, unknown>;
    const adsDraft = job.adsDraft;
    const created: Array<{
      id: string;
      channel: PublishChannel;
      status: QueueItemStatus;
      payload: Prisma.JsonValue;
      exportHint: string | null;
    }> = [];
    for (const channel of channels) {
      if (channel === PublishChannel.SITE) continue;
      let payload: Record<string, unknown> = { title: job.title, slug: job.slug };
      let exportHint = 'Review in Owner Publisher, then export/copy manually or connect official API with approval.';
      if (channel === PublishChannel.YOUTUBE) {
        payload = { ...(marketing.youtube as object), trailerUrl: job.trailerUrl, thumbnailUrl: job.thumbnailUrl };
        exportHint = 'After approval: connect YouTube Data API OAuth and upload as private, or download assets and upload manually.';
      } else if (channel === PublishChannel.GOOGLE_ADS) {
        payload = { ...(adsDraft as object) };
        exportHint =
          'NEVER auto-launch. After approval: export CSV for Google Ads Editor and review under Google Ads policies before launch.';
      } else if (channel === PublishChannel.SOCIAL_X) {
        payload = { caption: (marketing.socialCaptions as Record<string, string>)?.x, media: job.coverUrl };
      } else if (channel === PublishChannel.SOCIAL_INSTAGRAM) {
        payload = { caption: (marketing.socialCaptions as Record<string, string>)?.instagram, media: job.coverUrl };
      } else if (channel === PublishChannel.SOCIAL_FACEBOOK) {
        payload = { caption: (marketing.socialCaptions as Record<string, string>)?.facebook, media: job.coverUrl };
      } else if (channel === PublishChannel.SOCIAL_LINKEDIN) {
        payload = { caption: (marketing.socialCaptions as Record<string, string>)?.linkedin, media: job.coverUrl };
      } else if (channel === PublishChannel.SOCIAL_DISCORD) {
        payload = { caption: (marketing.socialCaptions as Record<string, string>)?.discord };
      }
      const item = await this.prisma.publishQueueItem.create({
        data: {
          jobId: id,
          channel,
          status: QueueItemStatus.PENDING_REVIEW,
          payload: payload as Prisma.InputJsonValue,
          exportHint,
        },
      });
      created.push(item);
    }
    await this.prisma.publishJob.update({
      where: { id },
      data: { status: PublishJobStatus.PENDING_REVIEW, reviewedBy: actorId },
    });
    await this.audit.log({
      userId: actorId,
      action: 'PUBLISHER_QUEUE_EXTERNAL',
      resource: 'publish_job',
      resourceId: id,
      metadata: { channels },
    });
    return { created, policy: 'External publishing requires owner approval. Google Ads is never auto-submitted.' };
  }

  async reviewQueueItem(
    actorId: string,
    itemId: string,
    decision: 'approve' | 'reject' | 'export',
    note?: string,
  ) {
    const item = await this.prisma.publishQueueItem.findUnique({ where: { id: itemId }, include: { job: true } });
    if (!item) throw new NotFoundException('Queue item not found');

    if (decision === 'reject') {
      const updated = await this.prisma.publishQueueItem.update({
        where: { id: itemId },
        data: { status: QueueItemStatus.REJECTED, reviewNote: note || 'Rejected by owner' },
      });
      await this.audit.log({
        userId: actorId,
        action: 'PUBLISHER_QUEUE_REJECT',
        resource: 'publish_queue',
        resourceId: itemId,
      });
      return updated;
    }

    if (decision === 'approve') {
      if (item.channel === PublishChannel.GOOGLE_ADS) {
        // Explicit: approval only marks draft as ready to export — never launches campaigns.
        const updated = await this.prisma.publishQueueItem.update({
          where: { id: itemId },
          data: {
            status: QueueItemStatus.APPROVED,
            reviewNote: note || 'Approved for manual Google Ads Editor export — not launched',
          },
        });
        await this.audit.log({
          userId: actorId,
          action: 'PUBLISHER_ADS_APPROVED_EXPORT_ONLY',
          resource: 'publish_queue',
          resourceId: itemId,
        });
        return {
          item: updated,
          warning: 'Google Ads was NOT launched. Export the draft and review in Google Ads before any spend.',
        };
      }
      const updated = await this.prisma.publishQueueItem.update({
        where: { id: itemId },
        data: {
          status: QueueItemStatus.APPROVED,
          reviewNote: note || 'Approved — connect official API or publish manually',
        },
      });
      await this.audit.log({
        userId: actorId,
        action: 'PUBLISHER_QUEUE_APPROVE',
        resource: 'publish_queue',
        resourceId: itemId,
        metadata: { channel: item.channel },
      });
      return {
        item: updated,
        note: 'Marked approved. Wire YouTube/social OAuth later to push after this gate, or publish manually.',
      };
    }

    // export = mark exported after owner used the assets externally
    const updated = await this.prisma.publishQueueItem.update({
      where: { id: itemId },
      data: {
        status: QueueItemStatus.EXPORTED,
        publishedAt: new Date(),
        reviewNote: note || 'Owner confirmed external publish/export completed',
      },
    });
    await this.audit.log({
      userId: actorId,
      action: 'PUBLISHER_QUEUE_EXPORTED',
      resource: 'publish_queue',
      resourceId: itemId,
    });
    return updated;
  }

  async listQueue(status?: QueueItemStatus) {
    return this.prisma.publishQueueItem.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { job: { select: { id: true, title: true, slug: true, status: true } } },
      take: 100,
    });
  }

  async analyticsOverview() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      dailySessions,
      dailyUsers,
      monthlyUsers,
      revenue30,
      subscriptions,
      topGames,
      premiumCount,
      freePlays,
      pendingQueue,
      jobsByStatus,
      adsSetting,
    ] = await Promise.all([
      this.prisma.playSession.count({ where: { startedAt: { gte: since24h } } }),
      this.prisma.playSession.groupBy({ by: ['userId'], where: { startedAt: { gte: since24h } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: since30d } } }),
      this.prisma.purchase.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: since30d } } }),
      this.prisma.user.groupBy({ by: ['subscription'], _count: true }),
      this.prisma.game.findMany({ orderBy: { playCount: 'desc' }, take: 12, where: { published: true } }),
      this.prisma.user.count({
        where: { subscription: { in: ['PREMIUM_MONTHLY', 'PREMIUM_YEARLY', 'FAMILY'] } },
      }),
      this.prisma.playSession.count({
        where: {
          startedAt: { gte: since30d },
          game: { access: GameAccess.FREE },
        },
      }),
      this.prisma.publishQueueItem.count({ where: { status: QueueItemStatus.PENDING_REVIEW } }),
      this.prisma.publishJob.groupBy({ by: ['status'], _count: true }),
      this.prisma.setting.findUnique({ where: { key: 'adsEnabled' } }),
    ]);

    return {
      dailyUsers: dailyUsers.length,
      dailyPlaySessions: dailySessions,
      monthlyActiveUsers: monthlyUsers,
      revenue30d: revenue30._sum.amount || 0,
      subscriptions,
      premiumSubscribers: premiumCount,
      freeTierPlays30d: freePlays,
      topGames,
      publisher: {
        pendingExternalReviews: pendingQueue,
        jobsByStatus,
      },
      ads: {
        enabled: adsSetting?.value !== false,
        note: 'AdSense serves to free users only. Premium hides ads. Google Ads campaigns are never auto-launched.',
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getAdsConfig() {
    const settings = await this.prisma.setting.findMany({
      where: { key: { in: ['adsEnabled', 'adsenseSlots', 'adsenseClient'] } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return {
      adsEnabled: map.adsEnabled !== false,
      adsenseClient: map.adsenseClient || this.config.get('NEXT_PUBLIC_ADSENSE_CLIENT') || process.env.NEXT_PUBLIC_ADSENSE_CLIENT || null,
      slots: (map.adsenseSlots as Record<string, string>) || {
        banner: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER || '0000000000',
        infeed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INFEED || '0000000000',
        multipurpose: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTI || '0000000000',
      },
      policy: {
        googleAdsAutoLaunch: false,
        premiumHidesAds: true,
        reviewRequiredForExternal: true,
      },
    };
  }

  async setAdsConfig(
    actorId: string,
    body: { adsEnabled?: boolean; adsenseClient?: string; slots?: Record<string, string> },
  ) {
    if (body.adsEnabled !== undefined) {
      await this.prisma.setting.upsert({
        where: { key: 'adsEnabled' },
        create: { key: 'adsEnabled', value: body.adsEnabled },
        update: { value: body.adsEnabled },
      });
    }
    if (body.adsenseClient !== undefined) {
      await this.prisma.setting.upsert({
        where: { key: 'adsenseClient' },
        create: { key: 'adsenseClient', value: body.adsenseClient },
        update: { value: body.adsenseClient },
      });
    }
    if (body.slots) {
      await this.prisma.setting.upsert({
        where: { key: 'adsenseSlots' },
        create: { key: 'adsenseSlots', value: body.slots },
        update: { value: body.slots },
      });
    }
    await this.audit.log({
      userId: actorId,
      action: 'PUBLISHER_ADS_CONFIG',
      resource: 'setting',
      resourceId: 'ads',
    });
    return this.getAdsConfig();
  }

  /** Public-safe ads flags for the website (no secrets). */
  async publicAdsFlags() {
    const adsEnabled = await this.prisma.setting.findUnique({ where: { key: 'adsEnabled' } });
    const slots = await this.prisma.setting.findUnique({ where: { key: 'adsenseSlots' } });
    return {
      adsEnabled: adsEnabled?.value !== false,
      slots: (slots?.value as Record<string, string>) || null,
    };
  }
}
