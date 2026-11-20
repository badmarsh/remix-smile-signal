/**
 * Authentic Dual-Chip Didaktik M Audio Engine:
 *  1) 1-Bit Piezo Beeper (Port 0xFE square wave)
 *  2) Didaktik Melodik (AY-3-8912 3-channel polyphonic chiptune mode, inspired by F.I.R.E. / Fuxoft)
 * + Live Magnetic Cassette Tape Audio Player for loading onto real Didaktik M hardware.
 */

import { BeeperStep, DIDAKTIK_CHIPTUNE_PACK, semitoneToFrequency } from '../didaktik/chiptuneAssets';
import { getMelodikTrack, getStepDurationSec, MelodikTrackId } from './music';
import { AudioChipMode, AudioEvent } from './types';

class DidaktikAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicEnabled = true;
  private chipMode: AudioChipMode = 'melodik';
  private tapeSource: AudioBufferSourceNode | null = null;
  private tapeStartTime = 0;
  private tapeDuration = 0;
  private tapeProgressRaf = 0;
  private previewTimer: number | null = null;
  private musicTimer: number | null = null;
  private currentTrackId: MelodikTrackId | null = null;
  private musicStepIdx = 0;
  private userUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.userUnlocked = true;
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  private ensureContext(requireGesture = false): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (requireGesture && !this.userUnlocked) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended' && this.userUnlocked) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopMusic();
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    }
    return this.muted;
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  public getCurrentTrackId(): MelodikTrackId | null {
    return this.currentTrackId;
  }

  public startMusic(trackId: MelodikTrackId): void {
    if (this.muted || !this.musicEnabled || this.tapeSource) return;
    if (this.currentTrackId === trackId && this.musicTimer !== null) return;
    this.stopMusic();
    this.currentTrackId = trackId;
    this.musicStepIdx = 0;

    const track = getMelodikTrack(trackId);
    const stepSec = getStepDurationSec(track);

    const playStep = () => {
      if (this.muted || !this.musicEnabled || this.tapeSource || this.currentTrackId !== trackId) {
        return;
      }
      if (!this.userUnlocked) {
        return;
      }
      const step = track.steps[this.musicStepIdx % track.steps.length];
      this.musicStepIdx = (this.musicStepIdx + 1) % track.steps.length;
      const dur = stepSec * 0.82;

      if (this.chipMode === 'melodik') {
        if (step.lead !== null) {
          this.tone(this.semitoneToHz(step.lead), dur, 0, 0.032, undefined, 'square');
        }
        if (step.harmony !== null) {
          this.tone(this.semitoneToHz(step.harmony), dur * 0.72, 0.004, 0.018, undefined, 'square');
        }
        if (step.bass !== null) {
          this.tone(this.semitoneToHz(step.bass), dur * 0.92, 0, 0.038, undefined, 'triangle');
        }
      } else {
        // Authentic 1-bit Beeper single-voice lead fallback
        if (step.lead !== null) {
          this.tone(this.semitoneToHz(step.lead), dur * 0.75, 0, 0.028, undefined, 'square');
        } else if (step.bass !== null) {
          this.tone(this.semitoneToHz(step.bass), dur * 0.6, 0, 0.022, undefined, 'square');
        }
      }
    };

    playStep();
    this.musicTimer = window.setInterval(playStep, Math.max(60, Math.round(stepSec * 1000)));
  }

  /**
   * Starts a jukebox preview track directly from the Chiptune/Melodik studio,
   * temporarily ensuring music playback even if paused in gameplay.
   */
  public playJukeboxTrack(trackId: MelodikTrackId): void {
    this.userUnlocked = true;
    if (this.currentTrackId === trackId && this.musicTimer !== null) {
      this.stopMusic();
      return;
    }
    this.muted = false;
    this.musicEnabled = true;
    this.stopCassetteSignal();
    this.startMusic(trackId);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentTrackId = null;
  }

  public getChipMode(): AudioChipMode {
    return this.chipMode;
  }

  public toggleChipMode(): AudioChipMode {
    this.chipMode = this.chipMode === 'melodik' ? 'beeper' : 'melodik';
    // Play quick confirmation chime in the newly selected chip mode
    this.playEvents([{ type: 'swapHero' }]);
    return this.chipMode;
  }

  /**
   * Synthesizes a tone using either 1-bit square wave (Beeper) or multi-voice AY-3-8912 style.
   */
  private tone(
    freq: number,
    duration: number,
    delay = 0,
    gainLevel = 0.09,
    endFreq?: number,
    wave: OscillatorType = 'square'
  ): void {
    if (this.muted) return;
    const ctx = this.ensureContext(true);
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = this.chipMode === 'beeper' ? 'square' : wave;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + 0.004);
    gain.gain.setValueAtTime(gainLevel, Math.max(now + 0.005, now + duration - 0.01));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.018);
  }

  /**
   * Melodik AY-3-8912 3-channel harmonic chord (Lead + Fifth/Third + Bass).
   */
  private ayChord(semitones: number[], duration: number, delay = 0, gainLevel = 0.06): void {
    if (this.chipMode === 'beeper') {
      // Fallback to authentic 1-bit fast arpeggio on single piezo channel
      const step = duration / Math.max(1, semitones.length);
      semitones.forEach((s, i) => {
        this.tone(this.semitoneToHz(s), step * 0.9, delay + i * step, gainLevel * 1.3, undefined, 'square');
      });
      return;
    }

    semitones.forEach((s, idx) => {
      const wave: OscillatorType = idx === 0 ? 'triangle' : 'square';
      this.tone(this.semitoneToHz(s), duration, delay, gainLevel, undefined, wave);
    });
  }

  private semitoneToHz(semitone: number): number {
    return 261.63 * Math.pow(2, semitone / 12);
  }

  public playEvents(events: AudioEvent[]): void {
    if (this.muted || events.length === 0) return;
    const isMelodik = this.chipMode === 'melodik';

    for (const ev of events) {
      const jitter = 0.94 + Math.random() * 0.12;
      switch (ev.type) {
        case 'shoot':
          this.tone(980 * jitter, 0.055, 0, 0.07, 420);
          if (isMelodik) {
            this.tone(490 * jitter, 0.06, 0, 0.04, 210, 'triangle');
          }
          break;
        case 'signalWave':
          this.tone(620 * jitter, 0.06, 0, 0.06, 1180);
          if (isMelodik) {
            this.tone(930 * jitter, 0.07, 0.02, 0.05, 1480, 'triangle');
          }
          break;
        case 'dash':
          this.tone(240, 0.08, 0, 0.07, 740, 'sawtooth');
          if (isMelodik) {
            this.tone(520, 0.06, 0.03, 0.04, 180, 'triangle');
          }
          break;
        case 'swapHero':
          this.ayChord([12, 19], 0.06, 0, 0.06);
          this.ayChord([16, 24], 0.09, 0.055, 0.06);
          break;
        case 'bubbleTrap':
          this.tone(420, 0.05, 0, 0.07, 880);
          this.tone(660, 0.06, 0.04, 0.06, 1240, 'triangle');
          break;
        case 'bubblePop':
          this.ayChord([12, 16, 24], 0.09, 0, 0.07);
          this.tone(1320, 0.06, 0.05, 0.07, 520);
          break;
        case 'relicFound':
          this.ayChord([0, 12, 16], 0.09, 0, 0.07);
          this.ayChord([2, 14, 19], 0.09, 0.09, 0.07);
          this.ayChord([4, 16, 23], 0.1, 0.18, 0.07);
          this.ayChord([0, 12, 19, 24], 0.24, 0.28, 0.07);
          break;
        case 'enemyHit':
          this.tone(310 * jitter, 0.06, 0, 0.09, 170);
          break;
        case 'enemyKo':
          this.tone(480 * jitter, 0.05, 0, 0.1, 220);
          this.tone(180, 0.09, 0.045, 0.1, 80);
          if (isMelodik) {
            this.tone(95, 0.12, 0.03, 0.07, 50, 'triangle');
          }
          break;
        case 'restore':
          this.tone(this.semitoneToHz(12) * jitter, 0.06, 0, 0.08);
          this.tone(this.semitoneToHz(16) * jitter, 0.07, 0.055, 0.08);
          this.ayChord([12, 19], 0.1, 0.115, 0.06);
          break;
        case 'pickup':
          this.tone(this.semitoneToHz(19), 0.05, 0, 0.08);
          this.ayChord([12, 24], 0.09, 0.05, 0.06);
          break;
        case 'jingle_bell': {
          const sfx = DIDAKTIK_CHIPTUNE_PACK.find((s) => s.id === 'jingle_bell');
          if (sfx) {
            this.playChiptuneSteps(sfx.steps);
          }
          break;
        }
        case 'telegraph':
          this.tone(640, 0.04, 0, 0.06, 860);
          break;
        case 'playerHurt':
          this.tone(190, 0.12, 0, 0.12, 75);
          this.tone(110, 0.14, 0.09, 0.11, 55);
          break;
        case 'stageClear':
          this.ayChord([0, 12], 0.09, 0, 0.07);
          this.ayChord([4, 16], 0.09, 0.09, 0.07);
          this.ayChord([7, 19], 0.09, 0.18, 0.07);
          this.ayChord([0, 12, 16, 24], 0.24, 0.27, 0.07);
          break;
        case 'victory': {
          // F.I.R.E. Melodik / Didaktik M Christmas Victory Fanfare
          const notes: Array<[number, number, number]> = [
            [16, 0, 0.13],
            [16, 0, 0.13],
            [16, 4, 0.26],
            [16, 0, 0.13],
            [16, 0, 0.13],
            [16, 4, 0.26],
            [16, 7, 0.13],
            [19, 7, 0.13],
            [12, 0, 0.16],
            [14, 2, 0.1],
            [16, 0, 0.36],
          ];
          let t = 0;
          for (const [lead, bass, dur] of notes) {
            this.ayChord([bass, lead], dur * 0.88, t, 0.075);
            t += dur;
          }
          break;
        }
        case 'gameOver':
          this.ayChord([-5, 7], 0.16, 0, 0.08);
          this.ayChord([-6, 6], 0.16, 0.17, 0.08);
          this.ayChord([-7, 5], 0.16, 0.34, 0.08);
          this.tone(this.semitoneToHz(0), 0.35, 0.51, 0.11, 110);
          break;
      }
    }
  }

  /**
   * Plays a real generated Float32Array Sinclair cassette tape signal directly
   * through the browser audio output (for live loading into a Didaktik M MG port
   * or recording onto physical magnetic cassette tape).
   */
  public playCassetteSignal(
    samples: Float32Array,
    sampleRate: number,
    onProgress: (progress: number, phaseLabel: 'pilot' | 'data' | 'pause' | 'done') => void,
    onEnded: () => void
  ): void {
    this.stopMusic();
    this.stopCassetteSignal();
    const ctx = this.ensureContext();
    if (!ctx) {
      onEnded();
      return;
    }

    const audioBuffer = ctx.createBuffer(1, samples.length, sampleRate);
    audioBuffer.copyToChannel(new Float32Array(samples), 0);

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.85;
    src.connect(gain);
    gain.connect(ctx.destination);

    this.tapeSource = src;
    this.tapeStartTime = ctx.currentTime;
    this.tapeDuration = samples.length / sampleRate;

    src.onended = () => {
      if (this.tapeSource === src) {
        this.tapeSource = null;
        cancelAnimationFrame(this.tapeProgressRaf);
        onProgress(1, 'done');
        onEnded();
      }
    };

    src.start();

    const tick = () => {
      if (!this.tapeSource || !this.ctx) return;
      const elapsed = this.ctx.currentTime - this.tapeStartTime;
      const ratio = Math.min(1, Math.max(0, elapsed / this.tapeDuration));
      let phaseLabel: 'pilot' | 'data' | 'pause' | 'done' = 'data';
      if (elapsed < 0.35) {
        phaseLabel = 'pause';
      } else if (elapsed < 5.3) {
        phaseLabel = 'pilot';
      } else if (elapsed < 5.5) {
        phaseLabel = 'data';
      } else if (elapsed < 6.5) {
        phaseLabel = 'pause';
      } else if (elapsed < 8.5) {
        phaseLabel = 'pilot';
      } else {
        phaseLabel = 'data';
      }
      onProgress(ratio, phaseLabel);
      if (ratio < 1) {
        this.tapeProgressRaf = requestAnimationFrame(tick);
      }
    };
    this.tapeProgressRaf = requestAnimationFrame(tick);
  }

  public playChiptuneSteps(steps: BeeperStep[], onComplete?: () => void): void {
    if (this.previewTimer !== null) {
      window.clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
    const ctx = this.ensureContext();
    if (!ctx) {
      onComplete?.();
      return;
    }

    const wasMuted = this.muted;
    const prevMode = this.chipMode;
    this.muted = false;
    this.chipMode = 'beeper';
    let offset = 0;
    for (const s of steps) {
      if (s.semitone !== null) {
        this.tone(semitoneToFrequency(s.semitone), Math.max(0.012, s.duration * 0.94), offset, 0.1);
      }
      offset += s.duration;
    }
    this.muted = wasMuted;
    this.chipMode = prevMode;

    if (onComplete) {
      this.previewTimer = window.setTimeout(() => {
        this.previewTimer = null;
        onComplete();
      }, Math.max(80, Math.round(offset * 1000) + 40));
    }
  }

  public stopCassetteSignal(): void {
    cancelAnimationFrame(this.tapeProgressRaf);
    if (this.tapeSource) {
      try {
        this.tapeSource.onended = null;
        this.tapeSource.stop();
      } catch {
        // Ignore already-stopped source
      }
      this.tapeSource = null;
    }
  }
}

export const didaktikAudio = new DidaktikAudioEngine();
