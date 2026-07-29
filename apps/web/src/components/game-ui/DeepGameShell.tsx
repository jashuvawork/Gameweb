'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { AdSenseBanner } from '@/components/AdsAnalytics';
import { getGameArt, type FreeGameCharacter, type GameArtPack } from '@games/art/free-game-art';
import type { RootState } from '@/store';

type Phase = 'character' | 'chapters' | 'playing' | 'chapter-ad' | 'paused' | 'victory';

export function DeepGameShell({
  slug,
  title,
  isPremiumGame,
  children,
  onChapterChange,
  onCharacterChange,
  onPlayingChange,
}: {
  slug: string;
  title: string;
  isPremiumGame: boolean;
  children: React.ReactNode;
  onChapterChange?: (chapter: number) => void;
  onCharacterChange?: (character: FreeGameCharacter) => void;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const art = getGameArt(slug);
  const user = useSelector((s: RootState) => s.auth.user);
  const isPremiumUser =
    user?.subscription === 'PREMIUM_MONTHLY' ||
    user?.subscription === 'PREMIUM_YEARLY' ||
    user?.subscription === 'FAMILY';

  const showAds = !isPremiumGame && !isPremiumUser;
  const [phase, setPhase] = useState<Phase>(art ? 'character' : 'playing');
  const [character, setCharacter] = useState<FreeGameCharacter>('explorer');
  const [chapter, setChapter] = useState(1);
  const [pendingChapter, setPendingChapter] = useState(1);

  useEffect(() => {
    onPlayingChange?.(phase === 'playing');
  }, [phase, onPlayingChange]);

  if (!art) {
    return <>{children}</>;
  }

  const startChapter = (ch: number) => {
    if (showAds && phase === 'chapters') {
      setPendingChapter(ch);
      setPhase('chapter-ad');
      return;
    }
    setChapter(ch);
    onChapterChange?.(ch);
    setPhase('playing');
  };

  const afterAdContinue = () => {
    setChapter(pendingChapter);
    onChapterChange?.(pendingChapter);
    setPhase('playing');
  };

  return (
    <div
      className="deep-shell-in relative overflow-hidden rounded-[1.75rem] ring-1"
      style={{
        ['--g-accent' as string]: art.accent,
        ['--g-accent2' as string]: art.accent2,
        borderColor: `${art.accent}44`,
        boxShadow: `0 0 50px ${art.accent}14`,
      }}
    >
      {/* Unique per-game top banner */}
      <div className="relative h-32 overflow-hidden sm:h-36 md:h-40">
        <img src={art.ui.hud} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(105deg, #05050af2 0%, #05050a88 45%, ${art.accent}22 100%)`,
          }}
        />
        <div className="relative flex h-full items-end justify-between gap-3 px-4 pb-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: art.accent }}>
              {isPremiumGame ? 'Premium Interface' : 'Signature Free Interface'}
            </p>
            <h2 className="truncate font-display text-2xl text-white sm:text-3xl">{title}</h2>
            <p className="truncate text-xs text-white/55">
              Ch. {chapter} · {art.chapters[chapter - 1]?.title} · {character}
            </p>
          </div>
          {phase === 'playing' && (
            <button
              type="button"
              onClick={() => setPhase('paused')}
              className="shrink-0 rounded-full border px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur"
              style={{ borderColor: `${art.accent}66`, background: `${art.accent}22` }}
            >
              Pause
            </button>
          )}
        </div>
      </div>

      {phase === 'character' && (
        <CharacterSelect
          art={art}
          selected={character}
          onSelect={(c) => {
            setCharacter(c);
            onCharacterChange?.(c);
          }}
          onContinue={() => setPhase('chapters')}
        />
      )}

      {phase === 'chapters' && (
        <ChapterSelect art={art} onPick={startChapter} character={character} />
      )}

      {phase === 'chapter-ad' && (
        <ChapterAdGate
          art={art}
          chapter={pendingChapter}
          onContinue={afterAdContinue}
        />
      )}

      {phase === 'paused' && (
        <PauseOverlay
          art={art}
          showAds={showAds}
          onResume={() => setPhase('playing')}
          onChapters={() => setPhase('chapters')}
          onCharacters={() => setPhase('character')}
        />
      )}

      {(phase === 'playing' || phase === 'paused') && (
        <div className={phase === 'paused' ? 'pointer-events-none opacity-40' : ''}>{children}</div>
      )}

      {phase === 'playing' && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-void-950/80 px-4 py-3">
          <button
            type="button"
            className="text-xs text-white/60 hover:text-white"
            onClick={() => {
              const next = Math.min(5, chapter + 1);
              if (showAds) {
                setPendingChapter(next);
                setPhase('chapter-ad');
              } else {
                setChapter(next);
                onChapterChange?.(next);
                setPhase('victory');
                setTimeout(() => setPhase('playing'), 1200);
              }
            }}
          >
            Next chapter →
          </button>
          {showAds ? (
            <Link href="/store" className="text-xs text-neon-gold hover:underline">
              Go Premium — remove chapter & pause ads
            </Link>
          ) : (
            <span className="text-xs text-neon-lime">Ad-free Premium active</span>
          )}
        </div>
      )}

      {phase === 'victory' && (
        <div className="relative p-8 text-center">
          <img src={art.ui.victory} alt="" className="mx-auto mb-4 max-h-32 rounded-xl" />
          <p className="font-display text-2xl" style={{ color: art.accent }}>
            Chapter clear
          </p>
        </div>
      )}
    </div>
  );
}

function CharacterSelect({
  art,
  selected,
  onSelect,
  onContinue,
}: {
  art: GameArtPack;
  selected: FreeGameCharacter;
  onSelect: (c: FreeGameCharacter) => void;
  onContinue: () => void;
}) {
  return (
    <div className="deep-shell-in bg-void-950 p-5 sm:p-6">
      <img src={art.ui.characterSelect} alt="" className="mb-4 h-20 w-full rounded-2xl object-cover ring-1 ring-white/10" />
      <h3 className="font-display text-xl text-white sm:text-2xl">Choose your model</h3>
      <p className="mt-1 text-sm text-white/50">Unique portraits per game — cosmetics only, never power.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {art.characters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`overflow-hidden rounded-2xl border text-left transition active:scale-[0.98] ${
              selected === c.id ? 'border-[var(--g-accent)] ring-2 ring-[var(--g-accent)]/40' : 'border-white/10'
            }`}
          >
            <img src={c.image} alt={c.label} className="aspect-[4/5] w-full object-cover" />
            <p className="px-3 py-2 text-sm text-white">{c.label}</p>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold text-void-950 sm:w-auto"
        style={{ background: art.accent, boxShadow: `0 0 28px ${art.accent}55` }}
      >
        Continue to chapters
      </button>
    </div>
  );
}

function ChapterSelect({
  art,
  onPick,
  character,
}: {
  art: GameArtPack;
  onPick: (ch: number) => void;
  character: FreeGameCharacter;
}) {
  return (
    <div className="deep-shell-in bg-void-950 p-5 sm:p-6">
      <img src={art.ui.chapterSelect} alt="" className="mb-4 h-20 w-full rounded-2xl object-cover ring-1 ring-white/10" />
      <h3 className="font-display text-xl text-white sm:text-2xl">Chapters</h3>
      <p className="mt-1 text-sm text-white/50">
        Playing as <span style={{ color: art.accent2 }}>{character}</span> — each chapter has unique art & mood.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {art.chapters.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => onPick(ch.id)}
            className="group overflow-hidden rounded-2xl border border-white/10 text-left transition hover:border-[var(--g-accent)]/50 active:scale-[0.99]"
            style={{ boxShadow: `0 8px 28px #0006` }}
          >
            <img src={ch.image} alt={ch.title} className="aspect-video w-full object-cover transition group-hover:scale-[1.03]" />
            <div className="p-3">
              <p className="text-xs uppercase tracking-wider" style={{ color: art.accent }}>
                Chapter {ch.id}
              </p>
              <p className="font-display text-white">{ch.title}</p>
              <p className="mt-1 text-xs text-white/45">{ch.blurb}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChapterAdGate({
  art,
  chapter,
  onContinue,
}: {
  art: GameArtPack;
  chapter: number;
  onContinue: () => void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, [chapter]);

  return (
    <div className="bg-void-950 p-6 text-center">
      <img src={art.chapters[chapter - 1]?.image} alt="" className="mx-auto mb-4 max-h-40 rounded-2xl object-cover" />
      <p className="text-xs uppercase tracking-[0.3em] text-neon-gold">Free tier · Chapter break</p>
      <h3 className="mt-2 font-display text-2xl text-white">Ad before Chapter {chapter}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
        Free players see a short ad between chapters and on pause. Premium removes all ads and keeps your flow.
      </p>
      <div className="mx-auto mt-4 max-w-xl">
        <AdSenseBanner />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-8 text-sm text-white/40">
          Sponsored break · thanks for supporting free games
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          disabled={!ready}
          onClick={onContinue}
          className="rounded-full bg-neon-cyan px-6 py-3 text-sm font-semibold text-void-950 disabled:opacity-40"
        >
          {ready ? 'Continue to chapter' : 'Ad finishing…'}
        </button>
        <Link href="/store" className="rounded-full border border-neon-gold/40 px-6 py-3 text-sm text-neon-gold">
          Buy Premium — go ad-free
        </Link>
      </div>
    </div>
  );
}

function PauseOverlay({
  art,
  showAds,
  onResume,
  onChapters,
  onCharacters,
}: {
  art: GameArtPack;
  showAds: boolean;
  onResume: () => void;
  onChapters: () => void;
  onCharacters: () => void;
}) {
  return (
    <div className="absolute inset-x-0 z-20 mx-auto max-w-lg p-4">
      <div className="rounded-3xl border border-white/15 bg-void-950/95 p-6 shadow-2xl backdrop-blur">
        <img src={art.ui.pause} alt="" className="mb-3 h-14 w-full rounded-xl object-cover" />
        <h3 className="font-display text-xl text-white">Paused</h3>
        {showAds && (
          <div className="mt-3">
            <AdSenseBanner />
            <p className="mt-2 text-xs text-white/45">Free pause includes an ad. Premium is ad-free.</p>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={onResume} className="rounded-full px-4 py-2 text-sm font-semibold text-void-950" style={{ background: art.accent }}>
            Resume
          </button>
          <button type="button" onClick={onChapters} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70">
            Chapters
          </button>
          <button type="button" onClick={onCharacters} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70">
            Change character
          </button>
          {showAds && (
            <Link href="/store" className="rounded-full border border-neon-gold/40 px-4 py-2 text-xs text-neon-gold">
              Buy Premium · ad-free
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
