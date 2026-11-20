import React, { useRef, useState } from 'react';
import { CITIZEN_SIGNATURES, deriveSecretCode } from '../data/signatures';
import { DIDAKTIK_SPECS, LOAD_STEPS, MG_DIN_PINOUT } from '../didaktik/specs';
import { SPRITE_MVP_PLAQUE, SPRITE_SIGNALIK_A, SPRITE_ZUBOK_A } from '../game/sprites';
import {
  DEFAULT_RADO_PORTRAIT_URL,
  MicrodentLogo,
  MVP_PLAQUE_IMAGE_URL,
  PHYSICAL_EDITION_IMAGE_URL,
  PixelSpriteIcon,
  RadoPortraitFrame,
  RimavskaSobotaCrest,
  TeatroLogo,
} from './BrandEmblems';

type ManualChapter = 'venovanie' | 'fyzicka' | 'misia' | 'identita' | 'plaketa' | 'karta';

interface VisualManualModalProps {
  open: boolean;
  radoPhotoUrl: string;
  isCustomPhoto: boolean;
  onUploadRadoPhoto: (dataUrl: string) => void;
  onResetRadoPhoto: () => void;
  onOpenTapeKit: () => void;
  onStartGame: () => void;
  onClose: () => void;
}

const CHAPTERS: { id: ManualChapter; num: string; label: string }[] = [
  { id: 'venovanie', num: '01', label: 'Venovanie' },
  { id: 'fyzicka', num: '02', label: 'Fyzická edícia' },
  { id: 'misia', num: '03', label: 'Misia MVP' },
  { id: 'identita', num: '04', label: 'Erb & Hardvér' },
  { id: 'plaketa', num: '05', label: 'Plaketa 1. miesto' },
  { id: 'karta', num: '06', label: 'Zberateľská karta' },
];

const SECRET_CODE = deriveSecretCode();

export const VisualManualModal: React.FC<VisualManualModalProps> = ({
  open,
  radoPhotoUrl,
  isCustomPhoto,
  onUploadRadoPhoto,
  onResetRadoPhoto,
  onOpenTapeKit,
  onStartGame,
  onClose,
}) => {
  const [chapter, setChapter] = useState<ManualChapter>('venovanie');
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadRadoPhoto(reader.result);
        setPhotoNote('Fotka Rada bola aktualizovaná v hre, v manuáli aj na plakete.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="manual-modal-root fixed inset-0 z-50 flex items-center justify-center bg-[#05070c] p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visual-manual-title"
    >
      <div className="manual-sheet relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-sm border border-[#3a4254] bg-[#0a0d14] text-[#e8ecf2] shadow-[0_24px_80px_rgba(0,0,0,0.92)]">
        {/* Top Techno-Futurism Header Bar */}
        <header className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-[#232938] bg-[#0f1420] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <RimavskaSobotaCrest size={30} />
            <div>
              <h2
                id="visual-manual-title"
                className="font-display text-lg font-bold tracking-wide text-white sm:text-xl"
              >
                Zúbok a signálik · Vizuálny manuál
              </h2>
              <p className="font-mono text-[11px] text-[#9aa5b8]">
                Techno-futuristická edícia · Venované Radovi Ceglédymu · Rimavská Sobota
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Nahrať vlastnú fotografiu Rada Ceglédyho"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[38px] cursor-pointer whitespace-nowrap rounded-sm border border-[#3d4659] bg-[#141a28] px-3 py-1.5 font-mono text-xs font-medium text-[#d8e0ec] transition-colors hover:border-[#00e8e8] hover:text-[#00e8e8]"
            >
              Nahrať fotku Rada
            </button>
            {isCustomPhoto && (
              <button
                type="button"
                onClick={() => {
                  onResetRadoPhoto();
                  setPhotoNote('Obnovený predvolený techno-futuristický portrét.');
                }}
                className="min-h-[38px] cursor-pointer whitespace-nowrap rounded-sm border border-[#3d4659] bg-[#141a28] px-3 py-1.5 font-mono text-xs font-medium text-[#9aa5b8] hover:border-white hover:text-white"
              >
                Pôvodný portrét
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[38px] cursor-pointer whitespace-nowrap rounded-sm border border-[#e5b94c] bg-[#1f1c12] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#e5b94c] transition-colors hover:bg-[#e5b94c] hover:text-[#090c12]"
            >
              Tlačiť / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              aria-label="Zavrieť vizuálny manuál"
              className="min-h-[38px] cursor-pointer whitespace-nowrap rounded-sm border border-[#525b6e] bg-[#141925] px-3.5 py-1.5 font-mono text-xs font-semibold text-white hover:border-[#00e8e8] hover:text-[#00e8e8]"
            >
              Zavrieť
            </button>
          </div>
        </header>

        {/* Chapter Navigation Rail */}
        <nav
          className="no-print flex items-center gap-1 overflow-x-auto border-b border-[#1f2533] bg-[#0c1019] px-5 py-2"
          aria-label="Kapitoly vizuálneho manuálu"
          role="tablist"
        >
          {CHAPTERS.map((c) => {
            const active = chapter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setChapter(c.id)}
                className={`min-h-[38px] shrink-0 cursor-pointer whitespace-nowrap rounded-sm px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#1c2436] text-[#00e8e8]'
                    : 'text-[#8e99ad] hover:text-white'
                }`}
              >
                <span className="mr-1.5 text-[#e5b94c] tabular-nums">{c.num}.</span>
                {c.label}
              </button>
            );
          })}
        </nav>

        {photoNote && (
          <div className="no-print border-b border-[#1f2c24] bg-[#0e1c16] px-5 py-2 font-mono text-xs text-[#3be87a]" role="status">
            {photoNote}
          </div>
        )}

        {/* Scrollable Editorial Techno-Futurism Canvas */}
        <div
          className="flex-1 overflow-y-auto p-5 sm:p-8"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148,163,184,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.045) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          {/* CHAPTER 01 — VENOVANIE A MANIFEST REGIÓNU */}
          {chapter === 'venovanie' && (
            <section className="mx-auto flex max-w-5xl flex-col gap-8">
              {/* Hero Architectural Spread */}
              <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
                {/* Left 7 cols: Techno-Futurism Editorial Cover & Dedication Prose */}
                <div className="flex flex-col justify-between rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-6 sm:p-8 lg:col-span-7">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-[#9aa5b8]">
                      <span className="text-[#e5b94c]">Vydanie 01 · Rimavská Sobota</span>
                      <span aria-hidden="true">·</span>
                      <span>Didaktik M 48K</span>
                      <span aria-hidden="true">·</span>
                      <span>Techno-Futurizmus</span>
                    </div>

                    <h1 className="mt-4 text-balance font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                      Zúbok a signálik
                    </h1>
                    <p className="mt-2 font-mono text-sm font-semibold text-[#00e8e8]">
                      Pocta Radovi Ceglédymu · 1. miesto Celoživotný MVP v regióne
                    </p>

                    <div className="my-5 h-px w-full bg-[#242d3f]" />

                    <p className="max-w-prose text-sm leading-relaxed text-[#cfd7e3] sm:text-base">
                      Táto zberateľská retro hra a sprievodný vizuálny manuál sú úprimným{' '}
                      <strong className="font-semibold text-white">
                        prejavom úcty a vďaky od skupiny občanov regiónu Rimavská Sobota
                      </strong>
                      . Je venovaná <strong className="font-semibold text-[#e5b94c]">Radovi Ceglédymu</strong> — človeku, ktorý spája modernú medicínu, optickú konektivitu, AI inovácie a odvážnu víziu pre náš región.
                    </p>

                    <p className="mt-3.5 max-w-prose text-sm leading-relaxed text-[#b2bccd]">
                      Cieľom tvojej misie v hre je prejsť s dvojicou hrdinov <strong className="text-white">Zúbok</strong> a <strong className="text-white">Signálik</strong> naprieč klinikou{' '}
                      <span className="text-white">microDENT.sk</span> na ulici Istvána Hatvaniho 2, optickou ústredňou{' '}
                      <span className="text-white">TeatrO.eu</span>, ponad rieku Rimavu až na historické Hlavné námestie Rimavskej Soboty a bezpečne dopraviť Radovi zaslúženú{' '}
                      <span className="text-[#e5b94c]">plaketu za 1. miesto v kategórii Celoživotný MVP v regióne</span>.
                    </p>

                    {/* Pixel-Art Cast Strip: Zúbok · Signálik · Plaketa MVP */}
                    <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#242d3f] pt-4">
                      <div className="flex items-center gap-2.5">
                        <PixelSpriteIcon sprite={SPRITE_ZUBOK_A} size={34} label="Zúbok" />
                        <div className="leading-tight">
                          <div className="font-mono text-xs font-bold text-white">Zúbok</div>
                          <div className="font-mono text-[10px] text-[#00e8e8]">CEREC laser</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <PixelSpriteIcon sprite={SPRITE_SIGNALIK_A} size={34} label="Signálik" />
                        <div className="leading-tight">
                          <div className="font-mono text-xs font-bold text-white">Signálik</div>
                          <div className="font-mono text-[10px] text-[#e5b94c]">Wi-Fi bublina</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <PixelSpriteIcon sprite={SPRITE_MVP_PLAQUE} size={28} label="Plaketa MVP" />
                        <div className="leading-tight">
                          <div className="font-mono text-xs font-bold text-[#e5b94c]">Plaketa #1</div>
                          <div className="font-mono text-[10px] text-[#cfd7e3]">MVP regiónu</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Institutional Identity Bar inside Cover */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#242d3f] pt-5">
                    <div className="flex flex-wrap items-center gap-5">
                      <MicrodentLogo compact />
                      <TeatroLogo compact />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <RimavskaSobotaCrest size={34} />
                      <div className="font-mono text-[11px] leading-tight text-[#b2bccd]">
                        <div className="font-semibold text-white">Rimavská Sobota</div>
                        <div>Región Gemer-Malohont</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 cols: Framed Portrait Dossier of Rado Ceglédy */}
                <div className="flex flex-col justify-between rounded-sm border border-[#3a4254] bg-[#0e131e]/95 p-5 lg:col-span-5">
                  <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-[#e5b94c]/60 bg-[#090c12]">
                    <RadoPortraitFrame
                      src={radoPhotoUrl || DEFAULT_RADO_PORTRAIT_URL}
                      sizeClass="h-full w-full border-0"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#05080f]/95 via-[#05080f]/60 to-transparent p-4">
                      <div className="font-mono text-xs font-semibold text-[#e5b94c]">
                        Laureát ocenenia · 1. miesto
                      </div>
                      <div className="font-display text-2xl font-bold text-white">
                        Rado Ceglédy
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-[#cfd7e3]">
                        Celoživotný MVP v regióne · Rimavská Sobota
                      </div>
                    </div>
                  </div>

                  {/* Dossier Attributes (Zero-Pill clean definition list) */}
                  <dl className="mt-4 divide-y divide-[#1f2636] font-mono text-xs">
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-[#8e99ad]">Kategória ocenenia</dt>
                      <dd className="font-semibold text-[#e5b94c]">Celoživotný MVP</dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-[#8e99ad]">Pilier zdravia &amp; optiky</dt>
                      <dd className="text-white">microDENT.sk · TeatrO.eu</dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-[#8e99ad]">Vízia regiónu</dt>
                      <dd className="text-[#00e8e8]">AI inovácie · Free Wi-Fi · RTX 3090</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Action Strip */}
              <div className="no-print flex flex-wrap items-center justify-between gap-4 border-t border-[#232938] pt-5">
                <p className="font-mono text-xs text-[#9aa5b8]">
                  Kompletná edícia beží v modernom prehliadači aj na originálnej kazete Didaktik M (Skalica 1990).
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setChapter('fyzicka')}
                    className="min-h-[40px] cursor-pointer whitespace-nowrap rounded-sm border border-[#3d4659] bg-[#141a28] px-4 py-2 font-mono text-xs font-semibold text-white hover:border-[#00e8e8] hover:text-[#00e8e8]"
                  >
                    Pozrieť fyzickú krabičku →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartGame();
                    }}
                    className="min-h-[40px] cursor-pointer whitespace-nowrap rounded-sm border border-[#00e8e8] bg-[#00c8c8] px-5 py-2 font-display text-sm font-bold text-[#070a10] hover:bg-[#00e8e8]"
                  >
                    Spustiť misiu MVP
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* CHAPTER 02 — FYZICKÁ ZBERATEĽSKÁ EDÍCIA & TLAČITEĽNÉ ŠTÍTKY */}
          {chapter === 'fyzicka' && (
            <section className="mx-auto flex max-w-5xl flex-col gap-7">
              <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
                {/* Photorealistic Physical Edition Tabletop Showcase */}
                <div className="overflow-hidden rounded-sm border border-[#3a4254] bg-[#0e131e] lg:col-span-6">
                  <img
                    src={PHYSICAL_EDITION_IMAGE_URL}
                    alt="Zberateľská fyzická krabička hry Zúbok a signálik s magnetickou kazetou a počítačom Didaktik M na drevenom stole"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Physical Edition Spec Breakdown */}
                <div className="flex flex-col justify-between rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-6 lg:col-span-6">
                  <div>
                    <div className="font-mono text-xs text-[#e5b94c]">
                      02. Fyzická zberateľská sada · Darčekové balenie
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                      Krabica, magnetická kazeta a Didaktik M
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#c6cfdd]">
                      Fyzická verzia hry <strong className="text-white">Zúbok a signálik</strong> je navrhnutá ako poctivá zberateľská krabička v štýle techno-futurizmu 90. rokov — s matným čiernym obalom, brúseným strieborným lemom, erbom Rimavskej Soboty a skutočnou magnetofónovou kazetou, ktorú možno nahrať priamo cez port <span className="font-mono text-[#00e8e8]">MG</span>.
                    </p>

                    <dl className="mt-5 divide-y divide-[#202737] border-y border-[#202737] font-mono text-xs">
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-[#8e99ad]">Zberateľská krabica</dt>
                        <dd className="text-right text-white">165 × 225 × 38 mm · Matný kartón 350 g</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-[#8e99ad]">Médium</dt>
                        <dd className="text-right text-[#00e8e8]">C15/C30 kazeta · 44,1 kHz .WAV / .TAP</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-[#8e99ad]">Príkaz na spustenie</dt>
                        <dd className="text-right text-[#e5b94c]">LOAD &quot;&quot; · Autoštart RIADOK 10</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-[#8e99ad]">Súčasť balenia</dt>
                        <dd className="text-right text-white">Manuál + Plaketa 1. miesto + Kábel DIN</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="no-print mt-5 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTapeKit();
                      }}
                      className="min-h-[40px] cursor-pointer whitespace-nowrap rounded-sm border border-[#00e8e8] bg-[#10242c] px-4 py-2 font-mono text-xs font-semibold text-[#00e8e8] hover:bg-[#00e8e8] hover:text-[#070a10]"
                    >
                      Vygenerovať .WAV kazetu
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="min-h-[40px] cursor-pointer whitespace-nowrap rounded-sm border border-[#e5b94c] bg-[#1e1a10] px-4 py-2 font-mono text-xs font-semibold text-[#e5b94c] hover:bg-[#e5b94c] hover:text-[#070a10]"
                    >
                      Vytlačiť prebal &amp; štítok
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const svg = [
                          '<?xml version="1.0" encoding="UTF-8"?>',
                          '<svg xmlns="http://www.w3.org/2000/svg" width="265mm" height="305mm" viewBox="0 0 265 305">',
                          '  <rect width="265" height="305" fill="#ffffff"/>',
                          '  <!-- Vonkajsie rezacie linie (plna ciara) + ohyby (prerusovana) · Mierka 1:1 mm (krabicka 165 x 225 x 38 mm) -->',
                          '  <g font-family="monospace" font-size="3.2" fill="#222">',
                          '    <text x="12" y="10" font-weight="bold">ZUBOK A SIGNALIK · DIDAKTIK M · VYSTRIHOVACKA 3D KRABICKY (165 x 225 x 38 mm · MIERKA 1:1 mm)</text>',
                          '    <text x="12" y="15">Plna ciara = rez | Prerusovana ciara = ohyb | Zlozenie: chlopne 15 mm na lepenie</text>',
                          '  </g>',
                          '  <!-- Horna chlopna (165 x 38 mm) -->',
                          '  <rect x="52" y="22" width="165" height="38" fill="#0b0f18" stroke="#000" stroke-width="0.4"/>',
                          '  <rect x="52" y="60" width="165" height="225" fill="#0b0f18" stroke="#000" stroke-width="0.4"/>',
                          '  <!-- Chrbat krabicky (38 x 225 mm) -->',
                          '  <rect x="14" y="60" width="38" height="225" fill="#101726" stroke="#000" stroke-width="0.4"/>',
                          '  <!-- Bocna chlopna na lepenie (15 x 225 mm) -->',
                          '  <polygon points="217,60 232,68 232,277 217,285" fill="#eef2f7" stroke="#000" stroke-width="0.4"/>',
                          '  <!-- Ohybove ciary (dashed) -->',
                          '  <line x1="52" y1="60" x2="217" y2="60" stroke="#00e8e8" stroke-width="0.5" stroke-dasharray="3,2"/>',
                          '  <line x1="52" y1="60" x2="52" y2="285" stroke="#00e8e8" stroke-width="0.5" stroke-dasharray="3,2"/>',
                          '  <line x1="217" y1="60" x2="217" y2="285" stroke="#00e8e8" stroke-width="0.5" stroke-dasharray="3,2"/>',
                          '  <!-- Sinclair 4-farebny pasik na prednej strane -->',
                          '  <rect x="64" y="88" width="35" height="3" fill="#ff1e1e"/>',
                          '  <rect x="99" y="88" width="35" height="3" fill="#ffee00"/>',
                          '  <rect x="134" y="88" width="35" height="3" fill="#1ae62a"/>',
                          '  <rect x="169" y="88" width="35" height="3" fill="#00e8e8"/>',
                          '  <!-- Typografia prednej strany -->',
                          '  <text x="134.5" y="82" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ffffff">ZUBOK A SIGNALIK</text>',
                          '  <text x="134.5" y="102" text-anchor="middle" font-family="monospace" font-size="4.4" fill="#e5b94c">RADO CEGLEDY · 1. MIESTO CELOZIVOTNY MVP</text>',
                          '  <text x="134.5" y="110" text-anchor="middle" font-family="monospace" font-size="3.6" fill="#00e8e8">DIDAKTIK M (48K) · RIMAVSKA SOBOTA</text>',
                          '  <rect x="76" y="128" width="117" height="96" fill="none" stroke="#e5b94c" stroke-width="0.6"/>',
                          '  <text x="134.5" y="176" text-anchor="middle" font-family="monospace" font-size="4.2" fill="#9aa5b8">MIESTO PRE VYTLAČENÚ PLAKETU / FOTO</text>',
                          '  <text x="134.5" y="246" text-anchor="middle" font-family="monospace" font-size="4" fill="#cfd7e3">microDENT.sk  ·  TeatrO.eu</text>',
                          `  <text x="134.5" y="258" text-anchor="middle" font-family="monospace" font-size="4.2" font-weight="bold" fill="#ffee00">TAJNY KOD 1270: ${SECRET_CODE}</text>`,
                          '  <text x="134.5" y="274" text-anchor="middle" font-family="monospace" font-size="3.2" fill="#9aa5b8">OD SKUPINY OBCANOV REGIONU RIMAVSKA SOBOTA</text>',
                          '  <!-- Chrbat krabicky (otoceny text) -->',
                          '  <text x="33" y="172" text-anchor="middle" transform="rotate(-90 33 172)" font-family="monospace" font-size="6.5" font-weight="bold" fill="#e5b94c">ZUBOK A SIGNALIK · DIDAKTIK M · EDICIA RADO MVP</text>',
                          '  <!-- Horna chlopna text -->',
                          '  <text x="134.5" y="43" text-anchor="middle" font-family="monospace" font-size="5" font-weight="bold" fill="#00e8e8">LOAD &quot;&quot; (ZUBOK&amp;SIG · 48K)</text>',
                          '</svg>',
                        ].join('\n');
                        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'zubok-a-signalik-krabicka-165x225x38mm.svg';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }}
                      className="min-h-[40px] cursor-pointer whitespace-nowrap rounded-sm border border-[#1ae62a]/80 bg-[#0e1f14] px-4 py-2 font-mono text-xs font-semibold text-[#1ae62a] hover:bg-[#1ae62a] hover:text-[#070a10]"
                    >
                      Stiahnuť krabičku .SVG (1:1 mm)
                    </button>
                  </div>
                </div>
              </div>

              {/* Print-Ready Cassette Sticker + J-Card Blueprint */}
              <div className="print-avoid-break rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#222a3a] pb-3">
                  <h4 className="font-display text-lg font-bold text-white">
                    Technický výkres: Štítok na kazetu (102 × 64 mm) &amp; J-Card prebal
                  </h4>
                  <span className="font-mono text-xs text-[#9aa5b8]">
                    Pripravené na tlač pre fyzický darček
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Cassette Shell Label Mockup */}
                  <div className="lg:col-span-7">
                    <div className="rounded-sm border-2 border-[#465166] bg-[#12161f] p-4">
                      <div className="rounded-sm border border-[#00e8e8]/50 bg-[#080c14] p-4">
                        <div className="flex items-center justify-between gap-3 border-b border-[#1f293a] pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <RimavskaSobotaCrest size={28} />
                            <div>
                              <div className="font-display text-lg font-bold tracking-wide text-white">
                                ZÚBOK A SIGNÁLIK
                              </div>
                              <div className="font-mono text-[10px] text-[#e5b94c]">
                                RADO CEGLÉDY · 1. MIESTO CELOŽIVOTNÝ MVP REGIÓNU
                              </div>
                            </div>
                          </div>
                          <div className="text-right font-mono text-[11px] font-bold text-[#00e8e8]">
                            <div>STRANA A</div>
                            <div className="text-[#9aa5b8]">DIDAKTIK M</div>
                          </div>
                        </div>

                        {/* Authentic Cassette Tape Window Cutout */}
                        <div className="my-4 flex items-center justify-center gap-8 rounded-sm border border-[#2d3648] bg-[#151a24] py-3">
                          <div className="h-9 w-9 rounded-full border-4 border-[#94a3b8] bg-[#080b12]" />
                          <div className="h-6 w-28 rounded-sm border border-[#3c4557] bg-[#090c12]" />
                          <div className="h-9 w-9 rounded-full border-4 border-[#94a3b8] bg-[#080b12]" />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[#b2bccd]">
                          <span>microDENT.sk · TeatrO.eu · Rimavská Sobota</span>
                          <span className="font-bold text-[#ffee00]">LOAD &quot;&quot; (ZUBOK&amp;SIG)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* J-Card Spine + Tracklist */}
                  <div className="flex flex-col justify-between rounded-sm border border-[#3a4254] bg-[#0a0e17] p-4 font-mono text-xs lg:col-span-5">
                    <div>
                      <div className="text-[11px] font-bold text-[#e5b94c]">
                        J-CARD · ZADNÁ STRANA KAZETY
                      </div>
                      <div className="mt-2 h-px bg-[#222a3a]" />
                      <ul className="mt-3 space-y-2 text-[#cfd7e3] tabular-nums">
                        <li className="flex justify-between">
                          <span>01. Pilotný tón &amp; Hlavička</span>
                          <span className="text-[#00e8e8]">806 Hz</span>
                        </li>
                        <li className="flex justify-between">
                          <span>02. ZUBOK&amp;SIG (BASIC 48K)</span>
                          <span className="text-[#00e8e8]">RIADOK 10</span>
                        </li>
                        <li className="flex justify-between">
                          <span>03. 6× UDG Grafika USR a–f</span>
                          <span className="text-[#e5b94c]">48 B</span>
                        </li>
                        <li className="flex justify-between">
                          <span>04. 1-Bit Vianočná fanfára</span>
                          <span className="text-[#e5b94c]">Port 0xFE</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 border-t border-[#222a3a] pt-3 text-[11px] text-[#9aa5b8]">
                      Od skupiny občanov regiónu Rimavská Sobota · S úctou a vďakou
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* CHAPTER 03 — MISIA: DORUČENIE PLAKETY MVP */}
          {chapter === 'misia' && (
            <section className="mx-auto flex max-w-5xl flex-col gap-7">
              {/* Top Mission Split: MVP Plaque Photo + Mission Brief */}
              <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
                <div className="overflow-hidden rounded-sm border border-[#e5b94c]/60 bg-[#0e131e] lg:col-span-6">
                  <img
                    src={MVP_PLAQUE_IMAGE_URL}
                    alt="Plaketa za 1. miesto v kategórii Celoživotný MVP regiónu pre Rada Ceglédyho"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-6 lg:col-span-6">
                  <div>
                    <div className="font-mono text-xs text-[#00e8e8]">
                      03. Operačný brífing · 6 kôl v 3 dejstvách
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                      Doruč plaketu 1. miesto Radovi Ceglédymu
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#c6cfdd]">
                      Občania regiónu pripravili pre Rada jedinečnú pamätnú plaketu za prvé miesto v kategórii <strong className="text-[#e5b94c]">Celoživotný MVP v regióne</strong>. Aby sa však dostala až na pódium v Rimavskej Sobote, musíš zabezpečiť bezchybnú prevádzku oboch kľúčových uzlov — zubnej kliniky aj optickej siete.
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#222a3a] pt-4 font-mono">
                    <div>
                      <div className="whitespace-nowrap text-[11px] text-[#00e8e8]">1. dejstvo (1–2)</div>
                      <div className="mt-0.5 text-xs font-bold text-white">microDENT.sk</div>
                      <div className="mt-0.5 text-[11px] text-[#9aa5b8]">Hatvaniho 2 · Endo</div>
                    </div>
                    <div>
                      <div className="whitespace-nowrap text-[11px] text-[#e5b94c]">2. dejstvo (3–4)</div>
                      <div className="mt-0.5 text-xs font-bold text-white">TeatrO.eu</div>
                      <div className="mt-0.5 text-[11px] text-[#9aa5b8]">RSNET · Rimava</div>
                    </div>
                    <div>
                      <div className="whitespace-nowrap text-[11px] text-[#3be87a]">3. dejstvo (5–6)</div>
                      <div className="mt-0.5 text-xs font-bold text-white">Rimavská Sobota</div>
                      <div className="mt-0.5 text-[11px] text-[#9aa5b8]">Múzeum · Námestie</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retro Canon Inspiration Grid (ZX Spectrum & Czechoslovak Legends) */}
              <div className="rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#222a3a] pb-3">
                  <h4 className="font-display text-lg font-bold text-white">
                    Inšpirácia z kánonu legiend Didaktik M &amp; československej scény
                  </h4>
                  <span className="font-mono text-xs text-[#00e8e8]">
                    Ultrasoft · Fuxoft · Ultimate · Melodik AY-3-8912
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 text-xs leading-relaxed text-[#c6cfdd] md:grid-cols-3">
                  <div>
                    <div className="font-mono font-bold text-[#00e8e8]">
                      Dizzy · Towdie · Pedro · Belegost
                    </div>
                    <p className="mt-1">
                      V každom zo 6 kôl hľadáš regionálny artefakt (CEREC 3D korunka, Optický patchcord 10G, Kronika Rymos Zumbota 1270, Plaketa MVP), ktorý doplní život a zapíše sa do kroniky na spodku obrazovky.
                    </p>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-[#e5b94c]">
                      Saboteur! · Bubble Bobble · Target: Renegade
                    </div>
                    <p className="mt-1">
                      Prepínaj klávesom <strong className="text-white">C</strong> medzi Zúbkom a Signálikom (druhý hrdina ťa sprevádza a pomáha čistiť ciele), uväzňuj rušičov v Signálikovej Wi-Fi bubline a vyhýbaj sa útokom ninja úhybom <strong className="text-white">Shift</strong>.
                    </p>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-[#3be87a]">
                      F.I.R.E. · Exolon · R-Type · Elite · Knight Lore · Atomix · Boovie
                    </div>
                    <p className="mt-1">
                      Dvojité plazmové vlny, atomixové optické väzby medzi uzlami, kamenné klenby múzea, rotujúci vektorový maják v noci nad Rimavskou Sobotou a prepínateľný zvukový modul <strong className="text-white">Didaktik Melodik AY [H]</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls & Tactical Field Guide */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Dual Control Matrix */}
                <div className="rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-5 lg:col-span-6">
                  <h4 className="font-display text-lg font-bold text-white">
                    Ovládanie · Moderné PC vs. Didaktik M
                  </h4>
                  <dl className="mt-3 divide-y divide-[#1f2636] font-mono text-xs">
                    <div className="grid grid-cols-12 py-2">
                      <dt className="col-span-4 text-[#9aa5b8]">Pohyb hrdinu</dt>
                      <dd className="col-span-4 text-white">Šípky / WASD</dd>
                      <dd className="col-span-4 text-[#00e8e8]">Q A O P / Šípky T</dd>
                    </div>
                    <div className="grid grid-cols-12 py-2">
                      <dt className="col-span-4 text-[#9aa5b8]">Laser / Wi-Fi vlna</dt>
                      <dd className="col-span-4 text-white">Medzerník (Space)</dd>
                      <dd className="col-span-4 text-[#00e8e8]">SPACE / Kempston</dd>
                    </div>
                    <div className="grid grid-cols-12 py-2">
                      <dt className="col-span-4 text-[#9aa5b8]">Duo &amp; Saboteur úhyb</dt>
                      <dd className="col-span-4 text-white">C (Hrdina) · Shift (Úhyb)</dd>
                      <dd className="col-span-4 text-[#e5b94c]">Zúbok &lt;-&gt; Signálik</dd>
                    </div>
                    <div className="grid grid-cols-12 py-2">
                      <dt className="col-span-4 text-[#9aa5b8]">Zvuk &amp; Melodik AY</dt>
                      <dd className="col-span-4 text-white">H (Melodik/Beeper) · M</dd>
                      <dd className="col-span-4 text-[#3be87a]">Port 0xFE / AY-3-8912</dd>
                    </div>
                    <div className="grid grid-cols-12 py-2">
                      <dt className="col-span-4 text-[#9aa5b8]">Manuál / Kazeta</dt>
                      <dd className="col-span-4 text-white">V (Manuál) · T (Kazeta)</dd>
                      <dd className="col-span-4 text-[#e5b94c]">LOAD &quot;&quot; (Port MG)</dd>
                    </div>
                  </dl>
                </div>

                {/* Enemy & Scoring Dossier */}
                <div className="rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-5 lg:col-span-6">
                  <h4 className="font-display text-lg font-bold text-white">
                    Prekážky na trase a bodovanie
                  </h4>
                  <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-[#c6cfdd]">
                    <li>
                      <span className="font-mono font-bold text-[#3be87a]">Plakový zúbok (Hliadka):</span>{' '}
                      Stráži chodby kliniky. Zneškodni ho Zúbkovým laserom (+150) alebo uväzni Signálikovou bublinou a praskni (+250).
                    </li>
                    <li>
                      <span className="font-mono font-bold text-[#ff55ff]">Šumový rušič (Strelec):</span>{' '}
                      Udržiava si odstup a pred výstrelom zabliká výstražným prstencom — preskoč ho úhybom Shift.
                    </li>
                    <li>
                      <span className="font-mono font-bold text-[#ff4040]">Zubný kameň (Útočník):</span>{' '}
                      Pred rýchlym výpadom vyznačí smer čiarou — uhni do boku a zasiahni ho (+250 bodov).
                    </li>
                    <li>
                      <span className="font-mono font-bold text-[#e5b94c]">Artefakty Rimavskej Soboty:</span>{' '}
                      CEREC 3D korunka, Zubný laser, Optický patchcord 10G, Free Wi-Fi + RTX 3090, Kronika 1270 a Plaketa MVP (+400 až +1000 b. a +1 život).
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* CHAPTER 04 — IDENTITA, ERB A HARDVÉR DIDAKTIK M */}
          {chapter === 'identita' && (
            <section className="mx-auto flex max-w-5xl flex-col gap-7">
              {/* Institutional & Brand Showcase Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col justify-between rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-5">
                  <div className="flex items-center gap-3.5">
                    <RimavskaSobotaCrest size={54} />
                    <div>
                      <div className="font-display text-base font-bold text-white">
                        Rimavská Sobota
                      </div>
                      <div className="font-mono text-[11px] text-[#e5b94c]">
                        Rymos Zumbota · 1270
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[#b2bccd]">
                    Heraldický blazón: <em>„V striebornom štíte čierny orol v červenej zbroji.“</em> Mesto na rieke Rimava s pamiatkovým Hlavným námestím, Kostolom sv. Jána Krstiteľa, Gemersko-malohontským múzeom v husárskych kasárňach a letným strediskom Kurinec – Zelená voda.
                  </p>
                </div>

                <div className="flex flex-col justify-between rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-5">
                  <MicrodentLogo />
                  <p className="mt-3 text-xs leading-relaxed text-[#b2bccd]">
                    Moderná bezbolestná zubná klinika na ulici <strong className="text-white">Istvána Hatvaniho 2</strong> v Rimavskej Sobote — špičkové zubné mikroskopy, 3D röntgen CBCT, korunky na počkanie <strong className="text-[#00e8e8]">CEREC</strong>, zubný laser, mikroskopická endodoncia a implantológia.
                  </p>
                </div>

                <div className="flex flex-col justify-between rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-5">
                  <TeatroLogo />
                  <p className="mt-3 text-xs leading-relaxed text-[#b2bccd]">
                    Regionálna telekomunikačná značka optického a bezdrôtového internetu a digitálnej <strong className="text-[#e5b94c]">IPTV televízie</strong> s TV archívom a nahrávaním (RSNET Rimavská Sobota), spojená s technologickou a mediálnou stopou Rada Ceglédyho v regióne.
                  </p>
                </div>
              </div>

              {/* Didaktik M Authentic Hardware & DIN MG Wiring */}
              <div className="grid grid-cols-1 gap-6 rounded-sm border border-[#2a3346] bg-[#0e131e]/95 p-6 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <div className="overflow-hidden rounded-sm border border-[#3a4254] bg-[#090c12] flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="font-mono text-[10px] text-[#9aa5b8] mb-2 uppercase tracking-wider">
                        Didaktik M (originálny počítač)
                      </div>
                      <div className="w-20 h-12 border-2 border-[#00e8e8] bg-[#0a0d14] mx-auto rounded-sm">
                        <div className="w-3 h-3 bg-[#1ae62a] rounded mx-auto mt-1" />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-[#9aa5b8]">
                    Didaktik M (Výrobné družstvo Didaktik Skalica, 1990–1993)
                  </p>

                  <div className="mt-4 border-t border-[#222a3a] pt-4">
                    <h4 className="font-mono text-xs font-bold text-white">
                      Zapojenie 5-pin DIN (MG)
                    </h4>
                    <ul className="mt-2 space-y-1 font-mono text-[11px] text-[#b2bccd]">
                      {MG_DIN_PINOUT.map((p) => (
                        <li key={p.pin}>
                          <span className="font-bold text-[#00e8e8]">Pin {p.pin}:</span> {p.signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col justify-between lg:col-span-7">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      Technická špecifikácia Didaktik M &amp; postup nahrania
                    </h3>
                    <dl className="mt-3 divide-y divide-[#1f2636] border-y border-[#1f2636]">
                      {DIDAKTIK_SPECS.map((spec) => (
                        <div key={spec.label} className="grid grid-cols-12 gap-2 py-2 text-xs">
                          <dt className="col-span-3 font-mono font-semibold text-[#00e8e8]">
                            {spec.label}
                          </dt>
                          <dd className="col-span-9">
                            <div className="font-mono font-semibold text-white">{spec.value}</div>
                            <div className="text-[#9aa5b8]">{spec.detail}</div>
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <ol className="mt-4 space-y-2">
                      {LOAD_STEPS.map((s) => (
                        <li key={s.step} className="text-xs leading-relaxed text-[#b2bccd]">
                          <span className="font-mono font-bold text-[#e5b94c]">{s.step}. </span>
                          <span className="font-semibold text-white">{s.title}: </span>
                          {s.text}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="no-print mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTapeKit();
                      }}
                      className="min-h-[40px] cursor-pointer whitespace-nowrap rounded-sm border border-[#00e8e8] bg-[#10242c] px-4 py-2 font-mono text-xs font-semibold text-[#00e8e8] hover:bg-[#00e8e8] hover:text-[#070a10]"
                    >
                      Otvoriť štúdio kazety, UDG a Chiptune →
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* CHAPTER 05 — OFICIÁLNA PLAKETA 1. MIESTO (TLAČITEĽNÝ CERTIFIKÁT) */}
          {chapter === 'plaketa' && (
            <section className="mx-auto flex max-w-4xl flex-col gap-6">
              <div className="print-avoid-break relative overflow-hidden rounded-sm border-2 border-[#e5b94c] bg-[#0b0f18] p-7 sm:p-10">
                {/* Corner Architectural Precision Brackets */}
                <div className="pointer-events-none absolute top-3 left-3 h-5 w-5 border-t-2 border-l-2 border-[#00e8e8]" />
                <div className="pointer-events-none absolute top-3 right-3 h-5 w-5 border-t-2 border-r-2 border-[#00e8e8]" />
                <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-[#00e8e8]" />
                <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-[#00e8e8]" />

                {/* Top Heraldic Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#252e42] pb-5">
                  <div className="flex items-center gap-3.5">
                    <RimavskaSobotaCrest size={50} />
                    <div>
                      <div className="font-mono text-xs font-semibold tracking-wider text-[#e5b94c]">
                        PAMÄTNÁ PLAKETA · ČESTNÉ OCENENIE
                      </div>
                      <div className="font-mono text-xs text-[#9aa5b8]">
                        Región Rimavská Sobota · Edícia Didaktik M
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-display text-4xl font-bold text-[#e5b94c] tabular-nums">
                    1. MIESTO
                  </div>
                </div>

                {/* Main Award Centerpiece */}
                <div className="mt-7 grid grid-cols-1 items-center gap-7 sm:grid-cols-12">
                  <div className="flex flex-col items-center sm:col-span-4">
                    <RadoPortraitFrame
                      src={radoPhotoUrl || DEFAULT_RADO_PORTRAIT_URL}
                      sizeClass="h-44 w-44 border-2 border-[#e5b94c]"
                    />
                    <div className="mt-2.5 font-mono text-[11px] text-[#00e8e8]">
                      Laureát regiónu Gemer-Malohont
                    </div>
                  </div>

                  <div className="sm:col-span-8">
                    <div className="font-mono text-xs text-[#9aa5b8]">
                      Týmto s úctou a vďakou odovzdávame ocenenie
                    </div>
                    <h3 className="mt-1.5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                      Rado Ceglédy
                    </h3>
                    <div className="mt-2 font-mono text-base font-bold text-[#e5b94c]">
                      Celoživotný MVP v regióne
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[#cfd7e3]">
                      Za mimoriadnu energiu, ľudskosť, technologické vízie a každodennú prácu, ktorá posúva Rimavskú Sobotu a celý náš región vpred — od moderného zdravia v{' '}
                      <strong className="text-white">microDENT.sk</strong> cez optickú budúcnosť{' '}
                      <strong className="text-white">TeatrO.eu</strong> až po inšpiráciu pre celú komunitu.
                    </p>
                  </div>
                </div>

                {/* Bottom Signatures & Emblems */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-[#252e42] pt-5">
                  <div className="flex flex-wrap items-center gap-5">
                    <MicrodentLogo compact />
                    <TeatroLogo compact />
                  </div>
                  <div className="text-right">
                    <div className="font-sans text-sm font-semibold text-white">
                      Skupina občanov regiónu Rimavská Sobota
                    </div>
                    <div className="font-mono text-[11px] text-[#9aa5b8]">
                      Venované ako prejav úcty a vďaky · Hra Zúbok a signálik
                    </div>
                    <div className="mt-1.5 font-mono text-xs font-bold tracking-widest text-[#00e8e8]">
                      TAJNÝ KÓD 1270: {SECRET_CODE}
                    </div>
                  </div>
                </div>
              </div>

              <div className="no-print flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="min-h-[42px] cursor-pointer whitespace-nowrap rounded-sm border border-[#e5b94c] bg-[#e5b94c] px-5 py-2 font-display text-sm font-bold text-[#090c12] hover:bg-[#f2ca63]"
                >
                  Vytlačiť pamätnú plaketu / PDF
                </button>
              </div>
            </section>
          )}

          {/* CHAPTER 06 — TLAČITEĽNÁ ZBERATEĽSKÁ KARTA 63×88 mm + KNIHA PODPISOV */}
          {chapter === 'karta' && (
            <section className="mx-auto flex max-w-5xl flex-col gap-6">
              <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[#252e42] pb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    Zberateľská karta 63×88 mm &amp; Kniha podpisov
                  </h3>
                  <p className="mt-1 font-mono text-xs text-[#9aa5b8]">
                    Predná a zadná strana karty v mierke 1:1 mm (63×88 mm) s orezovými značkami, priestorom na podpisy občanov a tajným kódom pre Miestnosť 1270 (klávesa K na úvodnej obrazovke).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="min-h-[42px] cursor-pointer whitespace-nowrap rounded-sm border border-[#e5b94c] bg-[#e5b94c] px-5 py-2 font-display text-sm font-bold text-[#090c12] hover:bg-[#f2ca63]"
                >
                  Vytlačiť kartu 1:1 (63×88 mm)
                </button>
              </div>

              {/* 1:1 mm Collector Cards Front & Back */}
              <div className="flex flex-wrap items-start justify-center gap-8 py-2">
                {/* FRONT: 63mm x 88mm */}
                <div className="print-avoid-break flex flex-col items-center">
                  <div className="relative p-3">
                    {/* Crop marks */}
                    <div className="pointer-events-none absolute top-0 left-3 h-2.5 w-px bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute top-3 left-0 h-px w-2.5 bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute top-0 right-3 h-2.5 w-px bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute top-3 right-0 h-px w-2.5 bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute bottom-0 left-3 h-2.5 w-px bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute bottom-3 left-0 h-px w-2.5 bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute right-3 bottom-0 h-2.5 w-px bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute right-0 bottom-3 h-px w-2.5 bg-[#9aa5b8]" />

                    <div
                      className="flex flex-col justify-between overflow-hidden border-2 border-[#e5b94c] bg-[#0b0f18] p-3 text-white shadow-xl"
                      style={{ width: '63mm', height: '88mm' }}
                    >
                      <div className="flex items-center justify-between border-b border-[#252e42] pb-1.5">
                        <RimavskaSobotaCrest size={22} />
                        <div className="text-right font-mono text-[8px] leading-tight">
                          <div className="font-bold text-[#e5b94c]">EDÍCIA #001 · MVP</div>
                          <div className="text-[#9aa5b8]">RIMAVSKÁ SOBOTA</div>
                        </div>
                      </div>

                      <div className="my-2 flex flex-col items-center text-center">
                        <RadoPortraitFrame
                          src={radoPhotoUrl || DEFAULT_RADO_PORTRAIT_URL}
                          sizeClass="h-24 w-24 border-2 border-[#00e8e8]"
                        />
                        <div className="mt-2 font-display text-base font-bold leading-tight text-white">
                          Rado Ceglédy
                        </div>
                        <div className="font-mono text-[9px] font-bold text-[#e5b94c]">
                          1. MIESTO · CELOŽIVOTNÝ MVP
                        </div>
                        <div className="mt-1 font-mono text-[8px] text-[#cfd7e3]">
                          microDENT.sk · TeatrO.eu · Didaktik M
                        </div>
                      </div>

                      <div className="border-t border-[#252e42] pt-1.5 text-center">
                        <div className="font-mono text-[7px] uppercase tracking-wider text-[#9aa5b8]">
                          Tajný kód miestnosti 1270 [klávesa K]
                        </div>
                        <div className="mt-0.5 rounded-sm bg-[#111827] py-1 font-mono text-xs font-bold tracking-[0.22em] text-[#ffee00]">
                          {SECRET_CODE}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="no-print mt-1 text-center font-mono text-[11px] text-[#9aa5b8]">
                    Predná strana · 63 × 88 mm
                  </div>
                </div>

                {/* BACK: 63mm x 88mm with Kniha podpisov + blank handwritten signature lines */}
                <div className="print-avoid-break flex flex-col items-center">
                  <div className="relative p-3">
                    {/* Crop marks */}
                    <div className="pointer-events-none absolute top-0 left-3 h-2.5 w-px bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute top-3 left-0 h-px w-2.5 bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute top-0 right-3 h-2.5 w-px bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute top-3 right-0 h-px w-2.5 bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute bottom-0 left-3 h-2.5 w-px bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute bottom-3 left-0 h-px w-2.5 bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute right-3 bottom-0 h-2.5 w-px bg-[#9aa5b8]" />
                    <div className="pointer-events-none absolute right-0 bottom-3 h-px w-2.5 bg-[#9aa5b8]" />

                    <div
                      className="flex flex-col justify-between overflow-hidden border-2 border-[#00e8e8] bg-[#0b0f18] p-3 text-white shadow-xl"
                      style={{ width: '63mm', height: '88mm' }}
                    >
                      <div className="border-b border-[#252e42] pb-1">
                        <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#00e8e8]">
                          Kniha podpisov občanov RS
                        </div>
                        <div className="font-mono text-[7px] text-[#9aa5b8]">
                          S úctou a vďakou pre Rada Ceglédyho
                        </div>
                      </div>

                      <div className="my-1.5 grid grid-cols-1 gap-0.5 font-mono text-[7.5px] leading-tight text-[#d8e0ec]">
                        {CITIZEN_SIGNATURES.slice(0, 8).map((sig) => (
                          <div key={sig} className="truncate">
                            ★ {sig}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 border-t border-[#252e42] pt-2">
                        <div className="font-mono text-[7px] uppercase text-[#e5b94c]">
                          Vlastnoručné podpisy občanov:
                        </div>
                        <div className="h-3 border-b border-dashed border-[#525b6e]" />
                        <div className="h-3 border-b border-dashed border-[#525b6e]" />
                        <div className="h-3 border-b border-dashed border-[#525b6e]" />
                      </div>
                    </div>
                  </div>
                  <div className="no-print mt-1 text-center font-mono text-[11px] text-[#9aa5b8]">
                    Zadná strana · 63 × 88 mm (podpisy)
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
