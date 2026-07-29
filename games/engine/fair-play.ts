/**
 * Fair-play helpers — “Easy to start. Difficult to master. Always rewarding.”
 * Losses should feel like skill gaps players can close, never like cheating.
 */

export type DifficultyState = {
  /** 0.75 – 1.35 adaptive multiplier */
  scale: number;
  wins: number;
  losses: number;
  assistCharges: number;
};

export const DESIGN_BLEND = {
  skill: 0.7,
  exploration: 0.2,
  luck: 0.1,
} as const;

export function createDifficulty(): DifficultyState {
  return { scale: 1, wins: 0, losses: 0, assistCharges: 1 };
}

/** Record outcome and gently adapt — never spike unfairly. */
export function recordOutcome(state: DifficultyState, won: boolean): DifficultyState {
  const next = { ...state };
  if (won) {
    next.wins += 1;
    next.losses = 0;
    if (next.wins >= 3) {
      next.scale = Math.min(1.35, next.scale + 0.05);
      next.wins = 0;
    }
  } else {
    next.losses += 1;
    next.wins = 0;
    if (next.losses >= 2) {
      next.scale = Math.max(0.75, next.scale - 0.06);
      next.assistCharges = Math.min(3, next.assistCharges + 1);
      next.losses = 0;
    }
  }
  return next;
}

/** Prefer new mechanics over raw enemy HP stacking. */
export function mechanicTier(scale: number): 'intro' | 'twist' | 'mastery' | 'legend' {
  if (scale < 0.9) return 'intro';
  if (scale < 1.1) return 'twist';
  if (scale < 1.25) return 'mastery';
  return 'legend';
}

export function shouldOfferAssist(state: DifficultyState): boolean {
  return state.assistCharges > 0 && state.scale <= 0.9;
}

export function consumeAssist(state: DifficultyState): DifficultyState {
  return { ...state, assistCharges: Math.max(0, state.assistCharges - 1) };
}
