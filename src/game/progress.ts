/**
 * Pure decoupled checkpoint, Spectrum POKE Rado mode, and safe storage persistence.
 * Zero DOM dependencies — accepts any Storage-like object (or null/undefined) for unit testing.
 */

export const PROGRESS_STORAGE_KEY = 'zubok_signalik_progress_v1';
export const CHECKPOINT_SCORE_PENALTY_RATIO = 0.2;
export const RADO_POKE_EXTRA_HP = 2;
export const RADO_POKE_ENEMY_SHOT_SCALE = 0.7;

export interface SavedGameProgress {
  checkpointStageIndex: number;
  checkpointScore: number;
  bestScore: number;
  radoPokeMode: boolean;
  stageLosses: Record<number, number>;
}

export interface StorageReader {
  getItem(key: string): string | null;
}

export interface StorageWriter {
  setItem(key: string, value: string): void;
}

export function createDefaultProgress(bestScore = 0): SavedGameProgress {
  return {
    checkpointStageIndex: 0,
    checkpointScore: 0,
    bestScore: Number.isFinite(bestScore) && bestScore > 0 ? Math.round(bestScore) : 0,
    radoPokeMode: false,
    stageLosses: {},
  };
}

/**
 * Applies the checkpoint continue penalty (-20 % score, clamped >= 0).
 */
export function applyCheckpointPenalty(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.max(0, Math.round(score * (1 - CHECKPOINT_SCORE_PENALTY_RATIO)));
}

/**
 * Records a defeat on a specific stage and reports whether the Spectrum
 * "POKE 48621,5 – RADO REŽIM? A / N" prompt should be offered (after 2nd loss in the SAME stage).
 */
export function recordStageLoss(
  stageLosses: Record<number, number>,
  stageIndex: number
): { nextLosses: Record<number, number>; shouldOfferPoke: boolean } {
  const prev = Number.isFinite(stageLosses[stageIndex]) ? stageLosses[stageIndex] : 0;
  const count = prev + 1;
  const nextLosses: Record<number, number> = { ...stageLosses, [stageIndex]: count };
  return {
    nextLosses,
    shouldOfferPoke: count >= 2,
  };
}

/**
 * Loads saved progress defensively. Never throws even if storage is unavailable,
 * denied (e.g. file:// / private mode), or contains corrupt JSON.
 */
export function loadSavedProgress(storage?: StorageReader | null): SavedGameProgress {
  if (!storage) return createDefaultProgress(0);
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createDefaultProgress(0);
    const parsed = JSON.parse(raw) as Partial<SavedGameProgress> | null;
    if (!parsed || typeof parsed !== 'object') {
      return createDefaultProgress(0);
    }

    const stageLosses: Record<number, number> = {};
    if (parsed.stageLosses && typeof parsed.stageLosses === 'object') {
      for (const [k, v] of Object.entries(parsed.stageLosses)) {
        const idx = Number.parseInt(k, 10);
        if (Number.isInteger(idx) && idx >= 0 && typeof v === 'number' && Number.isFinite(v) && v >= 0) {
          stageLosses[idx] = Math.floor(v);
        }
      }
    }

    return {
      checkpointStageIndex:
        typeof parsed.checkpointStageIndex === 'number' &&
        Number.isInteger(parsed.checkpointStageIndex) &&
        parsed.checkpointStageIndex >= 0
          ? parsed.checkpointStageIndex
          : 0,
      checkpointScore:
        typeof parsed.checkpointScore === 'number' &&
        Number.isFinite(parsed.checkpointScore) &&
        parsed.checkpointScore >= 0
          ? Math.round(parsed.checkpointScore)
          : 0,
      bestScore:
        typeof parsed.bestScore === 'number' &&
        Number.isFinite(parsed.bestScore) &&
        parsed.bestScore >= 0
          ? Math.round(parsed.bestScore)
          : 0,
      radoPokeMode: Boolean(parsed.radoPokeMode),
      stageLosses,
    };
  } catch {
    return createDefaultProgress(0);
  }
}

/**
 * Persists progress defensively. Returns false on any storage error without throwing.
 */
export function saveProgress(
  progress: SavedGameProgress,
  storage?: StorageWriter | null
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
