import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('HealthController', () => {
  it('returns health payload', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: { $queryRaw: async () => [1] } },
        { provide: RedisService, useValue: { health: async () => 'fallback' } },
      ],
    }).compile();

    const controller = module.get(HealthController);
    const result = await controller.check();
    expect(result.status).toBe('healthy');
    expect(result.service).toBe('jashuva-games-api');
  });
});
