import React from 'react';
import { HudSnapshot } from '../game/types';
import {
  MicrodentLogo,
  RadoPortraitFrame,
  RimavskaSobotaCrest,
  TeatroLogo,
} from './BrandEmblems';

interface StatusModalProps {
  hud: HudSnapshot;
  radoPhotoUrl: string;
  onResume: () => void;
  onContinueCheckpoint: () => void;
  onAcceptRadoPoke: () => void;
  onDeclineRadoPoke: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenVisualManual: () => void;
  onOpenTapeKit: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  hud,
  radoPhotoUrl,
  onResume,
  onContinueCheckpoint,
  onAcceptRadoPoke,
  onDeclineRadoPoke,
  onRestart,
  onReturnTitle,
  onOpenVisualManual,
  onOpenTapeKit,
}) => {
  if (hud.phase !== 'paused' && hud.phase !== 'victory' && hud.phase !== 'gameover') {
    return null;
  }

  const isPaused = hud.phase === 'paused';
  const isVictory = hud.phase === 'victory';

  const heading = isPaused
    ? 'Hra pozastavená'
    : isVictory
      ? 'Plaketa MVP doručená!'
      : 'Signál stratený';

  const subline = isPaused
    ? `${hud.stageTitle} · ${hud.companyTag}`
    : isVictory
      ? '1. miesto · Celoživotný MVP v regióne — Rado Ceglédy'
      : `Dosiahnuté kolo ${hud.stageIndex + 1} z ${hud.totalStages} · ${hud.stageTitle}`;

  const accentBorder = isVictory
    ? 'border-[#e5b94c]'
    : isPaused
      ? 'border-[#00e8e8]'
      : 'border-[#ff1e1e]';

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = Math.round(sec % 60);
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#06080d]/84 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
    >
      <div
        className={`w-full ${isVictory ? 'max-w-lg' : 'max-w-md'} rounded-sm border-2 ${accentBorder} bg-[#12161f] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.88)]`}
      >
        {/* Sinclair accent bar */}
        <div className="mb-4 flex h-1 w-full overflow-hidden">
          <div className="flex-1 bg-[#ff1e1e]" />
          <div className="flex-1 bg-[#ffee00]" />
          <div className="flex-1 bg-[#1ae62a]" />
          <div className="flex-1 bg-[#00e8e8]" />
        </div>

        {/* Victory Ceremonial Header with Rado Portrait & Erb RS */}
        {isVictory && (
          <div className="mb-4 flex items-center gap-4 rounded-sm border border-[#e5b94c]/50 bg-[#0b0f18] p-3.5">
            <RadoPortraitFrame src={radoPhotoUrl} sizeClass="h-16 w-16 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] font-bold text-[#e5b94c]">
                1. MIESTO · CELOŽIVOTNÝ MVP REGIÓNU
              </div>
              <div className="font-display text-xl font-bold text-white">Rado Ceglédy</div>
              <div className="mt-0.5 text-xs text-[#b2bccd]">
                Prejav úcty a vďaky od skupiny občanov regiónu Rimavská Sobota.
              </div>
            </div>
            <RimavskaSobotaCrest size={42} />
          </div>
        )}

        <h2
          id="status-modal-title"
          className="font-display text-3xl font-bold tracking-wide text-white"
        >
          {heading}
        </h2>
        <p className="mt-1 text-sm text-[#c9c6be]">{subline}</p>

        {/* Tabular-nums Mastery / Progress Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#2b303c] py-4">
          <div>
            <div className="font-mono text-[11px] text-[#9ea3ae] uppercase">Skóre</div>
            <div className="mt-0.5 font-display text-xl font-bold text-[#ffee00] tabular-nums">
              {Math.round(hud.score)}
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] text-[#9ea3ae] uppercase">Rekord</div>
            <div className="mt-0.5 font-display text-xl font-bold text-white tabular-nums">
              {Math.round(hud.bestScore)}
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] text-[#9ea3ae] uppercase">
              {isVictory ? 'Čas' : 'Kolo'}
            </div>
            <div className="mt-0.5 font-display text-xl font-bold text-[#00e8e8] tabular-nums">
              {isVictory ? formatTime(hud.elapsedSec) : `${hud.stageIndex + 1}/${hud.totalStages}`}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between font-mono text-xs text-[#9ea3ae] tabular-nums">
          <span>Ciele {hud.targetsDone}/{hud.targetsTotal}</span>
          <span>·</span>
          <span>Zneškodnení {hud.enemiesDefeated}</span>
          <span>·</span>
          <span>Zásahy {hud.damageTaken}</span>
        </div>

        {/* Controls reminder for paused / gameover screens */}
        <div className="mt-4 rounded-sm border border-[#2b303c] bg-[#0b0f18] p-3">
          <div className="font-mono text-[10px] font-bold text-[#00e8e8] uppercase tracking-wider mb-2">
            Ovládanie
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs text-[#c9c6be]">
            <div className="flex items-center gap-1">
              <span className="text-[#ffee00]">WASD / Šípky</span>
              <span>— pohyb</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#ffee00]">Medzerník</span>
              <span>— streľba</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#ffee00]">Shift</span>
              <span>— saboteúrsky úhyb</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#ffee00]">C</span>
              <span>— prepni hrdinu</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#ffee00]">Esc</span>
              <span>— pauza</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#ffee00]">[2]</span>
              <span>— 2P ko-op</span>
            </div>
          </div>
        </div>

        {isVictory && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#232938] pt-3.5">
            <MicrodentLogo compact />
            <TeatroLogo compact />
          </div>
        )}

        {/* Spectrum POKE 48621,5 Rado Mode Prompt (shown after 2nd defeat in the same stage) */}
        {hud.phase === 'gameover' && hud.pokePromptVisible && !hud.radoPokeMode && (
          <div className="mt-4 rounded-sm border-2 border-[#ffee00] bg-[#0b0e16] p-3.5">
            <div className="font-mono text-xs font-bold tracking-wide text-[#ffee00]">
              POKE 48621,5 – RADO REŽIM? A / N
            </div>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-[#cfd7e3]">
              Priateľský režim Didaktik M: +2 srdcia (spolu 5) a o 30 % pomalšie strely nepriateľov.
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onAcceptRadoPoke();
                }}
                className="min-h-[36px] flex-1 cursor-pointer rounded-sm border border-[#1ae62a] bg-[#1ae62a] px-3 py-1 font-mono text-xs font-bold text-[#070a10] hover:bg-[#3bf249]"
              >
                Áno [A] – Zapnúť a pokračovať
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onDeclineRadoPoke();
                }}
                className="min-h-[36px] cursor-pointer rounded-sm border border-[#525660] bg-[#1b202b] px-3 py-1 font-mono text-xs font-semibold text-[#cfd7e3] hover:border-white hover:text-white"
              >
                Nie [N]
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2.5">
          {isPaused ? (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onResume();
              }}
              className="min-h-[44px] w-full cursor-pointer whitespace-nowrap rounded-sm border-2 border-[#00e8e8] bg-[#00c8c8] px-4 py-2 font-display text-base font-bold text-[#070a10] hover:bg-[#00e8e8]"
            >
              Pokračovať v hre
            </button>
          ) : isVictory ? (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenVisualManual();
              }}
              className="min-h-[44px] w-full cursor-pointer whitespace-nowrap rounded-sm border-2 border-[#e5b94c] bg-[#e5b94c] px-4 py-2 font-display text-base font-bold text-[#070a10] hover:bg-[#f2ca63]"
            >
              Otvoriť plaketu a manuál
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onContinueCheckpoint();
              }}
              className="min-h-[44px] w-full cursor-pointer whitespace-nowrap rounded-sm border-2 border-[#00e8e8] bg-[#00c8c8] px-4 py-2 font-display text-base font-bold text-[#070a10] hover:bg-[#00e8e8]"
            >
              Pokračovať od kola {hud.checkpointStageIndex + 1} (-20 % skóre)
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {isPaused || isVictory ? (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRestart();
                }}
                className="min-h-[42px] cursor-pointer whitespace-nowrap rounded-sm border border-[#525660] bg-[#1e222d] px-3 py-2 font-mono text-xs font-semibold text-[#ebe9e3] hover:border-[#ffee00] hover:text-[#ffee00]"
              >
                {isVictory ? 'Hrať znova' : 'Reštartovať'}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRestart();
                }}
                className="min-h-[42px] cursor-pointer whitespace-nowrap rounded-sm border border-[#525660] bg-[#1e222d] px-3 py-2 font-mono text-xs font-semibold text-[#ebe9e3] hover:border-[#ffee00] hover:text-[#ffee00]"
              >
                Reštart od 1. kola [R]
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onReturnTitle();
              }}
              className="min-h-[42px] cursor-pointer whitespace-nowrap rounded-sm border border-[#525660] bg-[#1e222d] px-3 py-2 font-mono text-xs font-semibold text-[#ebe9e3] hover:border-white hover:text-white"
            >
              Úvodná obrazovka
            </button>
          </div>

          {hud.phase === 'gameover' && (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenTapeKit();
              }}
              className="min-h-[36px] w-full cursor-pointer whitespace-nowrap rounded-sm border border-[#3a404f] bg-[#141822] px-3 py-1.5 font-mono text-[11px] font-semibold text-[#b2bccd] hover:border-[#00e8e8] hover:text-[#00e8e8]"
            >
              Otvoriť kazetové štúdio [T]
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
