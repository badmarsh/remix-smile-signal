/**
 * Generates authentic, 100% syntax-valid Sinclair BASIC source code
 * for the Didaktik M / ZX Spectrum 48K native cassette version of
 * "SMILE & SIGNAL" (Christmas Edition — microDENT.sk & TeatrO.eu).
 *
 * Uses standard 48K Sinclair BASIC keywords, POKE USR UDGs (a-g),
 * INKEY$ reading (supporting Q/A/O/P, 5/6/7/8 Didaktik M arrow keys, and SPACE),
 * and 1-bit BEEP sound effects + Christmas melody.
 */

export interface BasicProgramConfig {
  dedication: string;
  recipient: string;
  /** Optional first 6 UDG 8-byte bitmaps (slots a-f) edited in the Pixel Art UDG Studio */
  udgBytes6?: number[][];
}

export const DEFAULT_TAPE_CONFIG: BasicProgramConfig = {
  dedication: '1. MIESTO MVP OD OBCANOV RS',
  recipient: 'RADO CEGLEDY · MICRODENT+TEATRO',
};

const DEFAULT_GAME_UDGS: number[][] = [
  [24, 60, 90, 126, 60, 24, 60, 102],
  [60, 126, 110, 126, 126, 102, 102, 66],
  [24, 60, 102, 219, 219, 102, 60, 24],
  [66, 126, 219, 255, 255, 126, 90, 129],
  [129, 66, 60, 126, 219, 126, 66, 129],
  [16, 56, 124, 56, 124, 254, 16, 56],
];

/**
 * Sanitizes text to safe 7-bit uppercase ZX Spectrum ASCII (no quotes or control chars)
 * so Sinclair BASIC strings never break syntax.
 */
export function sanitizeZxString(input: string, maxLen = 30): string {
  const asciiMap: Record<string, string> = {
    'Á': 'A', 'Ä': 'A', 'Č': 'C', 'Ď': 'D', 'É': 'E', 'Í': 'I',
    'Ĺ': 'L', 'Ľ': 'L', 'Ň': 'N', 'Ó': 'O', 'Ô': 'O', 'Ŕ': 'R',
    'Š': 'S', 'Ť': 'T', 'Ú': 'U', 'Ý': 'Y', 'Ž': 'Z',
    'á': 'A', 'ä': 'A', 'č': 'C', 'ď': 'D', 'é': 'E', 'í': 'I',
    'ĺ': 'L', 'ľ': 'L', 'ň': 'N', 'ó': 'O', 'ô': 'O', 'ŕ': 'R',
    'š': 'S', 'ť': 'T', 'ú': 'U', 'ý': 'Y', 'ž': 'Z',
  };

  let out = '';
  for (const ch of input) {
    const mapped = asciiMap[ch] ?? ch.toUpperCase();
    const code = mapped.charCodeAt(0);
    // Allow printable ZX ASCII excluding double quote (34)
    if (code >= 32 && code <= 122 && code !== 34) {
      out += mapped;
    }
  }
  const trimmed = out.trim();
  return (trimmed || 'VESELE VIANOCE!').slice(0, maxLen);
}

/**
 * Produces the exact Sinclair BASIC program lines that compile directly
 * into a runnable .TAP and .WAV magnetic cassette image for Didaktik M.
 */
export function generateSinclairBasicLines(config: BasicProgramConfig): string[] {
  const dedication = sanitizeZxString(config.dedication, 30);
  const recipient = sanitizeZxString(config.recipient, 28);
  const udgs =
    config.udgBytes6 && config.udgBytes6.length === 6 ? config.udgBytes6 : DEFAULT_GAME_UDGS;

  return [
    '10 REM ZUBOK A SIGNALIK - DIDAKTIK M',
    '20 REM VENOVANE RADOVI CEGLEDYMU - MVP',
    '30 BORDER 0: PAPER 0: INK 7: BRIGHT 1: CLS',
    '40 GOSUB 800',
    '50 PRINT AT 1,2; INK 5;"*** ZUBOK A SIGNALIK 1990 ***"',
    `60 PRINT AT 3,1; INK 6;"${recipient}"`,
    `70 PRINT AT 5,1; INK 4;"${dedication}"`,
    '80 PRINT AT 8,2; INK 7;"1. DEJSTVO: KLINIKA MICRODENT"',
    '90 PRINT AT 9,2; INK 5;"VYCISTI CESTU PRE PLAKETU MVP"',
    '100 PRINT AT 11,2; INK 7;"2. DEJSTVO: OPTIKA TEATRO.EU"',
    '110 PRINT AT 12,2; INK 6;"DORUC 1. MIESTO RADOVI DO RS!"',
    '120 PRINT AT 15,2; INK 7;"KLAVESY: O/P/Q/A ALEBO SIPKY"',
    '130 PRINT AT 17,3; INK 2; FLASH 1;"STLAC LUBOVOLNU KLAVESU"',
    '140 BEEP .08,12: BEEP .08,16: BEEP .12,19',
    '150 IF INKEY$="" THEN GOTO 150',
    '160 LET SC=0: LET LV=3: LET ST=1',
    '200 REM --- PRIPRAVA KOLA ---',
    '210 BORDER (ST=1)*1+(ST=2)*0: PAPER 0: INK 7: CLS',
    '220 LET PX=15: LET PY=12: LET TG=6',
    '230 LET EX=4: LET EY=6: LET DX=1: LET DY=1',
    '240 LET FX=26: LET FY=16: LET UX=-1',
    '250 DIM X(6): DIM Y(6): DIM D(6)',
    '260 FOR I=1 TO 6',
    '270 LET X(I)=3+INT (RND*25): LET Y(I)=4+INT (RND*15): LET D(I)=0',
    '280 NEXT I',
    '290 PRINT AT 0,0; INK 6;"SK:";SC;"  ZV:";LV;"  KOLO:";ST;" ";("MICRODENT" AND ST=1);("TEATRO RS" AND ST=2)',
    '300 FOR I=1 TO 6',
    '310 IF D(I)=0 THEN PRINT AT Y(I),X(I); INK (5 AND ST=1)+(6 AND ST=2); CHR$ (145+(ST=2))',
    '320 NEXT I',
    '330 REM --- HLAVNA SLUCKA HRY ---',
    '340 PRINT AT PY,PX; INK 7; CHR$ 144',
    '350 PRINT AT EY,EX; INK 2; CHR$ 147',
    '360 PRINT AT FY,FX; INK 3; CHR$ 148',
    '370 LET K$=INKEY$',
    '380 LET OX=PX: LET OY=PY',
    '390 IF (K$="o" OR K$="O" OR K$=CHR$ 8) AND PX>1 THEN LET PX=PX-1',
    '400 IF (K$="p" OR K$="P" OR K$=CHR$ 9) AND PX<30 THEN LET PX=PX+1',
    '410 IF (K$="q" OR K$="Q" OR K$=CHR$ 11) AND PY>2 THEN LET PY=PY-1',
    '420 IF (K$="a" OR K$="A" OR K$=CHR$ 10) AND PY<20 THEN LET PY=PY+1',
    '430 IF OX<>PX OR OY<>PY THEN PRINT AT OY,OX;" "',
    '440 PRINT AT EY,EX;" ": PRINT AT FY,FX;" "',
    '450 LET EX=EX+DX: LET EY=EY+DY',
    '460 IF EX<=1 OR EX>=30 THEN LET DX=-DX',
    '470 IF EY<=2 OR EY>=20 THEN LET DY=-DY',
    '480 LET FX=FX+UX: IF FX<=1 OR FX>=30 THEN LET UX=-UX',
    '490 FOR I=1 TO 6',
    '500 IF D(I)=0 AND PX=X(I) AND PY=Y(I) THEN LET D(I)=1: LET TG=TG-1: LET SC=SC+100: BEEP .04,19: BEEP .05,24',
    '510 NEXT I',
    '520 PRINT AT 0,3; INK 6;SC;"  ZV:";LV;"  ZOST:";TG;" "',
    '530 IF (PX=EX AND PY=EY) OR (PX=FX AND PY=FY) THEN GOTO 650',
    '540 IF TG<=0 THEN GOTO 700',
    '550 PAUSE 2',
    '560 GOTO 340',
    '650 REM --- ZASAH HRACA ---',
    '660 BORDER 2: BEEP .18,-8: BORDER 0',
    '670 LET LV=LV-1: LET PX=15: LET PY=12',
    '680 IF LV>0 THEN GOTO 340',
    '690 CLS: PRINT AT 9,9; INK 2;"KONIEC HRY!": PRINT AT 11,8; INK 6;"VYSLEDNE SKORE: ";SC: PRINT AT 14,3; INK 7;"STLAC KLAVESU PRE NOVU HRU": PAUSE 0: GOTO 30',
    '700 REM --- KOLO SPLNENE ---',
    '710 BORDER 4: BEEP .1,12: BEEP .1,16: BEEP .1,19: BEEP .2,24: BORDER 0',
    '720 IF ST=1 THEN LET ST=2: CLS: PRINT AT 10,2; INK 5;"MICRODENT CESTA VOLNA!": PRINT AT 12,2; INK 6;"DALEJ: TEATRO -> PLAKETA MVP": PAUSE 100: GOTO 200',
    '730 CLS: BORDER 1: PRINT AT 4,2; INK 6;"*** 1. MIESTO: CELOZIVOTNY MVP ***"',
    `740 PRINT AT 7,2; INK 5;"${recipient}"`,
    `750 PRINT AT 9,1; INK 4;"${dedication}"`,
    '760 PRINT AT 12,3; INK 7;"S UCTOU OD OBCANOV REGIONU RS"',
    '770 PRINT AT 14,6; INK 6;"VYSLEDNE SKORE: ";SC',
    '780 PRINT AT 17,6; INK 4; CHR$ 149;" "; CHR$ 149;" "; CHR$ 149;"  "; CHR$ 145;"  "; CHR$ 146;"  "; CHR$ 149',
    '790 BEEP .2,16: BEEP .2,16: BEEP .4,16: BEEP .2,16: BEEP .2,16: BEEP .4,16: BEEP .2,16: BEEP .2,19: BEEP .2,12: BEEP .2,14: BEEP .5,16',
    '795 PAUSE 0: GOTO 30',
    '800 REM --- NACITANIE UDG GRAFIKY ---',
    '810 RESTORE 900',
    '820 FOR N=0 TO 47: READ B: POKE USR "a"+N,B: NEXT N',
    '830 RETURN',
    '900 REM UDG A=HRDINA, B=ZUBOK, C=OPTIKA, D=PLAK, E=SUM, F=STROMCEK',
    `910 DATA ${udgs[0].join(',')}`,
    `920 DATA ${udgs[1].join(',')}`,
    `930 DATA ${udgs[2].join(',')}`,
    `940 DATA ${udgs[3].join(',')}`,
    `950 DATA ${udgs[4].join(',')}`,
    `960 DATA ${udgs[5].join(',')}`,
  ];
}

export function generateSinclairBasicText(config: BasicProgramConfig): string {
  return generateSinclairBasicLines(config).join('\n');
}
