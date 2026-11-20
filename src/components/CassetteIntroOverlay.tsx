import React, { useEffect, useRef, useState } from 'react';
import {
  CASSETTE_INTRO_DURATION_SEC,
  computeCassetteIntroState,
  ZX_SCREEN_H,
  ZX_SCREEN_W,
} from '../didaktik/zxScreen';
import {
  buildLoadingScreenBytesFromImage,
  paintZxScreenToCanvas,
} from '../didaktik/zxScreenCompose';

interface CassetteIntroOverlayProps {
  radoPhotoUrl: string;
  onFinish: () => void;
}

/**
 * Authentic Didaktik M cassette loading sequence before the web title screen:
 * - Red/cyan pilot tone border stripes -> blue/yellow data border stripes
 * - 256x192 ZX Spectrum SCREEN$ loading artwork revealed in 3 thirds (0..63, 64..127, 128..191)
 * - Immediately skippable with any key or pointer click.
 */
export const CassetteIntroOverlay: React.FC<CassetteIntroOverlayProps> = ({
  radoPhotoUrl,
  onFinish,
}) => {
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenBytesRef = useRef<Uint8Array | null>(null);
  const finishedRef = useRef(false);
  const [introState, setIntroState] = useState(() => computeCassetteIntroState(0));

  // Compose 6912-byte SCREEN$ from Rado's portrait
  useEffect(() => {
    let cancelled = false;
    screenBytesRef.current = buildLoadingScreenBytesFromImage(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      screenBytesRef.current = buildLoadingScreenBytesFromImage(img);
    };
    img.src = radoPhotoUrl;

    return () => {
      cancelled = true;
    };
  }, [radoPhotoUrl]);

  // Animate loading stripes & 3-third SCREEN$ reveal
  useEffect(() => {
    let rafId = 0;
    const startMs = performance.now();

    const finishOnce = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      finishOnce();
    };
    window.addEventListener('keydown', onKeyDown);

    const tick = (now: number) => {
      const elapsedSec = (now - startMs) / 1000;
      const st = computeCassetteIntroState(elapsedSec);
      setIntroState(st);

      const canvas = screenCanvasRef.current;
      const bytes = screenBytesRef.current;
      if (canvas && bytes) {
        paintZxScreenToCanvas(canvas, bytes, st.revealedLines);
      }

      if (elapsedSec >= CASSETTE_INTRO_DURATION_SEC || st.phase === 'done') {
        finishOnce();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onFinish]);

  const borderPatternClass =
    introState.stripeMode === 'red_cyan'
      ? 'bg-[repeating-linear-gradient(0deg,#c80000_0px,#c80000_10px,#00c8c8_10px,#00c8c8_20px)]'
      : introState.stripeMode === 'blue_yellow'
        ? 'bg-[repeating-linear-gradient(0deg,#0022ff_0px,#0022ff_4px,#ffee00_4px,#ffee00_8px)]'
        : 'bg-[#000000]';

  return (
    <div
      role="dialog"
      aria-label="Nahrávanie kazety Didaktik M"
      onClick={() => {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish();
        }
      }}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-[#06080d] p-4 select-none"
    >
      <div
        className={`relative flex w-full max-w-2xl flex-col items-center justify-center rounded-sm border-2 border-[#393d47] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.92)] transition-colors sm:p-7 ${borderPatternClass}`}
      >
        <div className="relative w-full bg-[#000000] p-1">
          <canvas
            ref={screenCanvasRef}
            width={ZX_SCREEN_W}
            height={ZX_SCREEN_H}
            className="pixel-canvas aspect-[4/3] w-full bg-[#000000]"
          />
          {introState.revealedLines === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-start p-4 font-mono text-xs text-[#c8c8c8] sm:text-sm">
              <div>© 1990 Didaktik Skalica · 48K</div>
              <div className="mt-2 text-[#ffee00]">LOAD &quot;&quot;</div>
              {introState.phase === 'header' && (
                <div className="mt-3 space-y-1 text-[#00e8e8]">
                  <div>Program: ZUBOK&amp;SIG</div>
                  <div>Bytes: ZUBOK</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex w-full max-w-2xl items-center justify-between gap-3 font-mono text-xs text-[#c9c6be]">
        <span className="truncate text-[#00e8e8]">{introState.statusLine}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!finishedRef.current) {
              finishedRef.current = true;
              onFinish();
            }
          }}
          className="min-h-[34px] shrink-0 cursor-pointer rounded-sm border border-[#525660] bg-[#13161e] px-3 py-1 font-mono text-xs font-semibold text-[#ffee00] hover:border-[#ffee00]"
        >
          Preskočiť [Ľubovoľná klávesa]
        </button>
      </div>
    </div>
  );
};
