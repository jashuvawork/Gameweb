export default function SeasonPassPage() {
  const tiers = Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    free: i % 3 === 0 ? `${50 + i * 5} coins` : 'XP boost cosmetic',
    premium: i % 2 === 0 ? 'Exclusive frame' : 'Pet trail animation',
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl text-neon-magenta">Season Pass</h1>
      <p className="mt-2 text-white/55">Cosmetic progression only. Never power. Never pay-to-win.</p>
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
