import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memory = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    if (url) {
      try {
        this.client = new Redis(url, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
        this.client.connect().catch((err) => {
          this.logger.warn(`Redis unavailable, using in-memory fallback: ${err.message}`);
          this.client = null;
        });
      } catch {
        this.logger.warn('Redis init failed, using in-memory fallback');
      }
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        /* fallback */
      }
    }
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) await this.client.set(key, value, 'EX', ttlSeconds);
        else await this.client.set(key, value);
        return;
      } catch {
        /* fallback */
      }
    }
    this.memory.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        /* fallback */
      }
    }
    this.memory.delete(key);
  }

  async incr(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.incr(key);
      } catch {
        /* fallback */
      }
    }
    const current = Number((await this.get(key)) || '0') + 1;
    await this.set(key, String(current));
    return current;
  }

  async health(): Promise<'ok' | 'fallback'> {
    if (!this.client) return 'fallback';
    try {
      await this.client.ping();
      return 'ok';
    } catch {
      return 'fallback';
    }
  }
}
