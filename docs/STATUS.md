# docs/STATUS.md — Release Candidate v1.0.0-rc.1

Stav: **F3 — Hrateľnosť, balans, onboarding** (priebežne aktualizované po každej fáze)
Aktualizované: 20. 11. 2026
HEAD: 9973745 (main + F0, F1 merged)

## Baseline (F0.1 — DOKONČENÉ)

| Kontrola | Príkaz | Výsledok | Dôkaz |
|----------|--------|----------|-------|
| Inštalácia | `npm install --legacy-peer-deps` | OK | 69 balíkov, 0 zraniteľností |
| Testy | `npm test` | 84/84 pass, 0 fail | `scripts/run-tests.mjs` |
| Typy | `npx tsc --noEmit` | 3 chyby (App.tsx:576, P0-2) | výstup tsc |
| Build | `npm run build` | OK, ~779 ms | JS 470 kB / 137 kB gzip, dist ~7,2 MB |
| `--legacy-peer-deps` | nutný? | Áno (peer konflikt) | viz F0.1 |

## Fázy a brány

| Fáza | Názov | Stav | Brána splnená? | Commity | Dôkaz |
|------|-------|------|----------------|---------|-------|
| F0 | Základ a poistka | ✅ hotové | ✅ | PR #4 (rc/f0-baseline) | verify.mjs, check-rules.mjs, ci.yml, golden-baseline.json |
| F1 | Kritické chyby (P0) | ✅ hotové | ✅ | PR #5 (rc/f1-critical-fixes) | tsc=0, bot tests, reachability, verify green |
| F2 | Obsah a slovenčina | ⏳ na radu | ❌ | — | — |
| F3 | Hrateľnosť, balans, onboarding | ⏳ | ❌ | — | — |
| F4 | Prezentácia, mobil, prístupnosť | ⏳ | ❌ | — | — |
| F5 | Kazety a Didaktik | ⏳ | ❌ | — | — |
| F6 | Manuál a tlač | ⏳ | ❌ | — | — |
| F7 | Architektúra a kvalita kódu | ⏳ | ❌ | — | — |
| F8 | Testy a QA | ⏳ | ❌ | — | — |
| F9 | Dokumentácia, vydanie, odovzdanie | ⏳ | ❌ | — | — |

## Priorita (ak nie je čas na všetko)

F0 → F1 → F3 → F4 → F5 → F2 → F8 → F9 → F6 → F7 (refaktor posledný, najrizikovejší).

## Poznámky

- 3 TS chyby v App.tsx:576 sú P0-2 (mŕtva vetva title/handover/victory). Pravidlo 11 zmenené: cieľ je `tsc --noEmit = 0`.
- P0-1: Stage 7 (Servisný úraz) nie je dosiahnuteľný v reálnom toku, len cez testy.
- P0-3: `.github/` teraz existuje (PR #4), CI pravidlá vynútené cez GitHub Actions.
- Hygiena: `.aistudio/`, `.antigravity/`, `.superpowers/` odstránené z gite (PR #4).
