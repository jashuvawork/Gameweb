import { Suspense } from 'react';
import GamesClient from './GamesClient';

export const metadata = {
  title: 'Game Library',
  description: 'Browse free and premium original games on JASHUVA GAMES.',
};

export default function GamesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-white/50">Loading library…</div>}>
      <GamesClient />
    </Suspense>
  );
}
