import React from 'react';
import { SPRITE_MVP_PLAQUE, SPRITE_SIGNALIK_A, SPRITE_ZUBOK_A } from '../game/sprites';
import {
  MicrodentLogo,
  PixelSpriteIcon,
  RadoPortraitFrame,
  RimavskaSobotaCrest,
  TeatroLogo,
} from './BrandEmblems';

interface TitleOverlayProps {
  bestScore: number;
  coopEnabled: boolean;
  radoPhotoUrl: string;
  onStart: () => void;
  onToggleCoop: () => void;
  onOpenVisualManual: () => void;
  onOpenTapeKit: () => void;
  onOpenSecretRoom: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  bestScore,
  coopEnabled,
  radoPhotoUrl,
  onStart,
  onToggleCoop,
  onOpenVisualManual,
  onOpenTapeKit,
  onOpenSecretRoom,
}) => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-between px-4 py-5 sm:py-7"
      aria-label="Úvodná obrazovka"
    >
      {/* Upper CRT negative-space lockup: Heraldry + Title + Heroes & Rado MVP Dedication + 3 Actions */}
      <div className="pointer-events-auto mt-5 flex w-full max-w-2xl flex-col items-center text-center sm:mt-8">
        {/* Heraldic & Corporate Identity Strip (microDENT.sk + Erb RS + TeatrO.eu) */}
        <div className="mb-2 flex flex-wrap items-center justify-center gap-4">
          <MicrodentLogo compact />
          <RimavskaSobotaCrest size={34} className="drop-shadow-[0_3px_0_rgba(0,0,0,0.85)]" />
          <TeatroLogo compact />
        </div>

        {/* Main SVG Retro-Futurist Wordmark */}
        <svg
          viewBox="0 0 560 96"
          className="h-auto w-full max-w-[520px] drop-shadow-[0_5px_0_rgba(0,0,0,0.88)]"
          role="img"
          aria-label="Zúbok a signálik — Didaktik M · Venované Radovi Ceglédymu"
        >
          <text
            x="280"
            y="48"
            textAnchor="middle"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="5"
            paintOrder="stroke fill"
            style={{
              fontFamily: '"Pixelify Sans", monospace',
              fontSize: '42px',
              fontWeight: 700,
              letterSpacing: '0.03em',
            }}
          >
            ZÚBOK A SIGNÁLIK
          </text>

          {/* Sinclair 4-stripe signature accent bar */}
          <rect x="128" y="60" width="76" height="4" fill="#FF1E1E" />
          <rect x="204" y="60" width="76" height="4" fill="#FFEE00" />
          <rect x="280" y="60" width="76" height="4" fill="#1AE62A" />
          <rect x="356" y="60" width="76" height="4" fill="#00E8E8" />

          <text
            x="280"
            y="84"
            textAnchor="middle"
            fill="#E5B94C"
            stroke="#000000"
            strokeWidth="3"
            paintOrder="stroke fill"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.07em',
            }}
          >
            DIDAKTIK M · RIMAVSKÁ SOBOTA · VENOVANÉ RADOVI CEGLÉDYMU
          </text>
        </svg>

        {/* Compact Dignified Rado MVP Dedication Plate flanked by Zúbok, Signálik & Golden-Star Plaque */}
        <div className="mt-1.5 flex items-center gap-3 rounded-sm border border-[#e5b94c]/55 bg-[#0b101b]/94 px-3.5 py-2 text-left shadow-[0_6px_20px_rgba(0,0,0,0.75)]">
          <RadoPortraitFrame src={radoPhotoUrl} sizeClass="h-11 w-11 shrink-0" />
          <div className="min-w-0">
            <div className="font-mono text-xs font-bold text-[#e5b94c]">
              Misia: Doručiť plaketu 1. miesto · Celoživotný MVP v regióne
            </div>
            <div className="font-mono text-[11px] text-[#cfd7e3]">
              Prejav úcty a vďaky od skupiny občanov regiónu Rimavská Sobota
            </div>
          </div>
          <div className="hidden items-center gap-1.5 border-l border-[#252e42] pl-3 sm:flex">
            <PixelSpriteIcon sprite={SPRITE_ZUBOK_A} size={26} label="Hrdina Zúbok" />
            <PixelSpriteIcon sprite={SPRITE_SIGNALIK_A} size={26} label="Hrdina Signálik" />
            <PixelSpriteIcon sprite={SPRITE_MVP_PLAQUE} size={22} label="Plaketa 1. miesto MVP" />
          </div>
        </div>

        {/* 3 Crisp Single-Line Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStart();
            }}
            className="min-h-[44px] cursor-pointer whitespace-nowrap rounded-sm border-2 border-[#00e8e8] bg-[#00c8c8] px-6 py-2.5 font-display text-base font-bold tracking-wider [word-spacing:0.2em] text-[#070a10] shadow-[0_4px_0_#005f66] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#00e8e8] active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffee00]"
          >
            Hrať hru
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenVisualManual();
            }}
            className="min-h-[44px] cursor-pointer whitespace-nowrap rounded-sm border border-[#e5b94c] bg-[#1b1710]/95 px-4 py-2.5 font-mono text-xs font-semibold text-[#e5b94c] shadow-[0_4px_0_#090b0f] transition-colors duration-150 hover:bg-[#e5b94c] hover:text-[#070a10] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5b94c]"
          >
            Vizuálny manuál
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenTapeKit();
            }}
            className="min-h-[44px] cursor-pointer whitespace-nowrap rounded-sm border border-[#7c7972] bg-[#1a1d24]/95 px-4 py-2.5 font-mono text-xs font-semibold text-[#ebe9e3] shadow-[0_4px_0_#090b0f] transition-colors duration-150 hover:border-[#00e8e8] hover:text-[#00e8e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00e8e8]"
          >
            Kazeta &amp; Didaktik
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSecretRoom();
            }}
            className="min-h-[44px] cursor-pointer whitespace-nowrap rounded-sm border border-[#4a5160] bg-[#121622]/95 px-3.5 py-2.5 font-mono text-xs font-semibold text-[#c9c6be] shadow-[0_4px_0_#090b0f] transition-colors duration-150 hover:border-[#e5b94c] hover:text-[#e5b94c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5b94c]"
          >
            Miestnosť 1270 [K]
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleCoop();
            }}
            aria-label={`Prepnúť herný režim (2), aktuálne ${coopEnabled ? '2P Co-op' : '1P sólo'}`}
            className={`cursor-pointer whitespace-nowrap rounded-sm border px-3 py-1 font-mono text-[11px] font-semibold transition-colors ${
              coopEnabled
                ? 'border-[#ffee00] bg-[#1e1a0c]/95 text-[#ffee00]'
                : 'border-[#4a5160] bg-[#0e121c]/90 text-[#cfd7e3] hover:border-[#00e8e8] hover:text-[#00e8e8]'
            }`}
          >
            {coopEnabled
              ? 'Režim: 2P CO-OP [2] · H1 WASD + H2 Šípky'
              : 'Režim: 1P Sólo [2] · Prepnúť na 2P Co-op'}
          </button>

          {bestScore > 0 && (
            <div className="font-mono text-xs text-[#ffee00] tabular-nums hud-text-stroke">
              Rekord {Math.round(bestScore)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom flat borderless control hint line */}
      <div className="pointer-events-none mb-0.5 text-center font-mono text-[11px] tracking-wide text-[#c9c6be] hud-text-stroke sm:text-xs">
        Šípky / WASD Pohyb · Medzerník Streľba · C Zúbok/Signálik · 2 Co-op · Shift Úhyb · H Melodik · V Manuál · T Kazeta · K 1270
      </div>
    </div>
  );
};
