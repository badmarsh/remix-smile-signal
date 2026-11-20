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

## Deterministické testovanie (State Hash + Golden Replays)

- src/game/hash.ts obsahuje simStateHash(world) — FNV-1a fingerprint herného stavu (gameplay-relevantné polia len; vylúčené sú čiestky, snehové vločky, afterimages, chronicle, border flash, trauma, hitstop, audio fronta, citizen speech).
- simStateString(world) serializuje stav v pevnom poradí kľúčov, polia zoradené podľa id — deterministické naprieč behmi.
- cloneWorld(world) vytvorí hlbokú kópiu pre counterfactual forking: rozvetvenie v kroku k, zmena jednej premennej, obnovenie z k+1, porovnanie hashov so zlatým behom.
- Každý nový režim hry (PlayMode) potrebuje zlatý replay test: rovnaké vstupy -> rovnaký hash, rôzne vstupy -> rozlíšený hash.
- Hash sa nesmie meniť pri zmene len prezentačného stavu (čiestky, sneh, blikanie okraja, chronický text).

## Schémy testov (z výskumu AI-agent gamedev)

- Golden replay: 3 behy za režim (čakanie, aktívna hra, dokončenie), hash každých N tikov + finálny hash, CI overuje identickosť.
- Counterfactual forking: uložiť stav v kroku k, mutate premennú (napr. prah partnerCharge 0.3 vs 0.5), obnoviť z k+1, overiť rozlúčku hashov.
- Všetky testy musia prechádzať v Node.js (node:test) bez DOM, bez prehliadača.

## Multi-agent role roster (z výskumu AI-agent gamedev)

Každý agent má jednu z týchto rolí s definovanými povinnosťami. Každá zmena
prechádza minimálne cez dva role (napr. LeadDev → QA) pred merge-om.

| Rol | Skratka | Povinnosti |
|-----|---------|------------|
| Product Manager | PM | Definuje požiadavky, akceptačné kritériá, prioritu taskov |
| Architect | ARCH | Drží ARCHITECTURE.md a DESIGN_RULES.md, schvaluje vrstvenie kódu |
| Lead Developer | LEAD | Implementuje, drží stepWorld ako jednotnú autoritu stavu |
| QA Engineer | QA | Piše testy pred kódom, overuje npm test = 0 failed, determinizmus |
| Security | SEC | Kontroluje žiadne DOM v sim, žiadne Math.random, bezpečnosť hashu |
| DevOps | DEVOPS | CI/CD, tagy, PR merge, tsc --noEmit bez nových chýb |

## Pravidlá spolupráce agentov

- **Human owns architecture.** Človek rozhoduje o vrstvení, agenti implementujú podľa ARCHITECTURE.md.
- **Screenshot feedback.** Po zmene v rendereri/App.tsx overiť vizuálny výsledok.
- **Cross-system audits.** Pred merge-om skontrolovať, že zmena neporuší iný modul (napr. music ↔ App.tsx).
- **Play the game.** QA spustí `npm run dev` a skúsi Stage 7 v týchto režimoch: deploy_select, timed_arena, relay_repair, wave_defense.
- **GDD is Law.** `docs/service-incident-arc-design.md` je závratný štandard pre Štúpieň 7.
- **Brutal critic sub-agent.** Každá zmena prechádza recenziou: čo sa zhoršilo, čo je zbytočné, čo by sa malo odstrániť.

## .agent-workflow príkazy

| Príkaz | Popis | Súbor |
|--------|-------|-------|
| `do` | Implementovať jeden task (test-first) | `.agent-workflow/do.md` |
| `integrate` | Zlúčiť feature branch do main | `.agent-workflow/integrate.md` |
| `clean-code` | Refaktorovať bez zmeny správania | `.agent-workflow/clean-code.md` |
| `review` | Tri-pass recenzia (integracia, jednoduchosť, správnosť) | `.agent-workflow/review.md` |
| `dupes` | Nájduť duplikované koncepty | `.agent-workflow/dupes.md` |
| `map` | Mapa kódovej základny | `.agent-workflow/map.md` |