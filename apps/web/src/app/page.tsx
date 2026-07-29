import { FREE_GAME_CATALOG } from '@/lib/catalog';
import { HomeClient } from '@/components/HomeClient';

export default function HomePage() {
  return <HomeClient initialGames={FREE_GAME_CATALOG} />;
}
