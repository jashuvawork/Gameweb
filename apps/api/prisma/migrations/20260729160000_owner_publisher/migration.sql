-- Owner Publisher pipeline
CREATE TYPE "PublishJobStatus" AS ENUM ('DRAFT', 'ASSETS_READY', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED_SITE', 'REJECTED');
CREATE TYPE "PublishChannel" AS ENUM ('SITE', 'YOUTUBE', 'SOCIAL_X', 'SOCIAL_INSTAGRAM', 'SOCIAL_FACEBOOK', 'SOCIAL_LINKEDIN', 'SOCIAL_DISCORD', 'GOOGLE_ADS');
CREATE TYPE "QueueItemStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPORTED', 'FAILED');

ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "trailerUrl" TEXT;

CREATE TABLE IF NOT EXISTS "PublishJob" (
  "id" TEXT NOT NULL,
  "gameId" TEXT,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "tagline" TEXT,
  "genres" TEXT[],
  "access" "GameAccess" NOT NULL DEFAULT 'FREE',
  "creditCost" INTEGER NOT NULL DEFAULT 0,
  "engine" TEXT NOT NULL DEFAULT 'canvas',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "trailerUrl" TEXT,
  "screenshotUrls" TEXT[],
  "thumbnailUrl" TEXT,
  "coverUrl" TEXT,
  "status" "PublishJobStatus" NOT NULL DEFAULT 'DRAFT',
  "seo" JSONB,
  "marketing" JSONB,
  "adsDraft" JSONB,
  "releaseNotes" TEXT,
  "featureList" TEXT[],
  "reviewNotes" TEXT,
  "createdBy" TEXT,
  "reviewedBy" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublishJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PublishQueueItem" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "channel" "PublishChannel" NOT NULL,
  "status" "QueueItemStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "payload" JSONB NOT NULL,
  "reviewNote" TEXT,
  "exportHint" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublishQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PublishJob_status_updatedAt_idx" ON "PublishJob"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "PublishJob_slug_idx" ON "PublishJob"("slug");
CREATE INDEX IF NOT EXISTS "PublishQueueItem_status_channel_idx" ON "PublishQueueItem"("status", "channel");
CREATE INDEX IF NOT EXISTS "PublishQueueItem_jobId_idx" ON "PublishQueueItem"("jobId");

ALTER TABLE "PublishJob" DROP CONSTRAINT IF EXISTS "PublishJob_gameId_fkey";
ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PublishQueueItem" DROP CONSTRAINT IF EXISTS "PublishQueueItem_jobId_fkey";
ALTER TABLE "PublishQueueItem" ADD CONSTRAINT "PublishQueueItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PublishJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
