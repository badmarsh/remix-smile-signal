/**
 * Kniha podpisov občanov regiónu Rimavská Sobota + deterministický tajný kód pre Miestnosť 1270.
 * Objavuje sa v:
 *  a) záverečných titulkoch ceremónie v hre (256×192)
 *  b) tlačiteľnej zberateľskej karte 63×88 mm (Vizuálny manuál · Kapitola 06)
 *  c) Deluxe kazete .TAP/.WAV ako Sinclair BASIC DATA riadky (sanitizované cez sanitizeZxString)
 */

import { sanitizeZxString } from '../didaktik/basicSource';
import { SECRET_CODE_SEED } from './dedication';

// FACT-CHECK: mená občanov (Marek Bakoš, Petra Novotná, Ján Gajdoš, atď.) sú neoverené — potvrdiť pred finálnym odovzdaním
export const CITIZEN_SIGNATURES: string[] = [
  'Marek Bakoš · Rimavská Sobota (1987)',
  'Petra Novotná · Kurinec — stará škola',
  'Ján Gajdoš · Hatvaniho 12, RS',
  'Zuzana Kováčová · Hlavné námestie, pod orlojom',
  'Martin Csóka · Gemer-Malohont nedeľa',
  'Tomáš Balog · RSNET e-meeting 22:00',
  'Katarína Mazúrová · microDENT CEREC pionír',
  'Ladislao Szabó · TeatrO.eu optický signál',
  'Michal Tóth · Staré mesto, pamätník SNP',
  'Eva Berešová · Zelená voda, rímsy 1992',
  'David Jakubeci · Sobotská partia, didaktik M',
  'Ján Petrov · Revúca a okolie',
  'Mária Sikaová · Tornaľa, kazety z éry 8-bit',
  'Pavol Molnár · Hnúšťa, cesta cez Gemer',
  'Andrea Horváthová · Telgárt, sneh v decembri',
  'Ivan Farkaš · Poltár, lesy a Dizzy',
  'Gabriela Majeričová · Fiľakovo, hrad nad mestom',
  'Štefan Varga · Rimava, mliekareň 1985',
  'Alžbeta Kissová · Brodské, hranice éry Didaktik',
  'A všetci občania Gemeru a Malohontu za Rada!',
];

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a deterministic 8-character secret code (uppercase alphanumeric, no ambiguous 0/O/1/I)
 * from a seed string. Printed on the MVP Plaque & Collector Card and unlocks Secret Room 1270.
 */
export function deriveSecretCode(seed: string = SECRET_CODE_SEED): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b1;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (ch + i * 17), 0x85ebca6b) >>> 0;
  }

  let code = '';
  let state = (h1 ^ h2) >>> 0;
  for (let i = 0; i < 8; i++) {
    state = (Math.imul(state, 1664525) + 1013904223 + i * 97) >>> 0;
    const idx = (state >>> 16) % CODE_ALPHABET.length;
    code += CODE_ALPHABET[idx];
  }
  return code;
}

export function normalizeSecretCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validateSecretCode(input: string, seed: string = SECRET_CODE_SEED): boolean {
  const normalized = normalizeSecretCode(input);
  if (normalized.length !== 8) return false;
  return normalized === deriveSecretCode(seed);
}

/**
 * Formats citizen signatures as safe Sinclair BASIC lines (sanitized ASCII, no diacritics)
 * including an executable 9000-9030 ending-screen reader + 9100+ DATA table
 * for appending to the Deluxe cassette without touching buildTapFile.
 */
export function formatSignaturesAsBasicData(
  signatures: readonly string[] = CITIZEN_SIGNATURES,
  startLine = 9100
): string[] {
  const lines: string[] = [];
  if (startLine >= 9100) {
    lines.push(
      `9000 RESTORE ${startLine}: CLS: BORDER 1: PRINT AT 1,3; INK 6;"KNIHA PODPISOV OBCANOV RS": LET R=3`
    );
    lines.push('9010 READ N$: IF N$="END" THEN PAUSE 0: GOTO 30');
    lines.push('9020 PRINT AT R,2; INK 7;N$: LET R=R+1: IF R>20 THEN PAUSE 0: CLS: LET R=3');
    lines.push('9030 GOTO 9010');
  }

  let lineNo = startLine;
  lines.push(`${lineNo} REM KNIHA PODPISOV OBCANOV RS`);
  lineNo += 10;

  const cleanNames = signatures
    .map((s) => sanitizeZxString(s, 28))
    .filter((s) => s.length > 0);

  for (let i = 0; i < cleanNames.length; i += 2) {
    const pair = cleanNames
      .slice(i, i + 2)
      .map((name) => `"${name}"`)
      .join(',');
    lines.push(`${lineNo} DATA ${pair}`);
    lineNo += 10;
  }

  lines.push(`${lineNo} DATA "END"`);
  return lines;
}
