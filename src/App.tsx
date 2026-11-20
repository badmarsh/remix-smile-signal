import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_RADO_PORTRAIT_URL } from './components/BrandEmblems';
import { CassetteIntroOverlay } from './components/CassetteIntroOverlay';
import { GameHud } from './components/GameHud';
import { SecretRoomModal } from './components/SecretRoomModal';
import { StatusModal } from './components/StatusModal';
import { KitTab, TapeKitModal } from './components/TapeKitModal';
import { TitleOverlay } from './components/TitleOverlay';
import { VisualManualModal } from './components/VisualManualModal';
import { CITIZEN_SIGNATURES, formatSignaturesAsBasicData } from './data/signatures';
import { BasicProgramConfig, DEFAULT_TAPE_CONFIG } from './didaktik/basicSource';
import { DEFAULT_UDG_PACK, DidaktikUdgAsset } from './didaktik/udgAssets';
import { createZxQuantizedPortraitCanvas } from './didaktik/zxScreenCompose';
import { didaktikAudio } from './game/audio';
import {
  advanceHandoverToVictory,
  continueFromCheckpoint,
  createWorld,
  drainAudioQueue,
  getHudSnapshot,
  restartCurrentRun,
  setRadoPokeMode,
  startNewGame,
  stepWorld,
  swapActiveHero,
  toggleCoopMode,
} from './game/engine';
import { selectTrackForStage, selectTitleTrack } from './game/music';
import { loadSavedProgress, saveProgress } from './game/progress';
import { LOGICAL_H, LOGICAL_W, renderDidaktikFrame } from './game/renderer';
import { AudioChipMode, GameWorld, HudSnapshot, InputState } from './game/types';

const BEST_SCORE_KEY = 'smile_signal_didaktik_best_v1';
const CUSTOM_RADO_PHOTO_KEY = 'zubok_signalik_rado_photo_v1';

function readStoredBestScore(): number {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeStoredBestScore(score: number): void {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(Math.round(score)));
  } catch {
    // Ignore storage quota errors
  }
}

function readStoredRadoPhoto(): string | null {
  try {
    return window.localStorage.getItem(CUSTOM_RADO_PHOTO_KEY);
  } catch {
    return null;
  }
}

function shouldAutostart(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1';
  } catch {
    return false;
  }
}

function toBodyDatasetState(phase: GameWorld['phase']): string {
  if (phase === 'title') return 'title';
  if (phase === 'paused') return 'paused';
  if (phase === 'victory' || phase === 'gameover') return 'gameover';
  return 'playing';
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<GameWorld | null>(null);
  const crtEnabledRef = useRef(true);
  const modalBlockingRef = useRef(false);
  const radoPixelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysHeldRef = useRef<Set<string>>(new Set());
  const fireJustPressedRef = useRef(false);
  const p2FireJustPressedRef = useRef(false);
  const dashJustPressedRef = useRef(false);
  const swapJustPressedRef = useRef(false);

  const [tapeConfig, setTapeConfig] = useState<BasicProgramConfig>(DEFAULT_TAPE_CONFIG);
  const [udgPack, setUdgPack] = useState<DidaktikUdgAsset[]>(DEFAULT_UDG_PACK);
  const [tapeKitOpen, setTapeKitOpen] = useState(false);
  const [visualManualOpen, setVisualManualOpen] = useState(false);
  const [secretRoomOpen, setSecretRoomOpen] = useState(false);
  const [kitInitialTab, setKitInitialTab] = useState<KitTab>('cassette');
  const [muted, setMuted] = useState(false);
  const [chipMode, setChipMode] = useState<AudioChipMode>(() => didaktikAudio.getChipMode());
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [introVisible, setIntroVisible] = useState(() => !shouldAutostart());
  const [customRadoPhoto, setCustomRadoPhoto] = useState<string | null>(() => readStoredRadoPhoto());

  const activeRadoPhotoUrl = customRadoPhoto || DEFAULT_RADO_PORTRAIT_URL;

  if (!worldRef.current) {
    const initialPhase = shouldAutostart() ? 'playing' : 'title';
    const saved = loadSavedProgress(
      typeof window !== 'undefined' ? window.localStorage : null
    );
    const best = Math.max(readStoredBestScore(), saved.bestScore);
    const created = createWorld(initialPhase, best);
    if (saved.radoPokeMode) {
      setRadoPokeMode(created, true);
    }
    created.checkpointStageIndex = saved.checkpointStageIndex;
    created.checkpointScore = saved.checkpointScore;
    created.stageLosses = { ...saved.stageLosses };
    worldRef.current = created;
  }

  const [hud, setHud] = useState<HudSnapshot>(() => getHudSnapshot(worldRef.current!));

  useEffect(() => {
    modalBlockingRef.current = tapeKitOpen || visualManualOpen || secretRoomOpen || introVisible;
  }, [tapeKitOpen, visualManualOpen, secretRoomOpen, introVisible]);

  // Pre-render Rado's photo into a strictly ZX_PALETTE quantized 24x24 pixel-art offscreen canvas
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      radoPixelCanvasRef.current = createZxQuantizedPortraitCanvas(img, 24);
    };
    img.src = activeRadoPhotoUrl;
    return () => {
      cancelled = true;
    };
  }, [activeRadoPhotoUrl]);

  const handleUploadRadoPhoto = useCallback((dataUrl: string) => {
    setCustomRadoPhoto(dataUrl);
    try {
      window.localStorage.setItem(CUSTOM_RADO_PHOTO_KEY, dataUrl);
    } catch {
      // Ignore quota exceeded for very large files; state still updates live
    }
  }, []);

  const handleResetRadoPhoto = useCallback(() => {
    setCustomRadoPhoto(null);
    try {
      window.localStorage.removeItem(CUSTOM_RADO_PHOTO_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const persistWorldProgress = useCallback((world: GameWorld) => {
    saveProgress(
      {
        checkpointStageIndex: world.checkpointStageIndex,
        checkpointScore: world.checkpointScore,
        bestScore: world.bestScore,
        radoPokeMode: world.radoPokeMode,
        stageLosses: world.stageLosses,
      },
      typeof window !== 'undefined' ? window.localStorage : null
    );
  }, []);

  const syncHudNow = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    document.body.dataset.state = toBodyDatasetState(world.phase);
    if (world.bestScore > readStoredBestScore()) {
      writeStoredBestScore(world.bestScore);
    }
    persistWorldProgress(world);
    setHud(getHudSnapshot(world));
  }, [persistWorldProgress]);

  const clearInputs = useCallback(() => {
    keysHeldRef.current.clear();
    fireJustPressedRef.current = false;
    p2FireJustPressedRef.current = false;
    dashJustPressedRef.current = false;
    swapJustPressedRef.current = false;
  }, []);

  const handleStart = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    clearInputs();
    startNewGame(world);
    syncHudNow();
    canvasRef.current?.focus();
  }, [clearInputs, syncHudNow]);

  const handleRestart = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    clearInputs();
    restartCurrentRun(world);
    syncHudNow();
    canvasRef.current?.focus();
  }, [clearInputs, syncHudNow]);

  const handleContinueCheckpoint = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    clearInputs();
    continueFromCheckpoint(world);
    syncHudNow();
    canvasRef.current?.focus();
  }, [clearInputs, syncHudNow]);

  const handleAcceptRadoPoke = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    clearInputs();
    setRadoPokeMode(world, true);
    continueFromCheckpoint(world);
    syncHudNow();
    canvasRef.current?.focus();
  }, [clearInputs, syncHudNow]);

  const handleDeclineRadoPoke = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    world.pokePromptVisible = false;
    syncHudNow();
  }, [syncHudNow]);

  const handleSwapHero = useCallback(() => {
    const world = worldRef.current;
    if (!world || world.phase !== 'playing') return;
    swapActiveHero(world);
    const events = drainAudioQueue(world);
    if (events.length > 0) didaktikAudio.playEvents(events);
    syncHudNow();
    canvasRef.current?.focus();
  }, [syncHudNow]);

  const handleToggleCoop = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    clearInputs();
    toggleCoopMode(world);
    didaktikAudio.playEvents([{ type: 'swapHero' }]);
    syncHudNow();
    if (world.phase === 'playing') {
      canvasRef.current?.focus();
    }
  }, [clearInputs, syncHudNow]);

  const handleTogglePause = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    if (world.phase === 'playing') {
      world.phase = 'paused';
      clearInputs();
      syncHudNow();
    } else if (world.phase === 'paused') {
      world.phase = 'playing';
      clearInputs();
      syncHudNow();
      canvasRef.current?.focus();
    }
  }, [clearInputs, syncHudNow]);

  const handleReturnTitle = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    clearInputs();
    world.phase = 'title';
    syncHudNow();
  }, [clearInputs, syncHudNow]);

  const handleToggleMute = useCallback(() => {
    const next = didaktikAudio.toggleMute();
    setMuted(next);
  }, []);

  const handleToggleChipMode = useCallback(() => {
    const next = didaktikAudio.toggleChipMode();
    setChipMode(next);
  }, []);

  const handleToggleCrt = useCallback(() => {
    setCrtEnabled((prev) => {
      const next = !prev;
      crtEnabledRef.current = next;
      return next;
    });
  }, []);

  const handleOpenKitWithTab = useCallback(
    (tab: KitTab) => {
      const world = worldRef.current;
      if (world && world.phase === 'playing') {
        world.phase = 'paused';
        clearInputs();
        syncHudNow();
      }
      setVisualManualOpen(false);
      setKitInitialTab(tab);
      setTapeKitOpen(true);
    },
    [clearInputs, syncHudNow]
  );

  const handleOpenTapeKit = useCallback(() => {
    handleOpenKitWithTab('cassette');
  }, [handleOpenKitWithTab]);

  const handleOpenVisualManual = useCallback(() => {
    const world = worldRef.current;
    if (world && world.phase === 'playing') {
      world.phase = 'paused';
      clearInputs();
      syncHudNow();
    }
    setTapeKitOpen(false);
    setVisualManualOpen(true);
  }, [clearInputs, syncHudNow]);

  const handleCloseTapeKit = useCallback(() => {
    setTapeKitOpen(false);
    didaktikAudio.stopCassetteSignal();
    didaktikAudio.stopMusic();
  }, []);

  const handleCloseVisualManual = useCallback(() => {
    setVisualManualOpen(false);
  }, []);

  const handleOpenSecretRoom = useCallback(() => {
    setTapeKitOpen(false);
    setVisualManualOpen(false);
    setSecretRoomOpen(true);
  }, []);

  const handleCloseSecretRoom = useCallback(() => {
    setSecretRoomOpen(false);
  }, []);

  const handleVirtualInput = useCallback(
    (control: 'up' | 'down' | 'left' | 'right' | 'fire' | 'dash' | 'swap', pressed: boolean) => {
      if (control === 'dash') {
        if (pressed) dashJustPressedRef.current = true;
        return;
      }
      if (control === 'swap') {
        if (pressed) swapJustPressedRef.current = true;
        return;
      }
      const keyMap: Record<'up' | 'down' | 'left' | 'right' | 'fire', string> = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        fire: 'Space',
      };
      const code = keyMap[control];
      if (pressed) {
        if (control === 'fire' && !keysHeldRef.current.has(code)) {
          fireJustPressedRef.current = true;
        }
        keysHeldRef.current.add(code);
      } else {
        keysHeldRef.current.delete(code);
      }
    },
    []
  );

  useEffect(() => {
    syncHudNow();
  }, [syncHudNow]);

  // Global keyboard listener (unified input hub + title start handshake + shortcuts)
  useEffect(() => {
    const isTypingInInput = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput(e.target)) return;

      if (modalBlockingRef.current) {
        if (e.code === 'Escape') {
          e.preventDefault();
          handleCloseTapeKit();
          handleCloseVisualManual();
          handleCloseSecretRoom();
        }
        return;
      }

      const world = worldRef.current;
      if (!world) return;

      if (
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'Space'
      ) {
        e.preventDefault();
      }

      if (world.phase === 'title' && e.code === 'KeyK' && !e.repeat) {
        e.preventDefault();
        handleOpenSecretRoom();
        return;
      }

      if (world.phase === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStart();
        return;
      }

      if (world.phase === 'handover' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        advanceHandoverToVictory(world);
        syncHudNow();
        return;
      }

      if (world.phase === 'gameover' && world.pokePromptVisible && !e.repeat) {
        if (e.code === 'KeyA' || e.code === 'KeyY') {
          e.preventDefault();
          handleAcceptRadoPoke();
          return;
        }
        if (e.code === 'KeyN') {
          e.preventDefault();
          handleDeclineRadoPoke();
          return;
        }
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (world.phase === 'playing' || world.phase === 'paused') {
          e.preventDefault();
          handleTogglePause();
          return;
        }
      }

      if (e.code === 'KeyM' && !e.repeat) {
        handleToggleMute();
        return;
      }

      if (e.code === 'KeyH' && !e.repeat) {
        handleToggleChipMode();
        return;
      }

      if (e.code === 'KeyR' && !e.repeat && world.phase !== 'title') {
        handleRestart();
        return;
      }

      if (e.code === 'KeyT' && !e.repeat) {
        handleOpenTapeKit();
        return;
      }

      if (e.code === 'KeyV' && !e.repeat) {
        handleOpenVisualManual();
        return;
      }

      if (e.code === 'Digit2' && !e.repeat && (world.phase === 'playing' || world.phase === 'title')) {
        e.preventDefault();
        handleToggleCoop();
        return;
      }

      if (e.code === 'KeyC' && !e.repeat && world.phase === 'playing') {
        swapJustPressedRef.current = true;
        return;
      }

      if (world.phase === 'playing' && world.coopEnabled) {
        if (e.code === 'Enter') {
          e.preventDefault();
          if (!keysHeldRef.current.has('Enter')) {
            p2FireJustPressedRef.current = true;
          }
          keysHeldRef.current.add('Enter');
          return;
        }
        if (e.code === 'ShiftRight') {
          if (!keysHeldRef.current.has('ShiftRight')) {
            p2FireJustPressedRef.current = true;
          }
          keysHeldRef.current.add('ShiftRight');
          return;
        }
        if ((e.code === 'ShiftLeft' || e.code === 'KeyX') && !e.repeat) {
          dashJustPressedRef.current = true;
          return;
        }
      } else if (
        (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX') &&
        !e.repeat &&
        world.phase === 'playing'
      ) {
        dashJustPressedRef.current = true;
        return;
      }

      if (e.code === 'Space' && !keysHeldRef.current.has('Space')) {
        fireJustPressedRef.current = true;
      }
      keysHeldRef.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const onBlurOrHidden = () => {
      clearInputs();
    };

    const onVisibility = () => {
      if (document.hidden) {
        clearInputs();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlurOrHidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlurOrHidden);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [
    clearInputs,
    handleAcceptRadoPoke,
    handleCloseSecretRoom,
    handleCloseTapeKit,
    handleCloseVisualManual,
    handleDeclineRadoPoke,
    handleOpenSecretRoom,
    handleOpenTapeKit,
    handleOpenVisualManual,
    handleRestart,
    handleStart,
    handleToggleChipMode,
    handleToggleCoop,
    handleToggleMute,
    handleTogglePause,
    syncHudNow,
  ]);

  const overlayOpen = tapeKitOpen || visualManualOpen || secretRoomOpen;

  // Drive Melodik AY-3-8912 / 1-bit Beeper background music across stages
  useEffect(() => {
    if (hud.phase === 'playing' && !overlayOpen && !introVisible && !muted) {
      if (hud.phase === 'title' || hud.phase === 'handover' || hud.phase === 'victory') {
        didaktikAudio.startMusic(selectTitleTrack());
      } else {
        didaktikAudio.startMusic(selectTrackForStage(hud.stageIndex, hud.bossActive));
      }
    } else if (!tapeKitOpen) {
      didaktikAudio.stopMusic();
    }
  }, [hud.phase, hud.stageIndex, hud.bossActive, overlayOpen, introVisible, muted, tapeKitOpen]);

  useEffect(() => {
    return () => {
      didaktikAudio.stopMusic();
      didaktikAudio.stopCassetteSignal();
    };
  }, []);

  useEffect(() => {
    if (overlayOpen) {
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();
    let lastHudKey = '';

    const frame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      const world = worldRef.current;
      const canvas = canvasRef.current;

      if (world && canvas) {
        const isModalBlocking =
          modalBlockingRef.current ||
          world.phase === 'paused' ||
          world.phase === 'gameover' ||
          world.phase === 'victory';

        if (!isModalBlocking) {
          const held = keysHeldRef.current;
          const input: InputState = world.coopEnabled
            ? {
                up: held.has('KeyW'),
                down: held.has('KeyS'),
                left: held.has('KeyA'),
                right: held.has('KeyD'),
                fireJustPressed: fireJustPressedRef.current,
                fireHeld: held.has('Space'),
                dashJustPressed: dashJustPressedRef.current,
                swapHeroJustPressed: swapJustPressedRef.current,
                p2: {
                  up: held.has('ArrowUp'),
                  down: held.has('ArrowDown'),
                  left: held.has('ArrowLeft'),
                  right: held.has('ArrowRight'),
                  fireJustPressed:
                    p2FireJustPressedRef.current || held.has('Enter') || held.has('ShiftRight'),
                },
              }
            : {
                up: held.has('ArrowUp') || held.has('KeyW'),
                down: held.has('ArrowDown') || held.has('KeyS'),
                left: held.has('ArrowLeft') || held.has('KeyA'),
                right: held.has('ArrowRight') || held.has('KeyD'),
                fireJustPressed: fireJustPressedRef.current,
                fireHeld: held.has('Space'),
                dashJustPressed: dashJustPressedRef.current,
                swapHeroJustPressed: swapJustPressedRef.current,
              };

          fireJustPressedRef.current = false;
          p2FireJustPressedRef.current = false;
          dashJustPressedRef.current = false;
          swapJustPressedRef.current = false;

          stepWorld(world, rawDt, input);

          const events = drainAudioQueue(world);
          if (events.length > 0) {
            didaktikAudio.playEvents(events);
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderDidaktikFrame(ctx, world, crtEnabledRef.current, radoPixelCanvasRef.current);
          }

          const targetsDone = world.targets.reduce((acc, t) => acc + (t.restored ? 1 : 0), 0);
          const dashReadyFlag = world.player.dashCooldown <= 0.01 ? 1 : 0;
          const bossKey = world.boss ? `${world.boss.phase}:${world.boss.hp}` : '0';
          const hudKey = `${world.phase}|${world.stageIndex}|${world.player.hp}|${world.player.maxHp}|${world.score}|${world.combo}|${targetsDone}|${world.enemiesDefeated}|${world.player.activeHero}|${dashReadyFlag}|${world.stageRelic.collected ? 1 : 0}|${bossKey}|${world.plaqueCarried ? 1 : 0}|${world.radoPokeMode ? 1 : 0}|${world.pokePromptVisible ? 1 : 0}|${world.coopEnabled ? 1 : 0}`;
          if (hudKey !== lastHudKey) {
            lastHudKey = hudKey;
            document.body.dataset.state = toBodyDatasetState(world.phase);
            if (world.bestScore > readStoredBestScore()) {
              writeStoredBestScore(world.bestScore);
            }
            persistWorldProgress(world);
            setHud(getHudSnapshot(world));
          }
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [overlayOpen, persistWorldProgress]);

  const showPlayingHud = hud.phase !== 'title';

  return (
    <main className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#0d0f14] select-none">
      {/* Subtle Didaktik M chassis ambient bezel framing the 1:1 square-pixel T34VG1 CRT */}
      <div
        className={`no-print relative flex h-full w-full items-center justify-center ${
          showPlayingHud ? 'p-2 pt-14 pb-3 sm:p-4 sm:pt-16' : 'p-3 sm:p-5'
        }`}
      >
        <div
          className="relative flex items-center justify-center rounded-sm border-2 border-[#393d47] bg-[#181b23] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.85)]"
          style={{
            aspectRatio: `${LOGICAL_W} / ${LOGICAL_H}`,
            height: showPlayingHud
              ? 'min(calc(100vh - 5.25rem), calc((100vw - 1.5rem) * 216 / 280))'
              : 'min(calc(100vh - 2.5rem), calc((100vw - 2rem) * 216 / 280))',
            maxWidth: 'calc(100vw - 1.5rem)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={LOGICAL_W}
            height={LOGICAL_H}
            tabIndex={0}
            data-testid="didaktik-canvas"
            aria-label="Retro obrazovka Didaktik M 256 krát 192"
            className="pixel-canvas h-full w-full outline-none"
          />
        </div>
      </div>

      {/* Skippable Authentic Didaktik M Cassette Loading Screen Intro */}
      {introVisible && (
        <div className="no-print">
          <CassetteIntroOverlay
            radoPhotoUrl={activeRadoPhotoUrl}
            onFinish={() => setIntroVisible(false)}
          />
        </div>
      )}

      {/* Title Screen Overlay */}
      {hud.phase === 'title' && !introVisible && (
        <div className="no-print">
          <TitleOverlay
            bestScore={hud.bestScore}
            coopEnabled={hud.coopEnabled}
            radoPhotoUrl={activeRadoPhotoUrl}
            onStart={handleStart}
            onToggleCoop={handleToggleCoop}
            onOpenVisualManual={handleOpenVisualManual}
            onOpenTapeKit={handleOpenTapeKit}
            onOpenSecretRoom={handleOpenSecretRoom}
          />
        </div>
      )}

      {/* Active Gameplay HUD */}
      {showPlayingHud && (
        <div className="no-print">
          <GameHud
            hud={hud}
            muted={muted}
            chipMode={chipMode}
            crtEnabled={crtEnabled}
            onToggleMute={handleToggleMute}
            onToggleChipMode={handleToggleChipMode}
            onToggleCoop={handleToggleCoop}
            onToggleCrt={handleToggleCrt}
            onTogglePause={handleTogglePause}
            onRestart={handleRestart}
            onSwapHero={handleSwapHero}
            onOpenVisualManual={handleOpenVisualManual}
            onOpenTapeKit={handleOpenTapeKit}
            onVirtualInput={handleVirtualInput}
          />
        </div>
      )}

      {/* Pause / Victory / Game Over Modal */}
      <div className="no-print">
        <StatusModal
          hud={hud}
          radoPhotoUrl={activeRadoPhotoUrl}
          onResume={handleTogglePause}
          onContinueCheckpoint={handleContinueCheckpoint}
          onAcceptRadoPoke={handleAcceptRadoPoke}
          onDeclineRadoPoke={handleDeclineRadoPoke}
          onRestart={handleRestart}
          onReturnTitle={handleReturnTitle}
          onOpenVisualManual={handleOpenVisualManual}
          onOpenTapeKit={handleOpenTapeKit}
        />
      </div>

      {/* Native Didaktik M Cassette Tape Studio & Hardware Reference Modal */}
      <div className="no-print">
        <TapeKitModal
          open={tapeKitOpen}
          initialTab={kitInitialTab}
          config={tapeConfig}
          udgPack={udgPack}
          radoPhotoUrl={activeRadoPhotoUrl}
          extraDeluxeBasicLines={formatSignaturesAsBasicData(CITIZEN_SIGNATURES)}
          onConfigChange={setTapeConfig}
          onUdgPackChange={setUdgPack}
          onClose={handleCloseTapeKit}
        />
      </div>

      {/* Secret Room 1270 (Towdie / Dizzy homage, unlocked by 8-char code on plaque/card) */}
      <div className="no-print">
        <SecretRoomModal
          open={secretRoomOpen}
          radoPhotoUrl={activeRadoPhotoUrl}
          onClose={handleCloseSecretRoom}
        />
      </div>

      {/* Complete Techno-Futurism Visual Manual & Printable MVP Plaque Modal */}
      <VisualManualModal
        open={visualManualOpen}
        radoPhotoUrl={activeRadoPhotoUrl}
        isCustomPhoto={Boolean(customRadoPhoto)}
        onUploadRadoPhoto={handleUploadRadoPhoto}
        onResetRadoPhoto={handleResetRadoPhoto}
        onOpenTapeKit={handleOpenTapeKit}
        onStartGame={handleStart}
        onClose={handleCloseVisualManual}
      />
    </main>
  );
}
