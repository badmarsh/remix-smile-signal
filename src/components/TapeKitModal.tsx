import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BasicProgramConfig, generateSinclairBasicText } from '../didaktik/basicSource';
import { DIDAKTIK_SPECS, LOAD_STEPS, MG_DIN_PINOUT } from '../didaktik/specs';
import {
  buildDeluxeTapFile,
  buildTapFile,
  encodeTapeToWav,
  estimateTapeDurationSec,
  TapeClockProfile,
} from '../didaktik/tapeBuilder';
import { DidaktikUdgAsset } from '../didaktik/udgAssets';
import { ZX_SCREEN_H, ZX_SCREEN_W } from '../didaktik/zxScreen';
import {
  buildLoadingScreenBytesFromImage,
  paintZxScreenToCanvas,
} from '../didaktik/zxScreenCompose';
import { didaktikAudio } from '../game/audio';
import { ChiptuneSfxPanel, UdgPixelArtPanel } from './AssetStudioPanels';

export type KitTab = 'cassette' | 'udg' | 'sfx' | 'basic' | 'hardware';

interface TapeKitModalProps {
  open: boolean;
  initialTab: KitTab;
  config: BasicProgramConfig;
  udgPack: DidaktikUdgAsset[];
  radoPhotoUrl: string;
  extraDeluxeBasicLines?: string[];
  onConfigChange: (next: BasicProgramConfig) => void;
  onUdgPackChange: (next: DidaktikUdgAsset[]) => void;
  onClose: () => void;
}

function triggerDownload(bytes: Uint8Array | string, filename: string, mimeType: string): void {
  const blob =
    typeof bytes === 'string'
      ? new Blob([bytes], { type: mimeType })
      : new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const TapeKitModal: React.FC<TapeKitModalProps> = ({
  open,
  initialTab,
  config,
  udgPack,
  radoPhotoUrl,
  extraDeluxeBasicLines,
  onConfigChange,
  onUdgPackChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<KitTab>(initialTab);
  const [clockProfile, setClockProfile] = useState<TapeClockProfile>('zx35');
  const [isPlayingTape, setIsPlayingTape] = useState(false);
  const [playingMode, setPlayingMode] = useState<'deluxe' | 'backup'>('deluxe');
  const [tapeProgress, setTapeProgress] = useState(0);
  const [tapePhase, setTapePhase] = useState<'pilot' | 'data' | 'pause' | 'done'>('pause');
  const [copiedBasic, setCopiedBasic] = useState(false);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);
  const [screenBytes, setScreenBytes] = useState<Uint8Array>(() => new Uint8Array(6912));
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const effectiveConfig = useMemo<BasicProgramConfig>(
    () => ({
      ...config,
      udgBytes6: udgPack.slice(0, 6).map((u) => u.bytes),
    }),
    [config, udgPack]
  );

  // Build authentic 6912-byte SCREEN$ from Rado's portrait whenever modal opens or photo changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setScreenBytes(buildLoadingScreenBytesFromImage(null));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      setScreenBytes(buildLoadingScreenBytesFromImage(img));
    };
    img.src = radoPhotoUrl;

    return () => {
      cancelled = true;
    };
  }, [open, radoPhotoUrl]);

  // Paint SCREEN$ preview canvas whenever screenBytes or active tab changes
  useEffect(() => {
    if (!open || activeTab !== 'cassette') return;
    const canvas = previewCanvasRef.current;
    if (canvas && screenBytes.length === 6912) {
      paintZxScreenToCanvas(canvas, screenBytes, ZX_SCREEN_H);
    }
  }, [open, activeTab, screenBytes]);

  const builtTap = useMemo(
    () => (open ? buildTapFile(effectiveConfig, 'ZUBOK&SIG', 10) : null),
    [open, effectiveConfig]
  );
  const builtDeluxeTap = useMemo(
    () =>
      open && screenBytes.length === 6912
        ? buildDeluxeTapFile(effectiveConfig, screenBytes, extraDeluxeBasicLines)
        : null,
    [open, effectiveConfig, screenBytes, extraDeluxeBasicLines]
  );
  const basicSource = useMemo(
    () => (open ? generateSinclairBasicText(effectiveConfig) : ''),
    [open, effectiveConfig]
  );
  const estimatedDurationSec = useMemo(
    () => (builtTap ? estimateTapeDurationSec(builtTap.blocks, clockProfile) : 0),
    [builtTap, clockProfile]
  );
  const estimatedDeluxeDurationSec = useMemo(
    () => (builtDeluxeTap ? estimateTapeDurationSec(builtDeluxeTap.blocks, clockProfile) : 0),
    [builtDeluxeTap, clockProfile]
  );

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    } else {
      didaktikAudio.stopCassetteSignal();
      setIsPlayingTape(false);
      setTapeProgress(0);
    }
  }, [open, initialTab]);

  useEffect(() => {
    return () => {
      didaktikAudio.stopCassetteSignal();
    };
  }, []);

  if (!open || !builtTap) return null;

  const handleToggleTapeAudio = (mode: 'deluxe' | 'backup') => {
    if (isPlayingTape && playingMode === mode) {
      didaktikAudio.stopCassetteSignal();
      setIsPlayingTape(false);
      setTapeProgress(0);
      return;
    }

    didaktikAudio.stopCassetteSignal();
    const targetBlocks =
      mode === 'deluxe' && builtDeluxeTap ? builtDeluxeTap.blocks : builtTap.blocks;
    const wavResult = encodeTapeToWav(targetBlocks, clockProfile, 44100);
    setPlayingMode(mode);
    setIsPlayingTape(true);
    setTapeProgress(0);
    didaktikAudio.playCassetteSignal(
      wavResult.samplesFloat32,
      wavResult.sampleRate,
      (progress, phaseLabel) => {
        setTapeProgress(progress);
        setTapePhase(phaseLabel);
      },
      () => {
        setIsPlayingTape(false);
      }
    );
  };

  const handleDownloadDeluxeTap = () => {
    if (!builtDeluxeTap) return;
    triggerDownload(
      builtDeluxeTap.tapBytes,
      'zubok-a-signalik-deluxe-screen-didaktik-m.tap',
      'application/octet-stream'
    );
    setDownloadNote(
      `Stiahnutý Deluxe .TAP so SCREEN$ (${builtDeluxeTap.tapBytes.length} B, 6 blokov)`
    );
  };

  const handleDownloadDeluxeWav = () => {
    if (!builtDeluxeTap) return;
    const wavResult = encodeTapeToWav(builtDeluxeTap.blocks, clockProfile, 44100);
    triggerDownload(
      wavResult.wavBytes,
      `zubok-a-signalik-deluxe-screen-${clockProfile}.wav`,
      'audio/wav'
    );
    setDownloadNote(
      `Stiahnutá Deluxe kazeta .WAV so SCREEN$ (${wavResult.durationSec.toFixed(1)} s)`
    );
  };

  const handleDownloadTap = () => {
    triggerDownload(builtTap.tapBytes, 'zubok-a-signalik-didaktik-m.tap', 'application/octet-stream');
    setDownloadNote('Stiahnutý záložný jednoblokový obraz zubok-a-signalik-didaktik-m.tap');
  };

  const handleDownloadWav = () => {
    const wavResult = encodeTapeToWav(builtTap.blocks, clockProfile, 44100);
    triggerDownload(wavResult.wavBytes, `zubok-a-signalik-didaktik-m-${clockProfile}.wav`, 'audio/wav');
    setDownloadNote(`Stiahnutá záložná kazeta .WAV (${wavResult.durationSec.toFixed(1)} s)`);
  };

  const handleDownloadBas = () => {
    triggerDownload(basicSource, 'zubok-a-signalik-didaktik-m.bas', 'text/plain;charset=utf-8');
    setDownloadNote('Stiahnutý zdrojový kód Sinclair BASIC (.bas)');
  };

  const handleCopyBasic = async () => {
    try {
      await navigator.clipboard.writeText(basicSource);
      setCopiedBasic(true);
      setTimeout(() => setCopiedBasic(false), 1800);
    } catch {
      setCopiedBasic(false);
    }
  };

  const stripeClass =
    isPlayingTape && tapePhase === 'pilot'
      ? 'bg-[repeating-linear-gradient(0deg,#c80000_0px,#c80000_8px,#00c8c8_8px,#00c8c8_16px)]'
      : isPlayingTape && tapePhase === 'data'
        ? 'bg-[repeating-linear-gradient(0deg,#0022ff_0px,#0022ff_4px,#ffee00_4px,#ffee00_8px)]'
        : 'bg-[#1a1e28]';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#06080d]/88 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tape-kit-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-sm border border-[#4d525e] bg-[#13161e] shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[#2b303c] bg-[#191d27] px-5 py-4">
          <div>
            <h2
              id="tape-kit-title"
              className="font-display text-lg font-bold tracking-wide text-white sm:text-xl"
            >
              Didaktik M · Kazetová a hardvérová sada
            </h2>
            <p className="mt-0.5 text-xs text-[#b5b2a9]">
              Vytvorte skutočnú magnetickú kazetu Zúbok a signálik pre microDENT.sk a TeatrO.eu · Kompatibilné so Sinclair ZX Spectrum 48K ROM
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Zavrieť kazetovú sadu Didaktik M"
            className="flex h-10 min-w-[40px] cursor-pointer items-center justify-center whitespace-nowrap rounded-sm border border-[#525660] bg-[#13161e] px-3 font-mono text-xs font-semibold text-[#ebe9e3] hover:border-[#ffee00] hover:text-[#ffee00]"
          >
            Zavrieť
          </button>
        </div>

        {/* Segmented Tabs */}
        <div
          className="flex items-center gap-1 overflow-x-auto border-b border-[#2b303c] bg-[#10131a] px-5 py-2.5"
          role="tablist"
        >
          {(
            [
              { id: 'cassette', label: 'Export na kazetu' },
              { id: 'udg', label: 'Pixel Art (UDG)' },
              { id: 'sfx', label: '1-Bit Chiptune SFX' },
              { id: 'basic', label: 'Sinclair BASIC' },
              { id: 'hardware', label: 'Hardvér Didaktik M' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[38px] shrink-0 cursor-pointer whitespace-nowrap rounded-sm px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#262c3a] text-[#00e8e8]'
                  : 'text-[#9ea3ae] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === 'cassette' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Gift Personalization + Clock Profile */}
              <div className="flex flex-col gap-5 lg:col-span-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Vianočné venovanie priamo na kazete
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#a8a59d]">
                    Tieto texty sa skompilujú priamo do tokenizovaného binárneho kódu Sinclair BASIC a zakódujú do zvukových impulzov magnetickej pásky.
                  </p>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div>
                    <label
                      htmlFor="gift-recipient-input"
                      className="block font-mono text-xs font-medium text-[#d4d1c8]"
                    >
                      Firmy / Obdarovaný (max 28 ZX znakov)
                    </label>
                    <input
                      id="gift-recipient-input"
                      type="text"
                      maxLength={28}
                      value={config.recipient}
                      onChange={(e) =>
                        onConfigChange({ ...config, recipient: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-sm border border-[#3d4250] bg-[#0c0e14] px-3 py-2 font-mono text-sm text-white focus:border-[#00e8e8] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gift-dedication-input"
                      className="block font-mono text-xs font-medium text-[#d4d1c8]"
                    >
                      Vianočné prianie (max 30 ZX znakov)
                    </label>
                    <input
                      id="gift-dedication-input"
                      type="text"
                      maxLength={30}
                      value={config.dedication}
                      onChange={(e) =>
                        onConfigChange({ ...config, dedication: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-sm border border-[#3d4250] bg-[#0c0e14] px-3 py-2 font-mono text-sm text-white focus:border-[#00e8e8] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Clock Calibration Toggle */}
                <div>
                  <div className="font-mono text-xs font-medium text-[#d4d1c8]">
                    Časovací profil impulzov kazety
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setClockProfile('zx35')}
                      className={`min-h-[42px] cursor-pointer rounded-sm border px-3 py-2 text-left font-mono text-xs transition-colors ${
                        clockProfile === 'zx35'
                          ? 'border-[#00e8e8] bg-[#00c8c8]/15 text-[#00e8e8]'
                          : 'border-[#353a46] bg-[#0e1118] text-[#b5b2a9] hover:border-[#6e727c]'
                      }`}
                    >
                      <div className="font-bold">Štandard ZX (3,5 MHz)</div>
                      <div className="mt-0.5 text-[11px] opacity-80">Odporúčané · Najspoľahlivejšie</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClockProfile('didaktik40')}
                      className={`min-h-[42px] cursor-pointer rounded-sm border px-3 py-2 text-left font-mono text-xs transition-colors ${
                        clockProfile === 'didaktik40'
                          ? 'border-[#ffee00] bg-[#ffee00]/12 text-[#ffee00]'
                          : 'border-[#353a46] bg-[#0e1118] text-[#b5b2a9] hover:border-[#6e727c]'
                      }`}
                    >
                      <div className="font-bold">Didaktik M (4,0 MHz)</div>
                      <div className="mt-0.5 text-[11px] opacity-80">Rýchlejší takt Z80A</div>
                    </button>
                  </div>
                  {clockProfile === 'didaktik40' && (
                    <p
                      role="alert"
                      className="mt-2 rounded-sm border border-[#ff1e1e]/60 bg-[#2a0c0c] px-3 py-1.5 font-mono text-xs font-semibold text-[#ffee00]"
                    >
                      Experimentálne – na skutočný LOAD použi zx35
                    </p>
                  )}
                </div>

                {/* Authentic 6912 B SCREEN$ Loading Screen Preview */}
                <div>
                  <div className="flex items-center justify-between font-mono text-xs text-[#d4d1c8]">
                    <span className="font-semibold">Náhľad kazetovej obrazovky SCREEN$</span>
                    <span className="text-[11px] text-[#00e8e8]">256×192 · 6912 B · 8×8 atribúty</span>
                  </div>
                  <div className="mt-2 max-w-[360px] overflow-hidden rounded-sm border border-[#3d4250] bg-[#000000] p-1">
                    <canvas
                      ref={previewCanvasRef}
                      width={ZX_SCREEN_W}
                      height={ZX_SCREEN_H}
                      aria-label="Náhľad kazetového SCREEN$ loading screenu pre Didaktik M"
                      className="pixel-canvas aspect-[4/3] w-full bg-[#000000]"
                    />
                  </div>
                </div>

                {/* Unboxed clean binary metadata */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#2b303c] pt-3 font-mono text-xs text-[#b5b2a9] tabular-nums">
                  <span>Deluxe .TAP: {builtDeluxeTap ? builtDeluxeTap.tapBytes.length : 0} B (6 blokov)</span>
                  <span aria-hidden="true">·</span>
                  <span>Deluxe zvuk: {estimatedDeluxeDurationSec.toFixed(1)} s</span>
                  <span aria-hidden="true">·</span>
                  <span>Záloha: {builtTap.tapBytes.length} B ({estimatedDurationSec.toFixed(1)} s)</span>
                </div>
              </div>

              {/* Right Column: Live Tape Deck Output + Downloads */}
              <div className="flex flex-col gap-5 lg:col-span-6">
                {/* Authentic ZX Border Loader Visualizer */}
                <div className={`rounded-sm border border-[#3d4250] p-3.5 transition-all ${stripeClass}`}>
                  <div className="rounded-sm bg-[#090b10] p-4 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        {isPlayingTape
                          ? tapePhase === 'pilot'
                            ? 'PILOTNÝ TÓN (806 Hz)'
                            : tapePhase === 'data'
                              ? 'PRENOS DÁTOVÉHO BLOKU'
                              : 'PAUZA MEDZI BLOKMI'
                          : 'MAGNETOFÓN PRIPRAVENÝ'}
                      </span>
                      <span className="text-[#00e8e8] tabular-nums">
                        {Math.round(tapeProgress * 100)}%
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-[#c9c6be]">
                      <div>Program: {builtTap.filename} · Bytes: ZUBOK (SCREEN$)</div>
                      <div className="mt-0.5 text-[#ffee00]">LOAD &quot;&quot;</div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 w-full overflow-hidden bg-[#1e222d]">
                      <div
                        className="h-full bg-[#00e8e8] transition-all duration-100"
                        style={{ width: `${Math.round(tapeProgress * 100)}%` }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTapeAudio('deluxe')}
                        className={`min-h-[42px] cursor-pointer whitespace-nowrap rounded-sm border-2 px-3 py-2 font-display text-xs font-bold tracking-wide transition-colors ${
                          isPlayingTape && playingMode === 'deluxe'
                            ? 'border-[#ff1e1e] bg-[#ff1e1e] text-white hover:bg-[#e01b1b]'
                            : 'border-[#00e8e8] bg-[#00c8c8] text-[#070a10] hover:bg-[#00e8e8]'
                        }`}
                      >
                        {isPlayingTape && playingMode === 'deluxe'
                          ? 'Zastaviť Deluxe'
                          : 'Prehrať Deluxe (MG)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleTapeAudio('backup')}
                        className={`min-h-[42px] cursor-pointer whitespace-nowrap rounded-sm border px-3 py-2 font-mono text-xs font-semibold transition-colors ${
                          isPlayingTape && playingMode === 'backup'
                            ? 'border-[#ff1e1e] bg-[#ff1e1e] text-white'
                            : 'border-[#494e5a] bg-[#181c26] text-[#ebe9e3] hover:border-[#ffee00] hover:text-[#ffee00]'
                        }`}
                      >
                        {isPlayingTape && playingMode === 'backup'
                          ? 'Zastaviť zálohu'
                          : 'Prehrať zálohu (MG)'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Deluxe Cassette (with SCREEN$) Export Buttons */}
                <div className="flex flex-col gap-2.5">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#00e8e8]">
                    Deluxe kazeta so SCREEN$ (odporúčané pre Didaktik M)
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleDownloadDeluxeWav}
                      className="min-h-[44px] cursor-pointer whitespace-nowrap rounded-sm border border-[#ffee00] bg-[#1e2114] px-4 py-2 font-mono text-xs font-bold text-[#ffee00] transition-colors hover:bg-[#ffee00] hover:text-[#070a10]"
                    >
                      Deluxe kazeta .WAV
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadDeluxeTap}
                      className="min-h-[44px] cursor-pointer whitespace-nowrap rounded-sm border border-[#00e8e8] bg-[#102226] px-4 py-2 font-mono text-xs font-bold text-[#00e8e8] transition-colors hover:bg-[#00e8e8] hover:text-[#070a10]"
                    >
                      Deluxe obraz .TAP
                    </button>
                  </div>

                  {/* Backup Original 1-Block Export Buttons (100% preserved) */}
                  <div className="mt-1 border-t border-[#2b303c] pt-2.5">
                    <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#9ea3ae]">
                      Záloha: pôvodný jednoblokový export (bez SCREEN$)
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={handleDownloadTap}
                        className="min-h-[38px] cursor-pointer whitespace-nowrap rounded-sm border border-[#494e5a] bg-[#181c26] px-3 py-1.5 font-mono text-xs font-medium text-[#ebe9e3] transition-colors hover:border-[#00e8e8] hover:text-[#00e8e8]"
                      >
                        Záloha .TAP
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadWav}
                        className="min-h-[38px] cursor-pointer whitespace-nowrap rounded-sm border border-[#494e5a] bg-[#181c26] px-3 py-1.5 font-mono text-xs font-medium text-[#ebe9e3] transition-colors hover:border-[#ffee00] hover:text-[#ffee00]"
                      >
                        Záloha .WAV
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadBas}
                        className="min-h-[38px] cursor-pointer whitespace-nowrap rounded-sm border border-[#494e5a] bg-[#181c26] px-3 py-1.5 font-mono text-xs font-medium text-[#ebe9e3] transition-colors hover:border-white hover:text-white"
                      >
                        Zdroj .BAS
                      </button>
                    </div>
                  </div>

                  {downloadNote && (
                    <p className="font-mono text-xs text-[#1ae62a]" role="status">
                      {downloadNote}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'udg' && (
            <UdgPixelArtPanel udgPack={udgPack} onChangeUdgPack={onUdgPackChange} />
          )}

          {activeTab === 'sfx' && <ChiptuneSfxPanel />}

          {activeTab === 'basic' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#b5b2a9]">
                  Presný program pre Sinclair BASIC 48K tokenizovaný do blokov .TAP / .WAV (používa 6 vlastných UDG v USR &quot;a&quot;..&quot;f&quot;).
                </p>
                <button
                  type="button"
                  onClick={handleCopyBasic}
                  className="min-h-[36px] cursor-pointer whitespace-nowrap rounded-sm border border-[#525660] bg-[#1b1f2a] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#ebe9e3] hover:border-[#00e8e8] hover:text-[#00e8e8]"
                >
                  {copiedBasic ? 'Skopírované' : 'Kopírovať BASIC kód'}
                </button>
              </div>
              <pre className="max-h-[420px] overflow-auto rounded-sm border border-[#2b303c] bg-[#090b10] p-4 font-mono text-xs leading-relaxed text-[#d9e7f5]">
                {basicSource}
              </pre>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="flex flex-col gap-6">
              {/* Top Split: User's Actual Didaktik M Photo + Verified Specs */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <div className="overflow-hidden rounded-sm border border-[#3d4250] bg-[#0b0d12] flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="font-mono text-[10px] text-[#9ea3ae] mb-2 uppercase tracking-wider">
                        Didaktik M (referenčný kus)
                      </div>
                      <div className="w-20 h-12 border-2 border-[#00e8e8] bg-[#0a0d14] mx-auto rounded-sm">
                        <div className="w-3 h-3 bg-[#1ae62a] rounded mx-auto mt-1" />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-[#9ea3ae]">
                    Didaktik M (Didaktik Skalica, 1990–1993) · Referenčný kus
                  </p>
                </div>

                <div className="lg:col-span-7">
                  <h3 className="text-sm font-semibold text-white">
                    Overené technické parametre Didaktik M
                  </h3>
                  <dl className="mt-3 divide-y divide-[#242834] border-y border-[#242834]">
                    {DIDAKTIK_SPECS.map((spec) => (
                      <div key={spec.label} className="grid grid-cols-12 gap-2 py-2.5 text-xs">
                        <dt className="col-span-3 font-mono font-semibold text-[#00e8e8]">
                          {spec.label}
                        </dt>
                        <dd className="col-span-9">
                          <div className="font-mono font-semibold text-white">{spec.value}</div>
                          <div className="mt-0.5 text-[#a8a59d]">{spec.detail}</div>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* Bottom Split: 5-Pin DIN MG Pinout SVG + 3-Step Loading Guide */}
              <div className="grid grid-cols-1 gap-5 border-t border-[#2b303c] pt-5 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <h3 className="text-sm font-semibold text-white">
                    Zapojenie 5-kolíkového konektora DIN (MG)
                  </h3>
                  <div className="mt-3 flex items-center gap-4">
                    <svg
                      viewBox="0 0 120 120"
                      className="h-24 w-24 shrink-0"
                      role="img"
                      aria-label="Schéma zapojenia 5-kolíkového 180-stupňového DIN konektora"
                    >
                      <circle cx="60" cy="60" r="52" fill="#0c0e14" stroke="#7c7972" strokeWidth="3" />
                      <rect x="52" y="102" width="16" height="10" fill="#13161e" />
                      {/* Pin 2 (Top center GND) */}
                      <circle cx="60" cy="24" r="6" fill="#C8C8C8" />
                      <text x="60" y="39" textAnchor="middle" fill="#C8C8C8" fontSize="10" fontFamily="monospace">2</text>
                      {/* Pin 4 & 5 */}
                      <circle cx="34" cy="36" r="6" fill="#9ea3ae" />
                      <text x="34" y="51" textAnchor="middle" fill="#9ea3ae" fontSize="10" fontFamily="monospace">4</text>
                      <circle cx="86" cy="36" r="6" fill="#00E8E8" />
                      <text x="86" y="51" textAnchor="middle" fill="#00E8E8" fontSize="10" fontFamily="monospace">5</text>
                      {/* Pin 1 (MIC) & Pin 3 (EAR) */}
                      <circle cx="24" cy="64" r="6" fill="#FFEE00" />
                      <text x="24" y="80" textAnchor="middle" fill="#FFEE00" fontSize="10" fontFamily="monospace">1</text>
                      <circle cx="96" cy="64" r="6" fill="#00E8E8" />
                      <text x="96" y="80" textAnchor="middle" fill="#00E8E8" fontSize="10" fontFamily="monospace">3</text>
                    </svg>

                    <ul className="space-y-1 font-mono text-[11px] text-[#c9c6be]">
                      {MG_DIN_PINOUT.map((p) => (
                        <li key={p.pin}>
                          <span className="font-bold text-white">Pin {p.pin}:</span> {p.signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <h3 className="text-sm font-semibold text-white">
                    Nahrávanie do skutočného Didaktik M
                  </h3>
                  <ol className="mt-3 space-y-2.5">
                    {LOAD_STEPS.map((s) => (
                      <li key={s.step} className="text-xs leading-relaxed text-[#b5b2a9]">
                        <span className="font-mono font-bold text-[#ffee00]">{s.step}. </span>
                        <span className="font-semibold text-white">{s.title}: </span>
                        {s.text}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
