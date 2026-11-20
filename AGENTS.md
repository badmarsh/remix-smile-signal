# AGENTS.md — Zúbok a signálik / Didaktik M Christmas Edition

Vianočný retro darček pre Rada Ceglédyho z Rimavskej Soboty.
Webová ZX Spectrum / Didaktik M 256x192 px arkáda + generátor kaziet (.TAP / .WAV / .BAS).

## Rýchly štart

    npm install --legacy-peer-deps
    npm run dev    # http://localhost:3000
    npm test       # 70+ deterministických unit testov (vrátane Service Incident Arc Štúpieň 7)
    npm run build  # offline balík dist/

## Architektúra

- src/game/      — Herný engine, renderer, audio, levely, typy
- src/didaktik/  — ZX Spectrum TAP/WAV/SCR/UDG generátory
- src/components/ — React UI: HUD, Tape Kit, Visual Manual, Secret Room
- src/data/      — Editovateľné venovanie a podpisy občanov

## Hardvérové limity Didaktik M (dodržiavaj vždy)

- Rozlíšenie: 256 x 192 px + 12 px border
- Paleta: 15 farieb ZX ULA (8 normálnych + 7 bright)
- Attribute clash: max 2 farby na 8x8 px bunku
- Zvuk: 1-bit Beeper + AY-3-8912 Melodik (3 kanály)
- TAP blok: max 65535 B, XOR checksum, standard pilot
- WAV: 44100 Hz, 16-bit PCM mono, zx35 profil (3,5 MHz)

## Melodik AY-3-8912 — 5 skladieb

| ID | Skladba | BPM | Použitie |
|---|---|---|---|
| microdent | Klinika microDENT | 128 | Stages 0-1 · Stage 7 deploy_select / timed_arena |
| teatro | Optický impulz TeatrO | 136 | Stage 2 |
| rimava | Rimavská Sobota: Zimný večer | 118 | Stages 3-4 · Stage 7 relay_repair / wave_defense |
| boss | Finále: Veľký Rušič | 148 | Boss fight, Stage 5 (takes priority over Stage 7 mode) |
| vianoce | Koleda Rimavskej Soboty | 110 | Title, Handover, Victory |

## MCP servery (pre ZX Spectrum debugging)

Zaregistrované v ~/.codex/config.toml:
    [mcp_servers.zesarux]     — Live PEEK/POKE, debug v ZEsarUX emulátore
    [mcp_servers.8bits-music] — AI chiptune kompozícia cez MCP

CLI nástroje:
    npx @dtz-labs/zesarux-mcp  — ZEsarUX live debug
    npx 8-bits-music-mcp       — 8-bit chiptune generátor
    zxs build && zxs verify    — zx-vibes Z80 workflow (npm i -g zx-vibes)

## Čo editovať pre finálne odovzdanie

1. src/data/dedication.ts  — TEXT VENOVANIA a Tajná miestnosť 1270
2. src/data/signatures.ts  — MENÁ OBČANOV (placeholdery -> reálne mená)
3. src/assets/images/      — Fotka Rada (automaticky ZX kvantizovaná)

## Pravidlá pre AI agentov

- Nula DOM závislostí v engine.ts a music.ts — beží deterministicky v Node.js.
- Fyzikálny čas v sekundách: stepWorld(world, dtSec, input).
- Po každej zmene: npm test musí dať 0 failed.
- Žiadne Math.random() v engine.ts / music.ts / levels.ts — všetká náhodosť je seeded z konfigurácie alebo mriežky.
- Používaj selectTitleTrack() pre titulnú obrazovku, selectTrackForStage() pre klasické štúpie, selectTrackForMode() pre Service Incident Arc režimy (deploy_select/timed_arena → microdent, relay_repair/wave_defense → rimava).
- PlayMode union: 'normal' | 'deploy_select' | 'timed_arena' | 'relay_repair' | 'wave_defense'. Nové polia v GameWorld/HudSnapshot sú additive a inicializujú sa v loadStage() s bezpečnými predvolenými hodnotami.
- Kroky hudby sú semitóny od C4 (C4=0, D4=2, E4=4, G4=7, C5=12, C6=24).
- Respektuj WAV formát: 44100 Hz mono 16-bit PCM, square wave, zx35 timing.