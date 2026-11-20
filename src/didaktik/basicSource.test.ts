import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TAPE_CONFIG,
  generateSinclairBasicLines,
  generateSinclairBasicText,
  sanitizeZxString,
} from './basicSource';

test('sanitizeZxString strips Slovak accents into ASCII equivalents', () => {
  assert.equal(sanitizeZxString('Rado Ceglédy'), 'RADO CEGLEDY');
  assert.equal(sanitizeZxString('Rimavská Sobota'), 'RIMAVSKA SOBOTA');
  assert.equal(sanitizeZxString('TeatrO.eu'), 'TEATRO.EU');
  assert.equal(sanitizeZxString('microDENT.sk'), 'MICRODENT.SK');
});

test('sanitizeZxString removes double quotes to avoid BASIC string breakage', () => {
  assert.equal(sanitizeZxString('Veselé "Vianoce"'), 'VESELE VIANOCE');
  assert.equal(sanitizeZxString('"QUOTED"'), 'QUOTED');
});

test('sanitizeZxString falls back to default for empty/whitespace-only input', () => {
  assert.equal(sanitizeZxString(''), 'VESELE VIANOCE!');
  assert.equal(sanitizeZxString('   '), 'VESELE VIANOCE!');
  assert.equal(sanitizeZxString('\t\n'), 'VESELE VIANOCE!');
});

test('sanitizeZxString respects max length and trims', () => {
  assert.equal(sanitizeZxString('A'.repeat(50), 10), 'AAAAAAAAAA');
  assert.equal(sanitizeZxString('  padded  ', 30), 'PADDED');
});

test('DEFAULT_TAPE_CONFIG has expected dedication and recipient', () => {
  assert.equal(DEFAULT_TAPE_CONFIG.dedication, '1. MIESTO MVP OD OBCANOV RS');
  assert.equal(DEFAULT_TAPE_CONFIG.recipient, 'RADO CEGLEDY · MICRODENT+TEATRO');
});

test('generateSinclairBasicLines produces numbered lines 10 through 960', () => {
  const lines = generateSinclairBasicLines(DEFAULT_TAPE_CONFIG);
  const nums = lines.map((l) => parseInt(l, 10));
  assert.equal(nums[0], 10);
  assert.equal(nums[nums.length - 1], 960);
  // All lines should start with a number
  for (const line of lines) {
    assert.match(line, /^\d+\s/);
  }
});

test('generateSinclairBasicLines includes dedication and recipient text', () => {
  const lines = generateSinclairBasicLines(DEFAULT_TAPE_CONFIG);
  const text = lines.join('\n');
  assert.ok(text.includes('RADO CEGLEDY'));
  // Recipient is sanitized (· stripped) and truncated to 28 ZX chars
  assert.ok(text.includes('MICRODENT+TEAT'));
  assert.ok(text.includes('1. MIESTO MVP OD OBCANOV RS'));
});

test('generateSinclairBasicLines uses sanitized (accent-stripped) text', () => {
  const config = {
    dedication: 'Šťastné Vianoce, Rado!',
    recipient: 'Rado Ceglédy · Rimavská Sobota',
  };
  const lines = generateSinclairBasicLines(config);
  const text = lines.join('\n');
  assert.ok(text.includes('STASTNE VIANOCE, RADO!'));
  assert.ok(text.includes('RADO CEGLEDY'));
  // Recipient truncated to 28 ZX chars after · stripped: RADO CEGLEDY  RIMAVSKA
  assert.ok(text.includes('RIMAVSKA'));
  // No accented chars should remain
  assert.equal(text.match(/[áäčďéíĺľňóôŕšťúýž]/), null);
  assert.equal(text.match(/[ÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]/), null);
});

test('generateSinclairBasicLines contains core game mechanics keywords', () => {
  const lines = generateSinclairBasicLines(DEFAULT_TAPE_CONFIG);
  const text = lines.join('\n');
  assert.ok(text.includes('BORDER'));
  assert.ok(text.includes('PAPER'));
  assert.ok(text.includes('INK'));
  assert.ok(text.includes('CLS'));
  assert.ok(text.includes('PRINT'));
  assert.ok(text.includes('BEEP'));
  assert.ok(text.includes('INKEY$'));
  assert.ok(text.includes('RND'));
  assert.ok(text.includes('GOTO'));
  assert.ok(text.includes('GOSUB'));
  assert.ok(text.includes('REM'));
});

test('generateSinclairBasicLines includes two-stage progression (Microdent → Teatro)', () => {
  const lines = generateSinclairBasicLines(DEFAULT_TAPE_CONFIG);
  const text = lines.join('\n');
  assert.ok(text.includes('1. DEJSTVO: KLINIKA MICRODENT'));
  assert.ok(text.includes('2. DEJSTVO: OPTIKA TEATRO.EU'));
  assert.ok(text.includes('MICRODENT CESTA VOLNA'));
  assert.ok(text.includes('TEATRO -> PLAKETA MVP'));
});

test('generateSinclairBasicLines includes MVP victory ending with Rado dedication', () => {
  const lines = generateSinclairBasicLines(DEFAULT_TAPE_CONFIG);
  const text = lines.join('\n');
  assert.ok(text.includes('1. MIESTO: CELOZIVOTNY MVP'));
  assert.ok(text.includes('S UCTOU OD OBCANOV REGIONU RS'));
  assert.ok(text.includes('VYSLEDNE SKORE'));
});

test('generateSinclairBasicLines uses DEFAULT_GAME_UDGS when no custom UDGs provided', () => {
  const lines = generateSinclairBasicLines(DEFAULT_TAPE_CONFIG);
  // Line 910-960 are DATA lines for UDG bytes (6 lines, 8 numbers each)
  const expected = [
    '910 DATA 24,60,90,126,60,24,60,102',
    '920 DATA 60,126,110,126,126,102,102,66',
    '930 DATA 24,60,102,219,219,102,60,24',
    '940 DATA 66,126,219,255,255,126,90,129',
    '950 DATA 129,66,60,126,219,126,66,129',
    '960 DATA 16,56,124,56,124,254,16,56',
  ];
  for (const exp of expected) {
    assert.ok(lines.includes(exp), `missing line: ${exp}`);
  }
});

test('generateSinclairBasicLines uses custom UDGs when provided (6 lines of 8 bytes)', () => {
  const customUDGs = [
    [1, 2, 3, 4, 5, 6, 7, 8],
    [8, 7, 6, 5, 4, 3, 2, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [255, 255, 255, 255, 255, 255, 255, 255],
    [10, 20, 30, 40, 50, 60, 70, 80],
    [80, 70, 60, 50, 40, 30, 20, 10],
  ];
  const config = { ...DEFAULT_TAPE_CONFIG, udgBytes6: customUDGs };
  const lines = generateSinclairBasicLines(config);
  assert.ok(lines.some((l) => l.startsWith('910 DATA 1,2,3,4,5,6,7,8')));
  assert.ok(lines.some((l) => l.startsWith('920 DATA 8,7,6,5,4,3,2,1')));
  assert.ok(lines.some((l) => l.startsWith('960 DATA 80,70,60,50,40,30,20,10')));
});

test('generateSinclairBasicLines falls back to DEFAULT_GAME_UDGS when custom UDGs incomplete', () => {
  const config = { ...DEFAULT_TAPE_CONFIG, udgBytes6: [[1, 2, 3]] };
  const lines = generateSinclairBasicLines(config);
  const text = lines.join('\n');
  // Should use default UDGs (line 910 should have default first UDG, not custom)
  assert.ok(text.includes('910 DATA 24,60,90,126,60,24,60,102'));
});

test('generateSinclairBasicText joins lines with newlines', () => {
  const text = generateSinclairBasicText(DEFAULT_TAPE_CONFIG);
  assert.equal(text.split('\n')[0], '10 REM ZUBOK A SIGNALIK - DIDAKTIK M');
  assert.equal(text.split('\n').pop(), '960 DATA 16,56,124,56,124,254,16,56');
  assert.ok(text.includes('\n'));
  assert.equal(text.split('\n').length, generateSinclairBasicLines(DEFAULT_TAPE_CONFIG).length);
});
