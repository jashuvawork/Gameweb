import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { GamesService } from './games.service';

@ObjectType()
export class GameType {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  title!: string;

  @Field()
  description!: string;

  @Field(() => [String])
  genres!: string[];

  @Field()
  access!: string;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field()
  featured!: boolean;

  @Field()
  trending!: boolean;
}

@ObjectType()
export class GameListType {
  @Field(() => [GameType])
  items!: GameType[];

  @Field(() => Int)
  total!: number;
}

@Resolver(() => GameType)
export class GamesResolver {
  constructor(private gamesService: GamesService) {}

  @Query(() => GameListType)
  async games(
    @Args('search', { nullable: true }) search?: string,
    @Args('genre', { nullable: true }) genre?: string,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.gamesService.list({ search, genre, take });
  }

  @Query(() => GameType)
  async game(@Args('slug') slug: string) {
    return this.gamesService.bySlug(slug);
  }
}
