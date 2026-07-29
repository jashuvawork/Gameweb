import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GamesResolver } from './games.resolver';

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesResolver],
  exports: [GamesService],
})
export class GamesModule {}
