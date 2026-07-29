import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('dungeon-master')
  @UseGuards(JwtAuthGuard)
  dm(@Body() body: { worldSeed: string; decision?: string; chapter?: number }) {
    return this.ai.dungeonMaster(body);
  }

  @Post('companion')
  @UseGuards(JwtAuthGuard)
  companion(@Body() body: { memory?: string[] }) {
    return this.ai.companion(body.memory);
  }

  @Post('npc')
  @UseGuards(JwtAuthGuard)
  npc(@Body() body: { name: string; memory?: string[] }) {
    return this.ai.npcDialogue(body.name, body.memory);
  }

  @Post('quest')
  @UseGuards(JwtAuthGuard)
  quest(@Body() body: { seed: string }) {
    return this.ai.questGenerator(body.seed);
  }

  @Post('story')
  @UseGuards(JwtAuthGuard)
  story(@Body() body: { seed: string; chapter: number }) {
    return this.ai.storyGenerator(body.seed, body.chapter || 1);
  }

  @Post('music')
  @UseGuards(JwtAuthGuard)
  music(@Body() body: { mood: string }) {
    return this.ai.musicPrompt(body.mood || 'neon');
  }

  @Post('level')
  @UseGuards(JwtAuthGuard)
  level(@Body() body: { seed: string }) {
    return this.ai.levelGenerator(body.seed);
  }

  @Post('character')
  @UseGuards(JwtAuthGuard)
  character(@Body() body: { seed: string }) {
    return this.ai.characterGenerator(body.seed);
  }

  @Post('enemy')
  @UseGuards(JwtAuthGuard)
  enemy(@Body() body: { seed: string }) {
    return this.ai.enemyGenerator(body.seed);
  }

  @Post('studio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_OWNER, Role.ADMIN)
  studio(
    @CurrentUser() user: { id: string },
    @Body() body: { kind: string; seed: string },
  ) {
    return this.ai.studioGenerate(user.id, body.kind, body.seed || String(Date.now()));
  }
}
