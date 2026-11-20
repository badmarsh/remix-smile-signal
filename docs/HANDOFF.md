# Odovzdávacia dokumentácia — Zúbok a signálik v1.0.0-rc.1

**Vydané:** 20. 11. 2026  
**Odovzdáva:** Developérsky tím (Arena.ai Agent Mode)  
**Odovzdáva sa:** Produktovému vlastníkovi / QA tímu  
**Verzia:** 1.0.0-rc.1  
**Repo:** https://github.com/badmarsh/remix-smile-signal (branch: main, tag: v1.0.0-rc.1)

---

## 1. Prehľad

Retro arkádová hra pre Didaktik M / ZX Spectrum 48K s techno-futuristickým vizuálnym manuálom, venovaná Radovi Ceglédymu (1. miesto Celoživotný MVP regiónu Rimavská Sobota). Beží vo prehliadači (Vite dev server) a podporuje offline file:// spustenie cez IIFE bundle.

**Technický stack:** React 19, TypeScript, Vite, Tailwind CSS, Canvas API (2D), Web Audio API (1-bit beeper + Melodik AY-3-8912).

---

## 2. Ako spustiť lokálne

### Predpoklady
- Node.js 22+
- npm

### Inštalácia
```bash
cd /home/user/remix-smile-signal
npm install --legacy-peer-deps
```
*Poznámka: `--legacy-peer-deps` je nutné kvôli peer konfliktu v závislostiach.*

### Development server
```bash
npm run dev
```
Server beží na `http://0.0.0.0:3000`. Pre live preview Arena použite port 3000 (binduje na 0.0.0.0).

### Produkčný build
```bash
npm run build
```
Výstup: `dist/` (≈ 7,2 MB, kvôli obrázkom — viz bekannté obmedzenie).

### Offline file:// build
```bash
npm run build:offline
```
Vytvorí `dist/assets/index-offline.iife.js` (≈ 471 kB IIFE) a aktualizuje `dist/index.html` na klasický `<script>` tag (bez `type="module"`) pre kompatibilitu s file:// protokolom.

---

## 3. Ako testovať

### Všetky kontroly (odporúčané pred odovzdaním)
```bash
npm run verify
```
Spustí: `tsc --noEmit` → `npm test` → `check:rules` → `build` → `build:offline`.  
Očakávaný výsledok: **0 chýb**.

### Len testy
```bash
npm test
```
Očakávaný výsledok: **147/147 pass, 0 fail**.

### Len typy
```bash
npx tsc --noEmit
```
Očakávaný výsledok: **0 chýb**.

---

## 4. Architektúra a vrstvy

Simulácia, prezentácia a vstup sú striktne oddelené:

| Vrstva | Súbory | DOM dependence |
|--------|--------|----------------|
| Simulácia (engine) | `src/game/engine.ts`, `src/game/levels.ts`, `src/game/music.ts`, `src/game/hash.ts` | Žiadne (beží v Node.js) |
| Didaktik (kazety, BASIC, SFX) | `src/didaktik/` | Žiadne |
| Prezentácia (React) | `src/App.tsx`, `src/components/` | Áno (React DOM, Canvas) |
| Audio (Web Audio API) | `src/game/audio.ts` | Áno (browser only) |

**Kľúčový kontrakt:** `stepWorld(world, dtSec, input)` musí byť zachovaný — deterministický, bez `Math.random()`, všetky RNG seeded zo stage grid alebo config.

---

## 5. Ovládanie (klávesnica + dotyk)

| Akcia | Klávesnica (1P) | Klávesnica (2P) | Dotyk |
|-------|-----------------|-----------------|-------|
| Pohyb | WASD / šípky | H1: WASD, H2: šípky | Dotykové šípky |
| Streľba / nabíjanie | Medzerník | H1: medzerník, H2: Enter | Dotykové tlačidlo OHEŇ/VLNA |
| Saboteúrsky úhyb | Shift | H2: ShiftRight / KeyX | Dotykové tlačidlo ÚHYB |
| Prepínač hrdinu | C | — | Dotykové tlačidlo (ZÚBOK/SIGNÁLIK) |
| Pauza | Esc / P | — | Dotykové tlačidlo pauza |
| 2P ko-op | [2] v titulke | — | — |
| Tlačenie zvuk | M | — | — |
| Tlačenie chip mode | H | — | — |
| Tlačenie CRT | — | — | — |
| Vizuálny manuál | V | — | — |
| Kazetové štúdio | T | — | — |
| Tajná miestnosť 1270 | K (v titulke) | — | — |

---

## 6. Obsah (7 štádií)

| Index | ID | Názov | Firma | Relikvia |
|-------|-----|-------|-------|----------|
| 0 | clinic | Klinika microDENT | microDENT.sk · 1. dejstvo | CEREC 3D Korunka |
| 1 | endo | Endo & 3D CBCT Lab | microDENT.sk · 1. dejstvo | Zubný mikroskop & Laser |
| 2 | teatro | Optický uzol TeatrO | TeatrO.eu · 2. dejstvo | Optický patchcord 10G |
| 3 | rimava_muzeum | Rieka Rimava & Kurinec | TeatrO.eu · 2. dejstvo | Vysielač Free Wi-Fi + RTX 3090 |
| 4 | rimava_vault | Gemersko-malohontské múzeum | Rimavská Sobota · 3. dejstvo | Kronika Rymos Zumbota 1270 |
| 5 | finale | Hlavné námestie · Plaketa MVP | Finále MVP · Rado Ceglédy | Plaketa 1. miesto · Celoživotný MVP |
| 6 | service | Servisný úraz · Rimavská Sobota | Servisný úraz · Akt IV | Servisný kľúč |

---

## 7. Známé obmedzenia (known issues)

Pozri `docs/known-issues.md` pre úplný zoznam. Najdôležitejšie:

- **Dist size ≈ 7,2 MB** — prevyšuje 5 MB limit (optimalizácia obrázkov odložená do F7)
- **Math.random() v audio.ts:236** — browser-only zvukový jitter, nie v deterministickom engíne
- **Stage 7 (Servisný úraz)** — dosiahnuteľný len cez testy v reálnom toku

---

## 8. CI / CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
- Node 22
- Spúšťa `npm run verify` (tsc → test → check:rules → build → build:offline)
- Nahráva dist ako artefact

---

## 9. Hodnoty na overenie pri odovzdaní

| Požiadavka | Hodnota | Stav |
|------------|---------|------|
| Testy | 147/147 pass, 0 fail | ✅ |
| Typy (tsc) | 0 chýb | ✅ |
| Verify pipeline | 0 chýb | ✅ |
| Dist size | ≈ 7,2 MB (limit 5 MB) | ⚠️ viz známé obmedzenie |
| Offline bundle | 471 kB IIFE | ✅ |
| Touch ovládanie | 390×844 | ✅ |
| a11y modály | role="dialog", aria-modal | ✅ |
| Determinizmus | žiadne Math.random() v engíne | ✅ |

---

## 10. Kontakty a zdroje

- Repo: https://github.com/badmarsh/remix-smile-signal
- Release tag: `v1.0.0-rc.1`
- Release notes: `docs/RELEASE.md`
- Known issues: `docs/known-issues.md`
- Stav projektu: `docs/STATUS.md`

---

*Odovzdané s vďakou občanom regiónu Rimavská Sobota, microDENT.sk a TeatrO.eu. Venované Radovi Ceglédymu.*
