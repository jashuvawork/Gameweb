'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAudio, type RootState } from '@/store';

/** Procedural ambient pad — original soundtrack, no copyrighted audio */
export function AudioAmbience() {
  const enabled = useSelector((s: RootState) => s.ui.audioEnabled);
  const dispatch = useDispatch();
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  useEffect(() => {
    if (!enabled) {
      nodesRef.current.forEach((n) => {
        try {
          (n as OscillatorNode).stop?.();
        } catch {
          /* */
        }
      });
      nodesRef.current = [];
      ctxRef.current?.close();
      ctxRef.current = null;
      return;
    }

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.035;
    master.connect(ctx.destination);

    const freqs = [110, 164.81, 220, 329.63];
    nodesRef.current = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      gain.gain.value = 0.2 / (i + 1);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05 + i * 0.02;
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      lfo.start();
      return osc;
    });

    return () => {
      nodesRef.current.forEach((n) => {
        try {
          (n as OscillatorNode).stop?.();
        } catch {
          /* */
        }
      });
      ctx.close();
    };
  }, [enabled]);

  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={() => dispatch(setAudio(!enabled))}
      className="fixed bottom-4 right-4 z-50 rounded-full border border-neon-cyan/30 bg-void-900/80 px-3 py-2 text-xs text-neon-cyan backdrop-blur"
    >
      {enabled ? 'Soundtrack On' : 'Enable Soundtrack'}
    </button>
  );
}
