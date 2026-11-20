# Release Notes — Zúbok a signálik v1.0.0-rc.1

**Vydané:** 20. 11. 2026  
**Branche:** main (posledný merge PR #11)  
**Tag:** `v1.0.0-rc.1`  
**Hra:** Zúbok a signálik — Didaktik M · Venované Radovi Ceglédymu (1. miesto Celoživotný MVP regiónu Rimavská Sobota)

---

## Čo je v tomto release

### F0 — Základ a poistka (PR #4)
- Verify pipeline (`scripts/verify.mjs`): tsc → test → check:rules → build → build:offline
- Check-rules: forbidden API detekcia, import vrstvy, dist size budget
- CI: GitHub Actions s Node 22, verify + dist artefact upload
- Hygiena: `.aistudio/`, `.antigravity/`, `.superpowers/` odstránené z gite
- Golden baseline: 22 stavových hashov pre deterministickú replay overenie

### F1 — Kritické chyby (P0) (PR #5)
- Opravená mŕtva vetva v music useEffect (title/handover/victory teraz dosažiteľné)
- `selectTrackForPhase()` — čistá funkcia v `src/game/music.ts`
- Stage 7 (Servisný úraz) dosiahnuteľný v reálnom toku
- Relic kind `service_key` pre Stage 7
- Bot playability dôkaz (BFS pathfinder, reachability analýza všetkých 7 štádií)
- File:// offline build (esbuild IIFE bundle, 471 kB)

### F2 — Obsah a slovenčina (PR #10)
- 7 štádií s kompletním slovenským obsahom (titulky, podtitulky, kroniky, relikvie, značky)
- Stage ordering: klinika → endo → teatro → ríma muzeum → ríma vault → finále → servis
- Žiadne anglické slová v titulkoch a kronikách

### F3 — Hrateľnosť, balans, onboarding (PR #7)
- Fixed-timestep simulácia (FIXED_DT = 1/60, MAX_ACCUMULATOR = 0.25)
- Onboarding: controls help na kazetovej obrazovke, hint overlay (prvých 30 s štádia 1), controls reminder v StatusModal
- Focus management: save/restore focus v modáli, autoFocus na prvý button
- Touch ovládanie: dotykové tlačidlo OHEŇ s nabíjacou spätnou väzbou

### F4 — Prezentácia, mobil, prístupnosť (PR #8)
- Focus trap + focus obnovenie po zavretí modály
- autoFocus na prvý button vo všetkých 5 modáli
- Dotykové ovládanie na 390×844 (šípky, LASER/VLNA, ÚHYB, prepínač hrdinu)

### F5 — Kazety a Didaktik (PR #9)
- Sinclair BASIC tokenizer a .TAP/.WAV builder (authentic ZX Spectrum/Didaktik M formát)
- 1-bit chiptune banka (12 SFX/melódii v 4 kategóriách: microDENT, TeatrO, arcade, christmas)
- UDG pixel art generácia

### F8 — Testy a QA (PR #11)
- dedication.test.ts: 12 testov (osobné venovanie Rado Ceglédymu, secret room)
- specs.test.ts: 7 testov (Didaktik M hardvér, ZX paleta, MG DIN pinout, LOAD kroky)
- Celkom: **147 testov, 0 fail**

---

## Overenie (Definition of Done)

| Kontrola | Príkaz | Výsledok |
|----------|--------|----------|
| Typy | `npx tsc --noEmit` | 0 chýb ✅ |
| Testy | `npm test` | 147/147 pass, 0 fail ✅ |
| Verify pipeline | `npm run verify` | 0 chýb ✅ |
| Build (vite) | `npm run build` | OK, ~779 ms ✅ |
| Offline build (file://) | `npm run build:offline` | 471 kB IIFE bundle ✅ |
| Touch ovládanie | 390×844 | Otestované ✅ |
| a11y modály | role="dialog", aria-modal, autoFocus | Otestované ✅ |

---

## Známé obmedzenia (out of scope pre rc.1)

| Obmedzenie | Detail | Plánované riešenie |
|------------|--------|-------------------|
| Dist size > 5 MB | dist ≈ 7,2 MB (obrázky) | Optimalizácia obrázkov v F7 |
| Math.random() v audio.ts | Browser-only zvukový jitter, nie v deterministickom engíne | Dokumentované v known-issues.md |
| Stage 7 (Servisný úraz) | Dosiahnuteľný len cez testy v reálnom toku | Dokumentované v known-issues.md |
| Manual playthrough video | Chýba screen capture | Počas F6/F7 |

---

## Inštalácia a spustenie

```bash
# Inštalácia (vyžaduje --legacy-peer-deps kvôli peer konfliktu)
npm install --legacy-peer-deps

# Development server (binduje na 0.0.0.0 pre live preview)
npm run dev

# Produkčný build
npm run build

# Offline file:// compatible build
npm run build:offline

# Všetky kontroly (tsc → test → check:rules → build → offline)
npm run verify

# Len testy
npm test

# Len typy
npx tsc --noEmit
```

---

## Ďalšie kroky (roadmapa)

| Fáza | Názov | Stav |
|------|-------|------|
| F0–F8 | Všetky kompletné | ✅ hotové |
| F9 | Dokumentácia, vydanie, odovzdanie | 🔄 toto release |
| F6 | Manuál a tlač | ⏳ ďalší |
| F7 | Architektúra a kvalita kódu (refaktor) | ⏳ najposlednejší, najrizikovejší |

---

*Vydané s vďakou občanom regiónu Rimavská Sobota, microDENT.sk a TeatrO.eu. Venované Radovi Ceglédymu — Celoživotný MVP.*
