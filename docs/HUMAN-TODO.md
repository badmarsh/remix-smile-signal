# HUMAN-TODO — Neoverené skutočnosti o skutočných osobách

Tento dokument sledovanie platí pre verziu v1.0.0-rc.1. Všetky položky nižšie vyžadujú ľudské overenie pred finálnym vydaním.

## 1. Mena občanov v kazetovom manuáli (src/data/signatures.ts)

Poznámka v kóde: `// FACT-CHECK: mená občanov (Marek Bakoš, Petra Novotná, Ján Gajdoš, atď.) sú neoverené — potvrdiť pred finálnym odovzdaním`

Pole `CITIZEN_SIGNATURES` obsahuje mená občanov regiónu Rimavská Sobota použitú v:
- vizuálnom manuáli (Kniha podpisov, kapitola 06)
- Deluxe kazete .TAP/.WAV (Sinclair BASIC DATA riadky)

**Akcia:** Potvrdiť, že tieto mena sú skutoční občanovia Regionu Rimavská Sobota, ktorí súhlasili s použitím mena v hre. Ak nie, nahradiť fiktívnymi menami.

## 2. Mena NPC občanov v hre (src/game/citizens.ts)

Poznámka v kóde: `// FACT-CHECK: mená občanov (Jana, Marek, Katarína, Tomáš, Peter, atď.) sú neoverené — potvrdiť pred finálnym odovzdaním`

Pole `STAGE_CITIZENS` obsahuje mená NPC postáv v každom štádiu hry.

**Akcia:** Potvrdiť, že tieto mena nie sú skutočné osoby bez ich súhlasu. Ak sú skutočné osoby, získať súhlas. Inak nahradiť fiktívnymi menami.

## 3. Osobné venovanie Rado Ceglédymu (src/data/dedication.ts)

Poznámka v kóde: `* TODO: Uprav texty nižšie podľa vlastného želania pred finálnym odovzdaním darčeka.`

`HANDOVER_DEDICATION_LINES` a `SECRET_ROOM_PARAGRAPHS` obsahujú osobné venovanie Radovi Ceglédymu.

**Akcia:** Toto je zámerná poznámka pre autora darčka — upraviť texty podľa vlastného želania pred finálnym odovzdaním. Nie je to chyba v kóde.

## 4. Skutočné firmy a organizácie

Následujúce sú spomínané v hre a manuáli. Sú označené ako reálne entity, ale nie sú overené:
- microDENT.sk (zubná klinika)
- TeatrO.eu (divadlo)
- Rimavská Sobota (mesto, región Banská Bystrica, SK)

**Akcia:** Overiť, že použitie týchto názvov je v poriadku (žiadne ochranné známky, žiadne neoprávnené použitie).

---

## Ako vyriešiť

1. Prečítať každú položku vyššie
2. Potvrdiť alebo poprieť skutočnosť
3. Odstrániť `// FACT-CHECK:` komentár z kódu po overení
4. Odstrániť položku z tohto dokumentu
5. Commitnutь s správou `fix: resolve FACT-CHECK — <popis>`

---

*Dokument vytorený počas F7 (Architektúra a kvalita kódu), Release Candidate v1.0.0-rc.1.*
