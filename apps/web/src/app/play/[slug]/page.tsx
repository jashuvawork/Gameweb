import type { Metadata } from 'next';
import { GamePlayer } from '@/components/GamePlayer';
import { FREE_GAME_CATALOG } from '@/lib/catalog';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return FREE_GAME_CATALOG.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = FREE_GAME_CATALOG.find((g) => g.slug === slug);
  return {
    title: game?.title || 'Play',
    description: game?.description || 'Play on JASHUVA GAMES',
  };
}

export default async function PlayPage({ params }: Props) {
  const { slug } = await params;
  return <GamePlayer slug={slug} />;
}
