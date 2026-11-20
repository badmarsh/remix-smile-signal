import React from 'react';
import { SPRITE_SIGNALIK_A, SPRITE_ZUBOK_A } from '../game/sprites';
import { AudioChipMode, HudSnapshot } from '../game/types';
import { PixelSpriteIcon, RimavskaSobotaCrest } from './BrandEmblems';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  chipMode: AudioChipMode;
  crtEnabled: boolean;
  onToggleMute: () => void;
  onToggleChipMode: () => void;
  onToggleCoop: () => void;
  onToggleCrt: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onSwapHero: () => void;
  onOpenVisualManual: () => void;
  onOpenTapeKit: () => void;
  onVirtualInput: (
    control: 'up' | 'down' | 'left' | 'right' | 'fire' | 'dash' | 'swap',
    pressed: boolean
  ) => void;
}

const VitalityPip: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path
      d="M12 21L3.8 13.2C1.7 11.1 1.7 7.6 3.8 5.5C5.8 3.5 9.1 3.5 11.2 5.5L12 6.3L12.8 5.5C14.9 3.5 18.2 3.5 20.2 5.5C22.3 7.6 22.3 11.1 20.2 13.2L12 21Z"
      fill={filled ? '#FF1E1E' : '#181B22'}
      stroke="#000000"
      strokeWidth="2"
    />
    {filled ? (
      <>
        <path d="M6.5 7.5L9 7.5L9 10L6.5 10Z" fill="#FFEE00" />
        <path d="M12 18.2L5.8 12.1" stroke="#C80000" strokeWidth="1.5" />
      </>
    ) : (
      <path
        d="M12 17.5L6.2 11.8C5 10.6 5 8.6 6.2 7.4C7.3 6.3 9.2 6.3 10.3 7.4L12 9.1L13.7 7.4C14.8 6.3 16.7 6.3 17.8 7.4C19 8.6 19 10.6 17.8 11.8L12 17.5Z"
        fill="none"
        stroke="#4b5263"
        strokeWidth="1.5"
      />
    )}
  </svg>
);

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  chipMode,
  crtEnabled,
  onToggleMute,
  onToggleChipMode,
  onToggleCoop,
  onToggleCrt,
  onTogglePause,
  onRestart,
  onSwapHero,
  onOpenVisualManual,
  onOpenTapeKit,
  onVirtualInput,
}) => {
  const actAccent =
    hud.companyAct === 'microdent'
      ? 'text-[#00e8e8]'
      : hud.companyAct === 'teatro'
        ? 'text-[#ffee00]'
        : 'text-[#e5b94c]';

  const targetNoun =
    hud.companyAct === 'microdent'
      ? 'ZÚBKY'
      : hud.companyAct === 'teatro'
        ? 'UZLY'
        : 'PLAKETA';

  const isZubok = hud.activeHero === 'zubok';

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-4">
      {/* Top Perimeter HUD Bar */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Erb RS + Vitality Pips + Rimavská Sobota Stage/Location */}
        <div className="flex items-center gap-2.5">
          <RimavskaSobotaCrest size={26} className="hidden sm:block" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1"
                aria-label={`Životy ${hud.hp} z ${hud.maxHp}`}
              >
                {Array.from({ length: hud.maxHp }).map((_, idx) => (
                  <VitalityPip key={idx} filled={idx < hud.hp} />
                ))}
              </div>
              {hud.radoPokeMode && (
                <span className="rounded-sm border border-[#ffee00]/80 bg-[#1c1a0c]/95 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#ffee00]">
                  POKE: RADO
                </span>
              )}
              <span className={`font-mono text-xs font-bold tracking-wider uppercase hud-text-stroke ${actAccent}`}>
                {hud.companyTag}
              </span>
            </div>
            <div className="font-mono text-[11px] text-[#cfd7e3] hud-text-stroke">
              Kolo {hud.stageIndex + 1}/{hud.totalStages} · {hud.stageTitle}
            </div>
          </div>
        </div>

        {/* Top-Center: Active Hero Switcher (Zúbok / Signálik) + Targets + Saboteur Dash + Relic */}
        <div className="hidden items-center gap-5 md:flex">
          <button
            type="button"
            tabIndex={-1}
            aria-label={
              hud.coopEnabled
                ? 'Aktívny režim 2P Co-op (H1 Zúbok a H2 Signálik)'
                : 'Prepnúť hrdinu medzi Zúbkom a Signálikom (C)'
            }
            title={
              hud.coopEnabled
                ? '2P Co-op: H1 Zúbok (WASD+Medzerník) · H2 Signálik (Šípky+Enter)'
                : 'Prepnúť hrdinu [C]: Zúbok (Laser) / Signálik (Bublina)'
            }
            onClick={(e) => {
              e.currentTarget.blur();
              if (hud.coopEnabled) {
                onToggleCoop();
              } else {
                onSwapHero();
              }
            }}
            className={`pointer-events-auto flex cursor-pointer items-center gap-2 rounded-sm border px-2.5 py-1 transition-colors ${
              hud.coopEnabled
                ? 'border-[#ffee00]/80 bg-[#1a180d]/95 text-white hover:border-[#ffee00]'
                : isZubok
                  ? 'border-[#ff1e1e]/70 bg-[#1c1015]/95 text-white hover:border-[#ff1e1e]'
                  : 'border-[#00e8e8]/70 bg-[#0d1c24]/95 text-white hover:border-[#00e8e8]'
            }`}
          >
            {hud.coopEnabled ? (
              <div className="flex items-center gap-1">
                <PixelSpriteIcon sprite={SPRITE_ZUBOK_A} size={20} />
                <PixelSpriteIcon sprite={SPRITE_SIGNALIK_A} size={20} />
              </div>
            ) : (
              <PixelSpriteIcon
                sprite={isZubok ? SPRITE_ZUBOK_A : SPRITE_SIGNALIK_A}
                size={22}
              />
            )}
            <div className="text-left leading-tight">
              <div className="font-mono text-[11px] font-bold whitespace-nowrap">
                {hud.coopEnabled ? '2P CO-OP [2]' : isZubok ? 'Zúbok [C]' : 'Signálik [C]'}
              </div>
              <div className="font-mono text-[9px] text-[#9aa5b8] whitespace-nowrap">
                {hud.coopEnabled
                  ? 'H1 WASD · H2 Šípky'
                  : isZubok
                    ? 'CEREC laser'
                    : 'Wi-Fi bublina'}
              </div>
            </div>
          </button>

          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] font-semibold tracking-widest text-[#9ea3ae] uppercase hud-text-stroke">
              {targetNoun}
            </span>
            <span className="font-display text-2xl font-bold leading-none text-[#ffffff] tabular-nums hud-text-stroke">
              {hud.targetsDone}/{hud.targetsTotal}
            </span>
          </div>

          <div className="flex flex-col items-start font-mono text-[10px] hud-text-stroke">
            <span className={hud.dashReady ? 'font-bold text-[#1ae62a]' : 'text-[#9ea3ae]'}>
              Úhyb [Shift]: {hud.dashReady ? 'PRIPRAVENÝ' : 'NABÍJA...'}
            </span>
            {hud.plaqueCarried ? (
              <span className="font-bold text-[#ffee00]">
                Plaketa MVP: ODNES NA PÓDIUM!
              </span>
            ) : hud.bossActive ? (
              <span className="font-bold text-[#ff1e1e]">
                Veľký Rušič · Fáza {hud.bossPhase}/3
              </span>
            ) : (
              <span className={hud.stageRelicCollected ? 'font-bold text-[#e5b94c]' : 'text-[#cfd7e3]'}>
                Artefakt: {hud.stageRelicCollected ? 'ZÍSKANÝ' : hud.stageRelicName}
              </span>
            )}
          </div>
        </div>

        {/* Top-Right: Score + Melodik AY / Beeper + Utility Controls */}
        <div className="flex items-start gap-2.5">
          <div className="text-right">
            <div className="font-mono text-[10px] font-semibold tracking-widest text-[#9ea3ae] uppercase hud-text-stroke">
              Skóre{hud.combo > 1 ? ` · ×${hud.combo}` : ''}
            </div>
            <div
              className="font-display text-2xl font-bold leading-none text-[#ffee00] tabular-nums hud-text-stroke sm:text-[26px]"
              aria-label={`Skóre ${Math.round(hud.score)}`}
            >
              {Math.round(hud.score).toString().padStart(5, '0')}
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Prepnúť režim hráčov (2), aktuálne ${hud.coopEnabled ? '2P Co-op' : '1P sólo'}`}
              title="Režim hráčov [2]: 1P sólo alebo 2P Co-op (WASD + Šípky)"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleCoop();
              }}
              className={`hidden h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-sm border px-2 font-mono text-[10px] font-bold transition-colors sm:flex ${
                hud.coopEnabled
                  ? 'border-[#ffee00]/80 bg-[#1e1b0d]/90 text-[#ffee00] hover:border-[#ffee00]'
                  : 'border-[#525660] bg-[#14171f]/90 text-[#cfd7e3] hover:border-[#00e8e8] hover:text-[#00e8e8]'
              }`}
            >
              {hud.coopEnabled ? '2P CO-OP' : '1P'}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={`Prepnúť zvukový čip (H), aktuálne ${chipMode === 'melodik' ? 'Melodik AY' : 'Beeper 1-bit'}`}
              title="Zvukový čip [H]: Didaktik Melodik AY-3-8912 / 1-bit Beeper"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleChipMode();
              }}
              className={`hidden h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-sm border px-2 font-mono text-[10px] font-bold transition-colors sm:flex ${
                chipMode === 'melodik'
                  ? 'border-[#1ae62a]/70 bg-[#101f15]/90 text-[#1ae62a] hover:border-[#1ae62a]'
                  : 'border-[#525660] bg-[#14171f]/90 text-[#cfd7e3] hover:border-[#ffee00] hover:text-[#ffee00]'
              }`}
            >
              {chipMode === 'melodik' ? 'MELODIK AY' : 'BEEPER 1B'}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Otvoriť vizuálny manuál a plaketu (V)"
              title="Vizuálny manuál [V]"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenVisualManual();
              }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-[#e5b94c]/70 bg-[#14171f]/90 text-[#e5b94c] transition-colors hover:border-[#e5b94c] hover:bg-[#e5b94c] hover:text-[#070a10]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Otvoriť kazetové a Didaktik štúdio (T)"
              title="Kazeta & Didaktik sada [T]"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenTapeKit();
              }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-[#525660] bg-[#14171f]/90 text-[#ebe9e3] transition-colors hover:border-[#00e8e8] hover:text-[#00e8e8]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="1.5" />
                <circle cx="8" cy="12" r="2.2" />
                <circle cx="16" cy="12" r="2.2" />
                <line x1="8" y1="14.2" x2="16" y2="14.2" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={crtEnabled ? 'Vypnúť CRT riadky' : 'Zapnúť CRT riadky'}
              title="Prepnúť CRT riadky"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleCrt();
              }}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border bg-[#14171f]/90 transition-colors ${
                crtEnabled
                  ? 'border-[#00e8e8] text-[#00e8e8]'
                  : 'border-[#525660] text-[#9ea3ae] hover:border-[#ebe9e3] hover:text-[#ebe9e3]'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="13" rx="1.5" />
                <line x1="8" y1="20" x2="16" y2="20" />
                <line x1="12" y1="17" x2="12" y2="20" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Zapnúť zvuk (M)' : 'Stlmiť zvuk (M)'}
              title="Zvuk [M]"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border bg-[#14171f]/90 transition-colors ${
                muted
                  ? 'border-[#ff1e1e] text-[#ff1e1e]'
                  : 'border-[#525660] text-[#ebe9e3] hover:border-[#ffee00] hover:text-[#ffee00]'
              }`}
            >
              {muted ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M19 5a10 10 0 0 1 0 14" />
                </svg>
              )}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pozastaviť hru (P)"
              title="Pauza [P]"
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-[#525660] bg-[#14171f]/90 text-[#ebe9e3] transition-colors hover:border-[#ffee00] hover:text-[#ffee00]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Reštartovať hru (R)"
              title="Reštart [R]"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-[#525660] bg-[#14171f]/90 text-[#ebe9e3] transition-colors hover:border-[#ffee00] hover:text-[#ffee00]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <polyline points="3 3 3 8 8 8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom mobile touch controls (visible only on small screens) */}
      <div className="pointer-events-auto flex items-end justify-between pb-1 sm:hidden">
        <div className="grid grid-cols-3 gap-1.5">
          <div />
          <button
            type="button"
            aria-label="Pohyb hore"
            onPointerDown={() => onVirtualInput('up', true)}
            onPointerUp={() => onVirtualInput('up', false)}
            onPointerLeave={() => onVirtualInput('up', false)}
            className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#6e727c] bg-[#1b1f29]/90 font-mono text-base font-bold text-white active:bg-[#00c8c8] active:text-black"
          >
            ↑
          </button>
          <div />
          <button
            type="button"
            aria-label="Pohyb doľava"
            onPointerDown={() => onVirtualInput('left', true)}
            onPointerUp={() => onVirtualInput('left', false)}
            onPointerLeave={() => onVirtualInput('left', false)}
            className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#6e727c] bg-[#1b1f29]/90 font-mono text-base font-bold text-white active:bg-[#00c8c8] active:text-black"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Pohyb dole"
            onPointerDown={() => onVirtualInput('down', true)}
            onPointerUp={() => onVirtualInput('down', false)}
            onPointerLeave={() => onVirtualInput('down', false)}
            className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#6e727c] bg-[#1b1f29]/90 font-mono text-base font-bold text-white active:bg-[#00c8c8] active:text-black"
          >
            ↓
          </button>
          <button
            type="button"
            aria-label="Pohyb doprava"
            onPointerDown={() => onVirtualInput('right', true)}
            onPointerUp={() => onVirtualInput('right', false)}
            onPointerLeave={() => onVirtualInput('right', false)}
            className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#6e727c] bg-[#1b1f29]/90 font-mono text-base font-bold text-white active:bg-[#00c8c8] active:text-black"
          >
            →
          </button>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label="Prepnúť hrdinu"
              onClick={() => onSwapHero()}
              className="flex h-10 items-center justify-center rounded-sm border border-[#e5b94c] bg-[#1b1710]/90 px-2.5 font-mono text-[11px] font-bold text-[#e5b94c]"
            >
              {isZubok ? 'ZÚBOK' : 'SIGNÁLIK'}
            </button>
            <button
              type="button"
              aria-label="Saboteur úhyb"
              onPointerDown={() => onVirtualInput('dash', true)}
              onPointerUp={() => onVirtualInput('dash', false)}
              className="flex h-10 items-center justify-center rounded-sm border border-[#1ae62a] bg-[#0f1f14]/90 px-2.5 font-mono text-[11px] font-bold text-[#1ae62a]"
            >
              ÚHYB
            </button>
          </div>
          <button
            type="button"
            aria-label="Vystreliť laser alebo signál"
            onPointerDown={() => onVirtualInput('fire', true)}
            onPointerUp={() => onVirtualInput('fire', false)}
            onPointerLeave={() => onVirtualInput('fire', false)}
            className="flex h-12 w-24 items-center justify-center rounded-sm border-2 border-[#00e8e8] bg-[#00c8c8]/90 font-display text-sm font-bold text-[#070a10] active:scale-95"
          >
            {isZubok ? 'LASER' : 'VLNA'}
          </button>
        </div>
      </div>
    </div>
  );
};
