'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createEngine } from '../../../../games/engine/core';
import { GAME_REGISTRY } from '../../../../games/registry';

export function GamePlayer({ slug }: { slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const entry = GAME_REGISTRY[slug];

  useEffect(() => {
    if (!canvasRef.current || !entry) return;
    const engine = createEngine(canvasRef.current, entry.create, {
      onScore: setScore,
      onGameOver: () => setEnded(true),
    });
    return () => engine.stop();
  }, [entry, slug]);

  if (!entry) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-neon-magenta">Game not found</h1>
        <p className="mt-2 text-white/60">Drop a new folder into /games to register a title.</p>
        <Link href="/games" className="mt-6 inline-block text-neon-cyan">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neon-cyan/70">Now Playing</p>
          <h1 className="font-display text-2xl text-white md:text-3xl">{entry.title}</h1>
        </div>
        <div className="text-sm text-white/60">
          Score <span className="text-neon-cyan">{score}</span>
          {ended && <span className="ml-3 text-neon-magenta">Ended — press R</span>}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-neon-cyan/20">
        <canvas ref={canvasRef} className="block w-full touch-none bg-void-950" role="img" aria-label={`${entry.title} game canvas`} />
      </div>
      <p className="mt-4 text-sm text-white/45">
        Original JASHUVA title · keyboard & pointer supported · ads never interrupt gameplay
      </p>
      <div className="mt-4 flex gap-3">
        <Link href="/games" className="text-sm text-neon-cyan hover:underline">
          Library
        </Link>
        <Link href="/" className="text-sm text-white/50 hover:text-white">
          Home
        </Link>
      </div>
    </div>
  );
}
