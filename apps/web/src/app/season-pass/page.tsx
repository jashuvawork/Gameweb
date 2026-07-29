import { DESIGN_PHILOSOPHY } from '@jashuva/shared';

export default function SeasonPassPage() {
  const tiers = Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    free: i % 3 === 0 ? `${50 + i * 5} coins` : i % 5 === 0 ? 'Profile emote' : 'XP badge cosmetic',
    premium:
      i % 4 === 0
        ? 'Exclusive frame'
        : i % 3 === 0
          ? 'Companion trail'
          : i % 2 === 0
            ? 'Victory animation'
            : 'Pet skin',
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl text-neon-magenta">Season Pass</h1>
      <p className="mt-2 text-white/55">
        Cosmetic progression only — frames, trails, pets, emotes, music. Never power. Never pay-to-win.
      </p>
      <p className="mt-2 text-sm text-neon-cyan">{DESIGN_PHILOSOPHY.motto}</p>
      <div className="mt-8 space-y-3">
        {tiers.map((t) => (
          <div key={t.level} className="glass grid grid-cols-[60px_1fr_1fr] items-center gap-3 rounded-xl px-4 py-3 text-sm">
            <span className="font-display text-neon-cyan">#{t.level}</span>
            <span className="text-white/60">Free: {t.free}</span>
            <span className="text-neon-gold">Premium: {t.premium}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
