import type { GamePhase, PlayMode } from './types';

/**
 * Decoupled 3-channel Didaktik Melodik (AY-3-8912) & 1-bit Beeper music sequencer data.
 * Zero DOM dependencies — runs deterministically in unit tests and drives Web Audio in audio.ts.
 *
 * 5 original festive / retro-arcade + Christmas loops for Didaktik M:
 *  1) microdent — Klinika microDENT (bright 8-bit arpeggio, 128 BPM)
 *  2) teatro    — Optický impulz TeatrO (energetic 10G synth-bass & lead, 136 BPM)
 *  3) rimava    — Rimavská Sobota: Zimný večer (warm winter chiptune for Rimava & Múzeum, 118 BPM)
 *  4) boss      — Finále: Veľký Rušič (dramatic minor boss battle theme, 148 BPM)
 *  5) vianoce  — Koleda Rimavskej Soboty (Tichá noc · vianočná koleda, 110 BPM)
 */

export type MelodikTrackId = 'microdent' | 'teatro' | 'rimava' | 'boss' | 'vianoce';

export interface MelodikStep {
  /** Lead channel A semitone offset from C4 (null = rest) */
  lead: number | null;
  /** Harmony / arpeggio channel B semitone offset from C4 (null = rest) */
  harmony: number | null;
  /** Bass channel C semitone offset from C4 (null = rest) */
  bass: number | null;
}

export interface MelodikTrack {
  id: MelodikTrackId;
  title: string;
  subtitle: string;
  bpm: number;
  /** Steps per beat (typically 2 = eighth notes) */
  stepsPerBeat: number;
  steps: MelodikStep[];
}

export const MELODIK_TRACKS: MelodikTrack[] = [
  {
    id: 'microdent',
    title: '01 · Klinika microDENT',
    subtitle: 'Úvod & presný CEREC arpeggio motív',
    bpm: 128,
    stepsPerBeat: 2,
    steps: [
      { lead: 12, harmony: 16, bass: -12 },
      { lead: 16, harmony: 19, bass: null },
      { lead: 19, harmony: 12, bass: -12 },
      { lead: 24, harmony: 19, bass: -5 },
      { lead: 21, harmony: 17, bass: -7 },
      { lead: 19, harmony: 16, bass: null },
      { lead: 16, harmony: 12, bass: -7 },
      { lead: 14, harmony: 11, bass: -5 },
      { lead: 12, harmony: 16, bass: -12 },
      { lead: 14, harmony: 17, bass: null },
      { lead: 16, harmony: 19, bass: -8 },
      { lead: 19, harmony: 24, bass: -5 },
      { lead: 17, harmony: 14, bass: -10 },
      { lead: 16, harmony: 12, bass: null },
      { lead: 14, harmony: 11, bass: -5 },
      { lead: null, harmony: 7, bass: -5 },
    ],
  },
  {
    id: 'teatro',
    title: '02 · Optický impulz TeatrO',
    subtitle: '10G optická linka · rýchly AY bas',
    bpm: 136,
    stepsPerBeat: 2,
    steps: [
      { lead: 16, harmony: 12, bass: -8 },
      { lead: null, harmony: 19, bass: -8 },
      { lead: 19, harmony: 16, bass: -12 },
      { lead: 21, harmony: 16, bass: -8 },
      { lead: 24, harmony: 19, bass: -3 },
      { lead: 23, harmony: 19, bass: -5 },
      { lead: 19, harmony: 16, bass: -8 },
      { lead: 16, harmony: 12, bass: -5 },
      { lead: 14, harmony: 11, bass: -10 },
      { lead: 16, harmony: 12, bass: -10 },
      { lead: 19, harmony: 14, bass: -5 },
      { lead: 17, harmony: 14, bass: -5 },
      { lead: 16, harmony: 12, bass: -8 },
      { lead: 14, harmony: 11, bass: -10 },
      { lead: 12, harmony: 9, bass: -12 },
      { lead: 14, harmony: 11, bass: -5 },
    ],
  },
  {
    id: 'rimava',
    title: '03 · Rimavská Sobota (Zima)',
    subtitle: 'Vianočný 8-bit motív · Rimava & Múzeum',
    bpm: 118,
    stepsPerBeat: 2,
    steps: [
      { lead: 16, harmony: 12, bass: -12 },
      { lead: 16, harmony: null, bass: -5 },
      { lead: 16, harmony: 12, bass: -12 },
      { lead: null, harmony: 19, bass: -5 },
      { lead: 16, harmony: 12, bass: -7 },
      { lead: 19, harmony: 16, bass: -5 },
      { lead: 12, harmony: 9, bass: -12 },
      { lead: 14, harmony: 11, bass: -10 },
      { lead: 16, harmony: 12, bass: -12 },
      { lead: null, harmony: 16, bass: -5 },
      { lead: 17, harmony: 14, bass: -7 },
      { lead: 17, harmony: 14, bass: -7 },
      { lead: 17, harmony: 12, bass: -12 },
      { lead: 16, harmony: 12, bass: -12 },
      { lead: 14, harmony: 11, bass: -5 },
      { lead: 19, harmony: 14, bass: -5 },
    ],
  },
  {
    id: 'boss',
    title: '04 · Finále: Veľký Rušič',
    subtitle: 'Hlavné námestie · dramatický boss súboj',
    bpm: 148,
    stepsPerBeat: 2,
    steps: [
      { lead: 9, harmony: 12, bass: -15 },
      { lead: 12, harmony: 16, bass: -15 },
      { lead: 15, harmony: 12, bass: -12 },
      { lead: 16, harmony: 12, bass: -15 },
      { lead: 15, harmony: 11, bass: -16 },
      { lead: 12, harmony: 9, bass: -15 },
      { lead: 11, harmony: 8, bass: -17 },
      { lead: 12, harmony: 9, bass: -15 },
      { lead: 16, harmony: 12, bass: -10 },
      { lead: 19, harmony: 16, bass: -10 },
      { lead: 20, harmony: 16, bass: -8 },
      { lead: 19, harmony: 15, bass: -10 },
      { lead: 16, harmony: 12, bass: -12 },
      { lead: 15, harmony: 11, bass: -13 },
      { lead: 12, harmony: 8, bass: -17 },
      { lead: 11, harmony: 7, bass: -17 },
    ],
  },
  {
    id: 'vianoce',
    title: '05 · Koleda Rimavskej Soboty',
    subtitle: 'Tichá noc nad RS · vianočná koleda AY · 110 BPM',
    bpm: 110,
    stepsPerBeat: 2,
    steps: [
      // Phrase A — C major Christmas opening (C-E-G triad ascending)
      // 8bits-music MCP: C major scale C5→C4 | C-Am-F-G harmonization
      { lead: 12, harmony: 16, bass: -12 }, // C5 / E5 / C3
      { lead: 16, harmony: 19, bass: -12 }, // E5 / G5 / C3
      { lead: 19, harmony: 24, bass:  -5 }, // G5 / C6 / G3
      { lead: 24, harmony: 19, bass:  -5 }, // C6 peak / G5 / G3
      { lead: 11, harmony: 14, bass:  -3 }, // B4 / D5 / A3 — Am
      { lead:  7, harmony: 11, bass:  -3 }, // G4 / B4 / A3
      { lead:  4, harmony:  7, bass:  -8 }, // E4 / G4 / E3
      { lead:  2, harmony:  5, bass:  -8 }, // D4 / F4 / E3
      { lead:  5, harmony:  9, bass:  -7 }, // F4 / A4 / F3 — F major
      { lead:  9, harmony: 12, bass:  -7 }, // A4 / C5 / F3
      { lead: 12, harmony: 16, bass: -12 }, // C5 / E5 / C3
      { lead: 11, harmony: 14, bass:  -7 }, // B4 / D5 / F3
      { lead:  7, harmony: 11, bass:  -5 }, // G4 / B4 / G3 — G major
      { lead:  4, harmony:  7, bass:  -5 }, // E4 / G4 / G3
      { lead:  2, harmony:  5, bass: -10 }, // D4 / F4 / D3
      { lead:  0, harmony:  4, bass: -12 }, // C4 / E4 / C3 — resolve
    ],
  },
];

export function getMelodikTrack(id: MelodikTrackId): MelodikTrack {
  return MELODIK_TRACKS.find((t) => t.id === id) ?? MELODIK_TRACKS[0];
}

export function getStepDurationSec(track: MelodikTrack): number {
  return 60 / (track.bpm * track.stepsPerBeat);
}

/**
 * Selects the matching Melodik AY track for each Rimavská Sobota stage.
 */
export function selectTrackForStage(stageIndex: number, bossActive: boolean): MelodikTrackId {
  if (bossActive || stageIndex >= 5) return 'boss';
  if (stageIndex <= 1) return 'microdent';
  if (stageIndex === 2) return 'teatro';
  return 'rimava';
}

/**
 * Returns the track for the title screen and victory/handover cutscene.
 * Always plays the Christmas Koleda on title and celebration screens.
 */
export function selectTitleTrack(): MelodikTrackId {
  return 'vianoce';
}

/**
 * Selects the Melodik AY track for each Service Incident Arc play mode.
 * deploy_select & timed_arena -> microdent (urgent clinic arpeggio)
 * relay_repair & wave_defense -> rimava (warm winter chiptune)
 * normal -> falls back to stage-based selection
 */
export function selectTrackForMode(
  playMode: PlayMode,
  bossActive: boolean
): MelodikTrackId {
  if (bossActive) return 'boss';
  switch (playMode) {
    case 'deploy_select':
    case 'timed_arena':
      return 'microdent';
    case 'relay_repair':
    case 'wave_defense':
      return 'rimava';
    case 'normal':
    default:
      return 'microdent';
  }
}

/**
 * Selects the Melodik AY track for the current game phase, mode, and context.
 * Pure function — zero DOM dependencies, deterministic.
 *
 * Rules:
 *  - title / handover / victory → vianoce (Christmas carol)
 *  - gameover → null (silence)
 *  - paused → null (music paused)
 *  - playing + bossActive → boss
 *  - playing + non-normal mode → selectTrackForMode
 *  - playing + normal → selectTrackForStage
 *  - overlayOpen or muted → null (silence)
 *
 * Returns null when music should stop / not play.
 */
export function selectTrackForPhase(
  phase: GamePhase,
  playMode: PlayMode,
  stageIndex: number,
  bossActive: boolean,
  overlayOpen: boolean,
  muted: boolean
): MelodikTrackId | null {
  if (muted || overlayOpen) return null;

  switch (phase) {
    case 'title':
    case 'handover':
    case 'victory':
      return 'vianoce';
    case 'gameover':
    case 'paused':
      return null;
    case 'playing':
    case 'stage_clear':
      if (bossActive) return 'boss';
      if (playMode !== 'normal') {
        return selectTrackForMode(playMode, bossActive);
      }
      return selectTrackForStage(stageIndex, bossActive);
  }
}

/**
 * Returns true when the given track is a Christmas/holiday track.
 * Used to gate Christmas-specific audio events (jingle_bell SFX etc.)
 */
export function isChristmasTrack(id: MelodikTrackId): boolean {
  return id === 'vianoce';
}
