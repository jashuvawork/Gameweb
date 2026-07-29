'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Job = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tagline?: string;
  genres: string[];
  access: 'FREE' | 'PREMIUM' | 'CREDITS';
  status: string;
  thumbnailUrl?: string;
  coverUrl?: string;
  trailerUrl?: string;
  seo?: Record<string, unknown>;
  marketing?: Record<string, unknown>;
  adsDraft?: Record<string, unknown>;
  releaseNotes?: string;
  featureList?: string[];
  queueItems?: QueueItem[];
  publishedAt?: string;
};

type QueueItem = {
  id: string;
  channel: string;
  status: string;
  payload: Record<string, unknown>;
  exportHint?: string;
  reviewNote?: string;
  job?: { id: string; title: string; slug: string };
};

type Analytics = {
  dailyUsers: number;
  dailyPlaySessions: number;
  monthlyActiveUsers: number;
  revenue30d: number;
  premiumSubscribers: number;
  freeTierPlays30d: number;
  topGames: { slug: string; title: string; playCount: number }[];
  publisher: { pendingExternalReviews: number; jobsByStatus: { status: string; _count: number }[] };
  ads: { enabled: boolean; note: string };
};

type AdsConfig = {
  adsEnabled: boolean;
  adsenseClient: string | null;
  slots: Record<string, string>;
  policy: { googleAdsAutoLaunch: boolean; premiumHidesAds: boolean; reviewRequiredForExternal: boolean };
};

const STEPS = [
  '1. Create / update game',
  '2. Generate assets',
  '3. Review content',
  '4. Publish on website',
  '5. Queue external (optional)',
  '6. Approve YouTube / social / Ads drafts',
];

export function OwnerPublisher({ token }: { token: string }) {
  const [tab, setTab] = useState<'pipeline' | 'queue' | 'analytics' | 'ads'>('pipeline');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [ads, setAds] = useState<AdsConfig | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    tagline: '',
    genres: 'arcade',
    access: 'FREE' as 'FREE' | 'PREMIUM' | 'CREDITS',
    trailerUrl: '',
    screenshotUrls: '',
    featured: false,
  });

  const selected = useMemo(() => jobs.find((j) => j.id === selectedId) || null, [jobs, selectedId]);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [j, q, a, c] = await Promise.all([
        api<Job[]>('/owner/publisher/jobs', { token }),
        api<QueueItem[]>('/owner/publisher/queue', { token }),
        api<Analytics>('/owner/publisher/analytics', { token }),
        api<AdsConfig>('/owner/publisher/ads-config', { token }),
      ]);
      setJobs(j);
      setQueue(q);
      setAnalytics(a);
      setAds(c);
      if (!selectedId && j[0]) setSelectedId(j[0].id);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token, selectedId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError('');
    setMessage('');
    try {
      const res = await fn();
      setMessage(typeof res === 'object' && res && 'note' in (res as object) ? String((res as { note?: string }).note || label + ' OK') : `${label} OK`);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function createJob() {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required');
      return;
    }
    await run('Create job', async () => {
      const job = await api<Job>('/owner/publisher/jobs', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: form.title,
          slug: form.slug || undefined,
          description: form.description,
          tagline: form.tagline || undefined,
          genres: form.genres.split(',').map((g) => g.trim()).filter(Boolean),
          access: form.access,
          trailerUrl: form.trailerUrl || undefined,
          screenshotUrls: form.screenshotUrls
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          featured: form.featured,
        }),
      });
      setSelectedId(job.id);
      setForm({
        title: '',
        slug: '',
        description: '',
        tagline: '',
        genres: 'arcade',
        access: 'FREE',
        trailerUrl: '',
        screenshotUrls: '',
        featured: false,
      });
      return job;
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-neon-cyan/25 bg-gradient-to-br from-neon-cyan/10 via-void-950 to-neon-magenta/10 p-5">
        <p className="text-[10px] uppercase tracking-[0.35em] text-neon-cyan">Owner-only Publisher</p>
        <h2 className="mt-1 font-display text-2xl text-white">Automate everything — review before external publish</h2>
        <p className="mt-2 max-w-3xl text-sm text-white/55">
          Site publish is instant under your control. YouTube, social, and Google Ads drafts are queued for your approval.
          Google Ads is never auto-launched.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STEPS.map((s) => (
            <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['pipeline', 'Pipeline'],
            ['queue', 'Review queue'],
            ['analytics', 'Analytics'],
            ['ads', 'AdSense'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              tab === id ? 'bg-neon-cyan text-void-950' : 'border border-white/15 text-white/60'
            }`}
          >
            {label}
            {id === 'queue' && analytics?.publisher.pendingExternalReviews
              ? ` (${analytics.publisher.pendingExternalReviews})`
              : ''}
          </button>
        ))}
        <button
          type="button"
          onClick={() => refresh()}
          className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/50"
        >
          Refresh
        </button>
      </div>

      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded-xl border border-neon-lime/30 bg-neon-lime/10 px-4 py-3 text-sm text-neon-lime">{message}</p>}
      {busy && <p className="text-xs text-white/40">Working: {busy}…</p>}

      {tab === 'pipeline' && (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-display text-lg text-white">New game draft</h3>
              <div className="mt-3 space-y-2">
                <input
                  className="w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
                  placeholder="Slug (optional)"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
                <textarea
                  className="min-h-[88px] w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
                  placeholder="Tagline"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
                  placeholder="Genres (comma-separated)"
                  value={form.genres}
                  onChange={(e) => setForm({ ...form, genres: e.target.value })}
                />
                <select
                  className="w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
                  value={form.access}
                  onChange={(e) => setForm({ ...form, access: e.target.value as typeof form.access })}
                >
                  <option value="FREE">Free</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="CREDITS">Credits</option>
                </select>
                <input
                  className="w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
                  placeholder="Trailer URL (optional)"
                  value={form.trailerUrl}
                  onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })}
                />
                <textarea
                  className="min-h-[64px] w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
                  placeholder="Screenshot URLs (one per line)"
                  value={form.screenshotUrls}
                  onChange={(e) => setForm({ ...form, screenshotUrls: e.target.value })}
                />
                <label className="flex items-center gap-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Featured on home
                </label>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => createJob()}
                  className="w-full rounded-full bg-neon-cyan px-4 py-2.5 text-sm font-semibold text-void-950 disabled:opacity-40"
                >
                  Create draft
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="px-1 text-[10px] uppercase tracking-[0.25em] text-white/40">Jobs</p>
              <div className="mt-2 max-h-[420px] space-y-1 overflow-auto">
                {jobs.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setSelectedId(j.id)}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                      selectedId === j.id ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-medium">{j.title}</span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-white/35">
                      {j.status} · {j.access} · {j.slug}
                    </span>
                  </button>
                ))}
                {!jobs.length && <p className="px-2 py-4 text-xs text-white/35">No jobs yet — create a draft.</p>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            {!selected ? (
              <p className="text-sm text-white/45">Select or create a publish job.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl text-white">{selected.title}</h3>
                    <p className="text-xs text-white/40">
                      {selected.slug} · {selected.status} · {selected.access}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() =>
                        run('Generate assets', () =>
                          api(`/owner/publisher/jobs/${selected.id}/generate-assets`, { method: 'POST', token }),
                        )
                      }
                      className="rounded-full border border-neon-magenta/40 px-4 py-2 text-xs text-neon-magenta"
                    >
                      Generate assets
                    </button>
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() =>
                        run('Publish site', () =>
                          api(`/owner/publisher/jobs/${selected.id}/publish-site`, { method: 'POST', token }),
                        )
                      }
                      className="rounded-full bg-neon-lime px-4 py-2 text-xs font-semibold text-void-950"
                    >
                      Publish on website
                    </button>
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() =>
                        run('Queue external', () =>
                          api(`/owner/publisher/jobs/${selected.id}/queue-external`, {
                            method: 'POST',
                            token,
                            body: JSON.stringify({}),
                          }),
                        )
                      }
                      className="rounded-full border border-neon-gold/40 px-4 py-2 text-xs text-neon-gold"
                    >
                      Queue YouTube / social / Ads
                    </button>
                  </div>
                </div>

                <p className="text-sm text-white/65">{selected.description}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.thumbnailUrl && (
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-white/40">Thumbnail</p>
                      <img src={selected.thumbnailUrl} alt="" className="max-h-48 w-full rounded-xl object-cover ring-1 ring-white/10" />
                    </div>
                  )}
                  {selected.coverUrl && (
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-white/40">Promo banner</p>
                      <img src={selected.coverUrl} alt="" className="max-h-48 w-full rounded-xl object-cover ring-1 ring-white/10" />
                    </div>
                  )}
                </div>

                {selected.releaseNotes && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Release notes</p>
                    <p className="mt-1 text-sm text-white/70">{selected.releaseNotes}</p>
                  </div>
                )}
                {!!selected.featureList?.length && (
                  <ul className="list-inside list-disc text-sm text-white/60">
                    {selected.featureList.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}

                <details className="rounded-xl border border-white/10 bg-void-950/60 p-3">
                  <summary className="cursor-pointer text-sm text-neon-cyan">SEO metadata</summary>
                  <pre className="mt-2 overflow-auto text-[11px] text-white/55">{JSON.stringify(selected.seo, null, 2)}</pre>
                </details>
                <details className="rounded-xl border border-white/10 bg-void-950/60 p-3">
                  <summary className="cursor-pointer text-sm text-neon-magenta">Social / YouTube copy</summary>
                  <pre className="mt-2 overflow-auto text-[11px] text-white/55">{JSON.stringify(selected.marketing, null, 2)}</pre>
                </details>
                <details className="rounded-xl border border-white/10 bg-void-950/60 p-3">
                  <summary className="cursor-pointer text-sm text-neon-gold">Google Ads draft (export only)</summary>
                  <pre className="mt-2 overflow-auto text-[11px] text-white/55">{JSON.stringify(selected.adsDraft, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'queue' && (
        <div className="space-y-3">
          <p className="text-sm text-white/50">
            Approve to mark ready for manual/API publish. Google Ads approval never launches a campaign — export only.
          </p>
          {queue.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-white">
                    {item.channel} · {item.job?.title || 'Job'}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">{item.status}</p>
                  {item.exportHint && <p className="mt-2 max-w-2xl text-xs text-white/45">{item.exportHint}</p>}
                  {item.reviewNote && <p className="mt-1 text-xs text-neon-lime">{item.reviewNote}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!!busy || item.status !== 'PENDING_REVIEW'}
                    onClick={() =>
                      run('Approve', () =>
                        api(`/owner/publisher/queue/${item.id}/review`, {
                          method: 'POST',
                          token,
                          body: JSON.stringify({ decision: 'approve' }),
                        }),
                      )
                    }
                    className="rounded-full bg-neon-cyan px-3 py-1.5 text-xs font-semibold text-void-950 disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={!!busy || item.status !== 'PENDING_REVIEW'}
                    onClick={() =>
                      run('Reject', () =>
                        api(`/owner/publisher/queue/${item.id}/review`, {
                          method: 'POST',
                          token,
                          body: JSON.stringify({ decision: 'reject' }),
                        }),
                      )
                    }
                    className="rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-300 disabled:opacity-40"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={!!busy || (item.status !== 'APPROVED' && item.status !== 'PENDING_REVIEW')}
                    onClick={() =>
                      run('Mark exported', () =>
                        api(`/owner/publisher/queue/${item.id}/review`, {
                          method: 'POST',
                          token,
                          body: JSON.stringify({ decision: 'export' }),
                        }),
                      )
                    }
                    className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/60 disabled:opacity-40"
                  >
                    Mark exported
                  </button>
                </div>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-white/40">Payload</summary>
                <pre className="mt-2 max-h-48 overflow-auto text-[11px] text-white/50">{JSON.stringify(item.payload, null, 2)}</pre>
              </details>
            </div>
          ))}
          {!queue.length && <p className="text-sm text-white/40">Queue empty — generate assets and queue external channels from a job.</p>}
        </div>
      )}

      {tab === 'analytics' && analytics && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Daily users', analytics.dailyUsers],
              ['Sessions (24h)', analytics.dailyPlaySessions],
              ['MAU (30d)', analytics.monthlyActiveUsers],
              ['Revenue 30d', `$${analytics.revenue30d.toFixed(2)}`],
              ['Premium subs', analytics.premiumSubscribers],
              ['Free plays 30d', analytics.freeTierPlays30d],
              ['Pending reviews', analytics.publisher.pendingExternalReviews],
              ['Ads enabled', analytics.ads.enabled ? 'Yes' : 'No'],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">{label}</p>
                <p className="mt-2 font-display text-2xl text-neon-cyan">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40">{analytics.ads.note}</p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="font-display text-lg text-white">Most played</h3>
            <div className="mt-3 space-y-2">
              {analytics.topGames.map((g) => (
                <div key={g.slug} className="flex justify-between text-sm text-white/70">
                  <span>{g.title}</span>
                  <span className="text-neon-lime">{g.playCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'ads' && ads && (
        <div className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-display text-xl text-white">AdSense on your site</h3>
          <p className="text-sm text-white/50">
            Display ads for free users. Premium hides ads. Campaign launch on Google Ads stays manual after review.
          </p>
          <label className="flex items-center gap-3 text-sm text-white">
            <input
              type="checkbox"
              checked={ads.adsEnabled}
              onChange={(e) => setAds({ ...ads, adsEnabled: e.target.checked })}
            />
            Ads enabled on website
          </label>
          <input
            className="w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
            placeholder="AdSense client (ca-pub-…)"
            value={ads.adsenseClient || ''}
            onChange={(e) => setAds({ ...ads, adsenseClient: e.target.value })}
          />
          {(['banner', 'infeed', 'multipurpose'] as const).map((key) => (
            <input
              key={key}
              className="w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
              placeholder={`${key} slot ID`}
              value={ads.slots[key] || ''}
              onChange={(e) => setAds({ ...ads, slots: { ...ads.slots, [key]: e.target.value } })}
            />
          ))}
          <button
            type="button"
            disabled={!!busy}
            onClick={() =>
              run('Save ads config', () =>
                api('/owner/publisher/ads-config', {
                  method: 'POST',
                  token,
                  body: JSON.stringify({
                    adsEnabled: ads.adsEnabled,
                    adsenseClient: ads.adsenseClient,
                    slots: ads.slots,
                  }),
                }),
              )
            }
            className="rounded-full bg-neon-cyan px-5 py-2.5 text-sm font-semibold text-void-950"
          >
            Save AdSense config
          </button>
          <pre className="overflow-auto rounded-xl bg-void-950/80 p-3 text-[11px] text-white/45">
            {JSON.stringify(ads.policy, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
