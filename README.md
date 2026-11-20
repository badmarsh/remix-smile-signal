# Zúbok a signálik — Didaktik M (Edícia Rado Ceglédy MVP)

Osobný vianočný darček pre **Rada Ceglédyho** od skupiny občanov regiónu **Rimavská Sobota**.
Webová retro arkáda v natívnom rozlíšení **256×192 px (ZX Spectrum / Didaktik M paleta)** spojená s generátorom reálnych kazetových súborov (`.BAS`, `.TAP`, `.WAV` vrátane **6912 B `SCREEN$`**), vizuálnym manuálom, tlačiteľnou plaketou a zberateľskou kartou 63×88 mm.

---

## Rýchle spustenie (vývoj a testy)

```bash
npm install
npm run dev      # lokálny server na http://localhost:3000
npm run lint     # TypeScript kontrola bez chýb
npm test         # deterministické unit testy (funguje aj vo Windows PowerShelli)
npm run build    # produkčný offline balík do priečinka dist/
```

---

## Offline verzia bez internetu (`file://`)

Po spustení `npm run build` sa vytvorí samostatný priečinok `dist/`.
Všetky písma (`DM Sans`, `JetBrains Mono`, `Pixelify Sans`) aj obrázky sú pribalené lokálne bez akýchkoľvek externých Google Fonts alebo sieťových požiadaviek. Stačí skopírovať celý priečinok `dist/` na USB kľúč a otvoriť `dist/index.html` v ľubovoľnom prehliadači aj bez internetu.

---

## Export kazety pre skutočný Didaktik M

V hre stlač **`T`** (alebo klikni na ikonu kazety) a otvorí sa **Kazeta & Didaktik sada**:

1. **Deluxe kazeta so `SCREEN$` (.TAP / .WAV)** — obsahuje 6 ROM blokov:
   - Loader (`ZUBOK&SIG`) → automaticky načíta `LOAD ""SCREEN$`
   - 6912 B obrazovka (`SCREEN$`, blok `ZUBOK`, adresa `16384`) s Radovým portrétom prevedeným do atribútovej ZX grafiky (ordered dithering + 8×8 attribute clash)
   - Samotná hra v Sinclair BASIC + záverečná obrazovka s knihou podpisov občanov (`DATA` riadky)
2. **Záložná jednobloková kazeta (.TAP / .WAV / .BAS)** — pôvodný maximálne kompatibilný 2-blokový variant bez loading screenu ako istá záloha.
3. **Časovanie pre skutočný stroj**:
   - Predvolený profil **`zx35` (3,50 MHz)** je odporúčaný pre reálny `LOAD ""` na Didaktiku M aj v emulátoroch (Fuse, ZEsarUX, UnrealSpeccy).
   - Profil **`didaktik40`** je označený ako experimentálny – na skutočný `LOAD` použi `zx35`.

### Nahrávanie na reálny Didaktik M cez 5-pin DIN (MG)
- Pripoj linkový výstup z PC/telefónu na **Pin 3 (MG vstup / EAR)** a **Pin 2 (GND)** 5-pinového DIN konektora Didaktiku M.
- Vypni v systéme všetky zvukové ekvalizéry a efekty, nastav hlasitosť na ~70–85 %.
- Na Didaktiku M zadaj **`LOAD ""`** (kláves `J` + `Symbol Shift` + `P` dvakrát, potom `ENTER`) a spusti prehrávanie `.WAV` (alebo tlačidlo **Prehrať Deluxe (MG)** priamo v štúdiu).

---

## Ovládanie v hre

- **Pohyb (1P)**: Šípky alebo `W A S D`
- **Streľba (1P)**: `Medzerník` (Zúbok = presný CEREC laser, Signálik = dvojitá Wi-Fi vlna na bubliny)
- **Prepnutie hrdinu (Zúbok / Signálik)**: `C`
- **Lokálny 2P Co-op (Zúbok + Signálik naraz)**: `2` (alebo tlačidlo `1P / 2P CO-OP`) — Hráč 1 (Zúbok) používa `W A S D` + `Medzerník` + `Ľavý Shift`, Hráč 2 (Signálik) používa `Šípky` + `Enter` / `Pravý Shift`
- **Saboteur úhyb (krátka nezraniteľnosť)**: `Shift` alebo `X`
- **Pauza / Reštart / Zvuk / Melodik AY**: `P` / `R` / `M` / `H` (4-skladbový Melodik AY Jukebox je dostupný aj v záložke **Zvuky & SFX**)
- **Vizuálny manuál a tlač**: `V`
- **Kazetové štúdio**: `T`
- **Tajná miestnosť 1270**: `K` na úvodnej obrazovke (8-znakový kód je vytlačený na plakete v kapitole 05 a na zberateľskej karte v kapitole 06)

### Priateľský režim pre nehráčov
- Po strate životov hra ponúkne **Pokračovať od dosiahnutého kola** (s 20 % penalizáciou skóre namiesto návratu na 1. kolo).
- Po 2. prehre v tom istom kole sa objaví retro výzva **`POKE 48621,5 – RADO REŽIM? A / N`**, ktorá pridá **+2 srdcia** (spolu 5) a spomalí strely nepriateľov o **30 %**.

---

## Prispôsobenie venovania, podpisov a fotky

- **Text venovania a Tajná miestnosť 1270**: uprav súbor `src/data/dedication.ts`.
- **Kniha podpisov občanov**: nahraď mená v poli `CITIZEN_SIGNATURES` v súbore `src/data/signatures.ts`. Zmeny sa automaticky premietnu do:
  - záverečných titulkov v 256×192 ceremónii odovzdania plakety,
  - Tajnej miestnosti 1270,
  - tlačiteľnej zberateľskej karty 63×88 mm (Kapitola 06 manuálu),
  - záverečnej obrazovky a `DATA` riadkov v Deluxe kazete pre Didaktik M.
- **Fotka Rada**: vlastnú fotku môžeš nahrať priamo v Kapitole 05 manuálu (alebo vymeniť predvolený portrét v `src/assets/images/`). Automaticky sa kvantizuje do ZX palety pre hru aj kazetový `SCREEN$`.

---

## Tlač manuálu, plakety, krabičky a zberateľskej karty

Vizuálny manuál (`V`) obsahuje tlačové hárky v mierke 1:1 mm (`@page A4` + `@media print`) s orezovými značkami:
- **Kapitola 02**: Štítok na kazetu (102 × 64 mm), J-Card prebal a stiahnuteľná vystrihovačka 3D krabičky (`.SVG`, 165 × 225 × 38 mm).
- **Kapitola 05**: Pamätná MVP plaketa s tajným kódom miestnosti 1270.
- **Kapitola 06**: Zberateľská karta **63 × 88 mm** v mierke 1:1 mm (predná strana s portrétom + zadná strana s podpisovými riadkami pre občanov a tajným kódom).
