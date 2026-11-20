import React, { useMemo, useState } from 'react';
import {
  DIDAKTIK_CHIPTUNE_PACK,
  DidaktikChiptuneAsset,
  encodeChiptuneToWav,
  formatSfxAsBasic,
  formatSfxAsZ80,
  getChiptuneTotalDuration,
  SfxCategory,
} from '../didaktik/chiptuneAssets';
import {
  computeZxAttributeByte,
  DEFAULT_UDG_PACK,
  DidaktikUdgAsset,
  formatUdgAsBasic,
  formatUdgPackAsBasic,
  formatUdgPackAsZ80,
  getZxHexColor,
  isUdgPixelSet,
  toggleUdgPixel,
  ZX_INK_COLORS,
} from '../didaktik/udgAssets';
import { didaktikAudio } from '../game/audio';
import { MELODIK_TRACKS, MelodikTrackId } from '../game/music';

function downloadBlob(data: Uint8Array | string, filename: string, mimeType: string): void {
  const blob =
    typeof data === 'string'
      ? new Blob([data], { type: mimeType })
      : new Blob([data.buffer as ArrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Renders an 8x8 Didaktik M UDG sprite onto an offscreen canvas and downloads a crisp PNG spritesheet.
 */
function downloadUdgSpriteSheetPng(assets: DidaktikUdgAsset[]): void {
  const scale = 8; // 64x64 per tile for crisp modern inspection while preserving exact 8x8 pixels
  const cols = 6;
  const rows = Math.ceil(assets.length / cols);
  const pad = 8;
  const tilePx = 8 * scale;
  const canvas = document.createElement('canvas');
  canvas.width = cols * (tilePx + pad) + pad;
  canvas.height = rows * (tilePx + pad) + pad;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#090b10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  assets.forEach((asset, idx) => {
    const gx = idx % cols;
    const gy = Math.floor(idx / cols);
    const ox = pad + gx * (tilePx + pad);
    const oy = pad + gy * (tilePx + pad);
    const inkHex = getZxHexColor(asset.ink, asset.bright);
    const paperHex = getZxHexColor(asset.paper, asset.bright);

    ctx.fillStyle = paperHex;
    ctx.fillRect(ox, oy, tilePx, tilePx);
    ctx.fillStyle = inkHex;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isUdgPixelSet(asset.bytes, r, c)) {
          ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
        }
      }
    }
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zubok-a-signalik-udg-spritesheet.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

interface UdgMiniPreviewProps {
  asset: DidaktikUdgAsset;
  size?: number;
}

const UdgMiniPreview: React.FC<UdgMiniPreviewProps> = ({ asset, size = 32 }) => {
  const ink = getZxHexColor(asset.ink, asset.bright);
  const paper = getZxHexColor(asset.paper, asset.bright);
  return (
    <svg
      viewBox="0 0 8 8"
      width={size}
      height={size}
      className="shrink-0 rounded-[1px] border border-[#353a46]"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width="8" height="8" fill={paper} />
      {asset.bytes.map((byte, row) =>
        Array.from({ length: 8 }).map((_, col) =>
          ((byte >> (7 - col)) & 1) === 1 ? (
            <rect key={`${row}-${col}`} x={col} y={row} width="1" height="1" fill={ink} />
          ) : null
        )
      )}
    </svg>
  );
};

interface UdgPixelArtPanelProps {
  udgPack: DidaktikUdgAsset[];
  onChangeUdgPack: (next: DidaktikUdgAsset[]) => void;
}

export const UdgPixelArtPanel: React.FC<UdgPixelArtPanelProps> = ({
  udgPack,
  onChangeUdgPack,
}) => {
  const [selectedId, setSelectedId] = useState<string>(udgPack[0]?.id ?? 'dr_micro');
  const [codeFormat, setCodeFormat] = useState<'basic' | 'z80'>('basic');
  const [copied, setCopied] = useState(false);

  const selected = udgPack.find((u) => u.id === selectedId) ?? udgPack[0];
  const totalBytes = udgPack.length * 8;
  const attrByte = computeZxAttributeByte(selected.ink, selected.paper, selected.bright);
  const inkHex = getZxHexColor(selected.ink, selected.bright);
  const paperHex = getZxHexColor(selected.paper, selected.bright);

  const updateSelected = (patch: Partial<DidaktikUdgAsset>) => {
    onChangeUdgPack(udgPack.map((u) => (u.id === selected.id ? { ...u, ...patch } : u)));
  };

  const handleTogglePixel = (row: number, col: number) => {
    updateSelected({ bytes: toggleUdgPixel(selected.bytes, row, col) });
  };

  const handleInvert = () => {
    updateSelected({ bytes: selected.bytes.map((b) => (~b) & 0xff) });
  };

  const handleResetOne = () => {
    const orig = DEFAULT_UDG_PACK.find((u) => u.id === selected.id);
    if (orig) updateSelected({ bytes: orig.bytes.slice(), ink: orig.ink, paper: orig.paper, bright: orig.bright });
  };

  const snippet = useMemo(() => {
    if (codeFormat === 'basic') {
      return formatUdgAsBasic(selected, 900);
    }
    const hex = selected.bytes.map((b) => '$' + b.toString(16).toUpperCase().padStart(2, '0')).join(',');
    return `; ${selected.name} — USR "${selected.slotChar}" (CHR$ ${selected.chrCode})\n; 8 B bitmapa + 1 B ATTR ($${attrByte
      .toString(16)
      .toUpperCase()
      .padStart(2, '0')})\nUDG_${selected.id.toUpperCase()}:\n    DEFB ${hex}`;
  }, [selected, codeFormat, attrByte]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Memory Budget Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2b303c] pb-3.5">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Sada 8×8 UDG Pixel Art pre Didaktik M (microDENT.sk &amp; TeatrO.eu)
          </h3>
          <p className="mt-0.5 font-mono text-xs text-[#a8a59d] tabular-nums">
            {totalBytes} / 168 B UDG tabuľky ({((totalBytes / 49152) * 100).toFixed(2)} % zo 48 KiB RAM) · 8 B bitmapa + 1 B farebný atribút
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => downloadUdgSpriteSheetPng(udgPack)}
            className="min-h-[36px] cursor-pointer whitespace-nowrap rounded-sm border border-[#00e8e8] bg-[#102226] px-3 py-1.5 font-mono text-xs font-semibold text-[#00e8e8] hover:bg-[#00e8e8] hover:text-[#070a10]"
          >
            Export .PNG hárok
          </button>
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                formatUdgPackAsZ80(udgPack),
                'zubok-a-signalik-udg.asm',
                'text/plain;charset=utf-8'
              )
            }
            className="min-h-[36px] cursor-pointer whitespace-nowrap rounded-sm border border-[#ffee00] bg-[#1e2114] px-3 py-1.5 font-mono text-xs font-semibold text-[#ffee00] hover:bg-[#ffee00] hover:text-[#070a10]"
          >
            Export Z80 .ASM
          </button>
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                formatUdgPackAsBasic(udgPack),
                'zubok-a-signalik-udg.bas',
                'text/plain;charset=utf-8'
              )
            }
            className="min-h-[36px] cursor-pointer whitespace-nowrap rounded-sm border border-[#525660] bg-[#191d27] px-3 py-1.5 font-mono text-xs font-semibold text-[#ebe9e3] hover:border-white"
          >
            Export .BAS zavádzač
          </button>
        </div>
      </div>

      {/* Main 2-column Workspace */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: 12-Tile Sprite Selector */}
        <div className="lg:col-span-5">
          <div className="grid grid-cols-2 gap-2">
            {udgPack.map((asset) => {
              const active = asset.id === selected.id;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedId(asset.id)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-sm border p-2 text-left transition-colors ${
                    active
                      ? 'border-[#00e8e8] bg-[#19232c]'
                      : 'border-[#2b303c] bg-[#0e1118] hover:border-[#525660]'
                  }`}
                >
                  <UdgMiniPreview asset={asset} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-xs font-semibold text-white">
                      {asset.name}
                    </div>
                    <div className="font-mono text-[10px] text-[#9ea3ae] tabular-nums">
                      USR &quot;{asset.slotChar}&quot; · 8 B
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive 8x8 Pixel Editor + Attribute Picker + Code */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-sm border border-[#2b303c] bg-[#0e1118] p-4">
            {/* Interactive 8x8 pixel canvas */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-white">
                  {selected.name} (CHR$ {selected.chrCode})
                </span>
                <span className="font-mono text-[11px] text-[#00e8e8] tabular-nums">
                  ATTR ${attrByte.toString(16).toUpperCase().padStart(2, '0')} ({attrByte})
                </span>
              </div>

              <div
                className="grid grid-cols-8 gap-0.5 rounded-sm border border-[#494e5a] bg-[#222733] p-1"
                role="grid"
                aria-label={`Editor pixelov 8 krát 8 pre ${selected.name}`}
              >
                {selected.bytes.map((byte, row) =>
                  Array.from({ length: 8 }).map((_, col) => {
                    const lit = ((byte >> (7 - col)) & 1) === 1;
                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        aria-label={`Pixel riadok ${row + 1} stĺpec ${col + 1} ${lit ? 'zapnutý' : 'vypnutý'}`}
                        onClick={() => handleTogglePixel(row, col)}
                        className="h-6 w-6 cursor-pointer border border-black/35 transition-transform active:scale-95"
                        style={{ backgroundColor: lit ? inkHex : paperHex }}
                      />
                    );
                  })
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInvert}
                  className="cursor-pointer whitespace-nowrap rounded-sm border border-[#494e5a] bg-[#181c26] px-2.5 py-1 font-mono text-[11px] text-[#ebe9e3] hover:border-[#ffee00] hover:text-[#ffee00]"
                >
                  Invertovať bity
                </button>
                <button
                  type="button"
                  onClick={handleResetOne}
                  className="cursor-pointer whitespace-nowrap rounded-sm border border-[#494e5a] bg-[#181c26] px-2.5 py-1 font-mono text-[11px] text-[#ebe9e3] hover:border-[#00e8e8] hover:text-[#00e8e8]"
                >
                  Obnoviť dlaždicu
                </button>
              </div>
            </div>

            {/* ZX Spectrum 1-byte Color Attribute Controls */}
            <div className="flex min-w-[200px] flex-1 flex-col gap-3">
              <p className="text-xs leading-relaxed text-[#b5b2a9]">
                {selected.description}
              </p>

              <div>
                <div className="font-mono text-[11px] text-[#9ea3ae]">
                  ZX INK (0–7) · Aktívna: {ZX_INK_COLORS[selected.ink].name}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ZX_INK_COLORS.map((c) => (
                    <button
                      key={c.index}
                      type="button"
                      aria-label={`Nastaviť INK ${c.name}`}
                      onClick={() => updateSelected({ ink: c.index })}
                      className={`h-6 w-6 cursor-pointer rounded-[2px] border-2 ${
                        selected.ink === c.index ? 'border-white scale-110' : 'border-[#353a46]'
                      }`}
                      style={{ backgroundColor: selected.bright === 1 ? c.bright : c.normal }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-[#9ea3ae]">
                  Príznak BRIGHT (+64)
                </span>
                <button
                  type="button"
                  onClick={() => updateSelected({ bright: selected.bright === 1 ? 0 : 1 })}
                  className={`cursor-pointer whitespace-nowrap rounded-sm border px-2.5 py-1 font-mono text-[11px] font-semibold ${
                    selected.bright === 1
                      ? 'border-[#ffee00] bg-[#ffee00]/15 text-[#ffee00]'
                      : 'border-[#494e5a] bg-[#181c26] text-[#b5b2a9]'
                  }`}
                >
                  BRIGHT {selected.bright}
                </button>
              </div>

              {selected.chrCode <= 149 && (
                <p className="font-mono text-[11px] text-[#1ae62a]">
                  Naživo synchronizované do kazety .TAP / .WAV (USR &quot;{selected.slotChar}&quot;)
                </p>
              )}
            </div>
          </div>

          {/* Code Export Box */}
          <div className="rounded-sm border border-[#2b303c] bg-[#090b10] p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCodeFormat('basic')}
                  className={`cursor-pointer whitespace-nowrap rounded-sm px-2.5 py-1 font-mono text-[11px] font-semibold ${
                    codeFormat === 'basic'
                      ? 'bg-[#262c3a] text-[#00e8e8]'
                      : 'text-[#9ea3ae] hover:text-white'
                  }`}
                >
                  Sinclair BASIC
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFormat('z80')}
                  className={`cursor-pointer whitespace-nowrap rounded-sm px-2.5 py-1 font-mono text-[11px] font-semibold ${
                    codeFormat === 'z80'
                      ? 'bg-[#262c3a] text-[#ffee00]'
                      : 'text-[#9ea3ae] hover:text-white'
                  }`}
                >
                  Z80 Assembler
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="cursor-pointer whitespace-nowrap rounded-sm border border-[#494e5a] bg-[#161a24] px-2.5 py-1 font-mono text-[11px] text-[#ebe9e3] hover:border-[#00e8e8] hover:text-[#00e8e8]"
              >
                {copied ? 'Skopírované' : 'Kopírovať kód'}
              </button>
            </div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-[#d9e7f5]">
              {snippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChiptuneSfxPanel: React.FC = () => {
  const [filter, setFilter] = useState<'all' | SfxCategory>('all');
  const [selectedId, setSelectedId] = useState<string>(DIDAKTIK_CHIPTUNE_PACK[0].id);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeJukeboxTrack, setActiveJukeboxTrack] = useState<MelodikTrackId | null>(() =>
    didaktikAudio.getCurrentTrackId()
  );
  const [codeFormat, setCodeFormat] = useState<'basic' | 'z80'>('basic');
  const [copied, setCopied] = useState(false);

  const handleToggleJukeboxTrack = (trackId: MelodikTrackId) => {
    didaktikAudio.playJukeboxTrack(trackId);
    setActiveJukeboxTrack(didaktikAudio.getCurrentTrackId());
  };

  const visiblePack = useMemo(
    () =>
      filter === 'all'
        ? DIDAKTIK_CHIPTUNE_PACK
        : DIDAKTIK_CHIPTUNE_PACK.filter((s) => s.category === filter),
    [filter]
  );

  const selected: DidaktikChiptuneAsset =
    DIDAKTIK_CHIPTUNE_PACK.find((s) => s.id === selectedId) ?? DIDAKTIK_CHIPTUNE_PACK[0];

  const totalZ80Bytes = DIDAKTIK_CHIPTUNE_PACK.reduce((acc, s) => acc + s.z80Bytes, 0);

  const handlePlay = (asset: DidaktikChiptuneAsset) => {
    setSelectedId(asset.id);
    setPlayingId(asset.id);
    didaktikAudio.playChiptuneSteps(asset.steps, () => {
      setPlayingId((cur) => (cur === asset.id ? null : cur));
    });
  };

  const handleDownloadWav = (asset: DidaktikChiptuneAsset) => {
    const wavBytes = encodeChiptuneToWav(asset, 44100);
    downloadBlob(wavBytes, `zubok-a-signalik-${asset.id}.wav`, 'audio/wav');
  };

  const handleDownloadFullAsm = () => {
    const full = [
      '; Zubok a signalik — 1-Bit Piezo Beeper SFX & Melodie pre Didaktik M',
      '; microDENT.sk & TeatrO.eu — Vianocna edicia Rimavska Sobota',
      `; Celkova velkost zvukovej banky: ${totalZ80Bytes} bajtov (0 B sample RAM)`,
      '',
      ...DIDAKTIK_CHIPTUNE_PACK.map((s) => formatSfxAsZ80(s)),
    ].join('\n\n');
    downloadBlob(full, 'zubok-a-signalik-sfx-banka.asm', 'text/plain;charset=utf-8');
  };

  const codeText = useMemo(
    () => (codeFormat === 'basic' ? formatSfxAsBasic(selected, 500) : formatSfxAsZ80(selected)),
    [selected, codeFormat]
  );

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header + Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2b303c] pb-3.5">
        <div>
          <h3 className="text-sm font-semibold text-white">
            1-Bitová banka zvukov a melódií pre Didaktik M (Port 0xFE)
          </h3>
          <p className="mt-0.5 font-mono text-xs text-[#a8a59d] tabular-nums">
            {DIDAKTIK_CHIPTUNE_PACK.length} zvukov · {totalZ80Bytes} B celková Z80 tabuľka · 0 B sample RAM · Priamo kompatibilné s BEEP a $03B5
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadFullAsm}
          className="min-h-[36px] cursor-pointer whitespace-nowrap rounded-sm border border-[#ffee00] bg-[#1e2114] px-3 py-1.5 font-mono text-xs font-semibold text-[#ffee00] hover:bg-[#ffee00] hover:text-[#070a10]"
        >
          Export celej Z80 .ASM banky
        </button>
      </div>

      {/* Melodik AY-3-8912 4-Track Game Soundtrack Jukebox */}
      <div className="rounded-sm border border-[#1ae62a]/35 bg-[#0c1412] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f3328] pb-2">
          <div>
            <div className="font-mono text-xs font-bold text-[#1ae62a]">
              Melodik AY-3-8912 Jukebox · 4 herné skladby
            </div>
            <div className="font-mono text-[11px] text-[#9ea3ae]">
              3-kanálový syntetizátor (Lead + Harmónia + Bas) · prepínateľný klávesom H aj na 1-bit Beeper
            </div>
          </div>
          {activeJukeboxTrack && (
            <button
              type="button"
              onClick={() => {
                didaktikAudio.stopMusic();
                setActiveJukeboxTrack(null);
              }}
              className="min-h-[30px] cursor-pointer whitespace-nowrap rounded-sm border border-[#ff1e1e] bg-[#221015] px-2.5 py-1 font-mono text-[11px] font-bold text-[#ff1e1e] hover:bg-[#ff1e1e] hover:text-white"
            >
              Zastaviť hudbu
            </button>
          )}
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MELODIK_TRACKS.map((track) => {
            const isPlaying = activeJukeboxTrack === track.id;
            return (
              <button
                key={track.id}
                type="button"
                aria-label={`${isPlaying ? 'Zastaviť' : 'Prehrať'} skladbu ${track.title}`}
                onClick={() => handleToggleJukeboxTrack(track.id)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-sm border px-2.5 py-2 text-left transition-colors ${
                  isPlaying
                    ? 'border-[#1ae62a] bg-[#11281b] text-white'
                    : 'border-[#25312c] bg-[#090d0c] text-[#cfd7e3] hover:border-[#1ae62a]/70'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-[11px] font-bold text-white">
                    {track.title}
                  </div>
                  <div className="truncate font-mono text-[10px] text-[#9ea3ae] tabular-nums">
                    {track.bpm} BPM · {track.steps.length} krokov
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold ${
                    isPlaying
                      ? 'bg-[#1ae62a] text-[#070a10]'
                      : 'border border-[#1ae62a]/60 text-[#1ae62a]'
                  }`}
                >
                  {isPlaying ? 'STOP' : 'HRAŤ'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter Segmented Control */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'all', label: 'Všetky zvuky (10)' },
            { id: 'microdent', label: 'microDENT.sk' },
            { id: 'teatro', label: 'TeatrO.eu' },
            { id: 'arcade', label: 'Arkáda' },
            { id: 'christmas', label: 'Vianoce' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`min-h-[32px] cursor-pointer whitespace-nowrap rounded-sm px-3 py-1 font-mono text-xs font-semibold transition-colors ${
              filter === item.id
                ? 'bg-[#262c3a] text-[#00e8e8]'
                : 'bg-[#0e1118] text-[#9ea3ae] hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 2-Column Sound Bank + Inspector */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Sound Bank List */}
        <div className="flex max-h-[380px] flex-col gap-2 overflow-y-auto pr-1 lg:col-span-6">
          {visiblePack.map((sfx) => {
            const active = sfx.id === selected.id;
            const isPlaying = playingId === sfx.id;
            const ms = Math.round(getChiptuneTotalDuration(sfx) * 1000);
            return (
              <div
                key={sfx.id}
                className={`flex items-center justify-between gap-2 rounded-sm border px-3 py-2.5 transition-colors ${
                  active
                    ? 'border-[#00e8e8] bg-[#17212b]'
                    : 'border-[#2b303c] bg-[#0e1118] hover:border-[#525660]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(sfx.id)}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                >
                  <div className="truncate font-mono text-xs font-semibold text-white">
                    {sfx.name}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-[#9ea3ae] tabular-nums">
                    {sfx.z80Bytes} B · {ms} ms · {sfx.steps.length} krokov
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Prehrať ${sfx.name}`}
                    onClick={() => handlePlay(sfx)}
                    className={`min-h-[34px] cursor-pointer whitespace-nowrap rounded-sm border px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                      isPlaying
                        ? 'border-[#1ae62a] bg-[#1ae62a] text-[#070a10]'
                        : 'border-[#00e8e8] bg-[#00c8c8]/15 text-[#00e8e8] hover:bg-[#00e8e8] hover:text-[#070a10]'
                    }`}
                  >
                    {isPlaying ? 'Hrá' : 'Prehrať'}
                  </button>
                  <button
                    type="button"
                    aria-label={`Stiahnuť WAV pre ${sfx.name}`}
                    onClick={() => handleDownloadWav(sfx)}
                    className="min-h-[34px] cursor-pointer whitespace-nowrap rounded-sm border border-[#494e5a] bg-[#181c26] px-2.5 py-1 font-mono text-[11px] text-[#ebe9e3] hover:border-[#ffee00] hover:text-[#ffee00]"
                  >
                    .WAV
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: 1-Bit Pitch Visualizer & Code Exporter */}
        <div className="flex flex-col gap-4 lg:col-span-6">
          <div className="rounded-sm border border-[#2b303c] bg-[#0e1118] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-mono text-sm font-bold text-white">{selected.name}</h4>
                <p className="mt-0.5 text-xs text-[#a8a59d]">{selected.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handlePlay(selected)}
                className="min-h-[36px] shrink-0 cursor-pointer whitespace-nowrap rounded-sm border border-[#00e8e8] bg-[#00c8c8] px-3.5 py-1 font-display text-xs font-bold text-[#070a10] hover:bg-[#00e8e8]"
              >
                Vypočuť
              </button>
            </div>

            {/* 1-Bit Square Wave Pitch Step Bars */}
            <div className="mt-4 flex h-24 items-end gap-1 rounded-sm border border-[#242834] bg-[#07090e] p-2.5">
              {selected.steps.map((st, idx) => {
                const isRest = st.semitone === null;
                const norm = isRest ? 0 : Math.max(0.12, Math.min(1, (st.semitone! + 12) / 44));
                return (
                  <div
                    key={idx}
                    className="flex h-full flex-col justify-end"
                    style={{ flex: Math.max(1, Math.round(st.duration * 40)) }}
                    title={isRest ? `Pauza ${Math.round(st.duration * 1000)} ms` : `Výška ${st.semitone} · ${Math.round(st.duration * 1000)} ms`}
                  >
                    <div
                      className={`w-full rounded-t-[1px] ${
                        isRest
                          ? 'bg-transparent'
                          : playingId === selected.id
                            ? 'bg-[#1ae62a]'
                            : 'bg-[#00e8e8]'
                      }`}
                      style={{ height: `${Math.round(norm * 100)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[11px] text-[#9ea3ae] tabular-nums">
              <span>1-bitová obdĺžniková vlna (Port 0xFE)</span>
              <span>
                {selected.z80Bytes} B Z80 · {Math.round(getChiptuneTotalDuration(selected) * 1000)} ms
              </span>
            </div>
          </div>

          {/* Code Export Box */}
          <div className="rounded-sm border border-[#2b303c] bg-[#090b10] p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCodeFormat('basic')}
                  className={`cursor-pointer whitespace-nowrap rounded-sm px-2.5 py-1 font-mono text-[11px] font-semibold ${
                    codeFormat === 'basic'
                      ? 'bg-[#262c3a] text-[#00e8e8]'
                      : 'text-[#9ea3ae] hover:text-white'
                  }`}
                >
                  Sinclair BASIC BEEP
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFormat('z80')}
                  className={`cursor-pointer whitespace-nowrap rounded-sm px-2.5 py-1 font-mono text-[11px] font-semibold ${
                    codeFormat === 'z80'
                      ? 'bg-[#262c3a] text-[#ffee00]'
                      : 'text-[#9ea3ae] hover:text-white'
                  }`}
                >
                  Z80 ROM $03B5
                </button>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="cursor-pointer whitespace-nowrap rounded-sm border border-[#494e5a] bg-[#161a24] px-2.5 py-1 font-mono text-[11px] text-[#ebe9e3] hover:border-[#00e8e8] hover:text-[#00e8e8]"
              >
                {copied ? 'Skopírované' : 'Kopírovať kód'}
              </button>
            </div>
            <pre className="max-h-[160px] overflow-auto font-mono text-[11px] leading-relaxed text-[#d9e7f5]">
              {codeText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
