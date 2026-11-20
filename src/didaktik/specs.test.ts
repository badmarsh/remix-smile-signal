import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIDAKTIK_SPECS,
  ZX_PALETTE,
  ZX_BORDER_COLORS,
  MG_DIN_PINOUT,
  LOAD_STEPS,
  type HardwareSpec,
  type DinPin,
} from './specs';

test('DIDAKTIK_SPECS has 6 hardware spec entries with required fields', () => {
  assert.equal(DIDAKTIK_SPECS.length, 6);
  for (const spec of DIDAKTIK_SPECS) {
    assert.ok(spec.label && spec.label.length > 0, 'Spec must have label');
    assert.ok(spec.value && spec.value.length > 0, 'Spec must have value');
    assert.ok(spec.detail && spec.detail.length > 0, 'Spec must have detail');
  }
});

test('DIDAKTIK_SPECS covers processor, memory, screen, sound, cassette, controls', () => {
  const labels = DIDAKTIK_SPECS.map((s) => s.label);
  assert.ok(labels.includes('Procesor'));
  assert.ok(labels.includes('Pamäť'));
  assert.ok(labels.includes('Obraz ULA'));
  assert.ok(labels.includes('Zvuk'));
  assert.ok(labels.includes('Kazeta (MG)'));
  assert.ok(labels.includes('Ovládanie'));
});

test('ZX_PALETTE has exactly 16 color entries (8 normal + 8 bright)', () => {
  const keys = Object.keys(ZX_PALETTE) as (keyof typeof ZX_PALETTE)[];
  assert.equal(keys.length, 16);
  // Normal colors 0-7
  assert.equal(ZX_PALETTE.black, '#000000');
  assert.equal(ZX_PALETTE.blue, '#0000C8');
  assert.equal(ZX_PALETTE.red, '#C80000');
  assert.equal(ZX_PALETTE.magenta, '#C800C8');
  assert.equal(ZX_PALETTE.green, '#00C800');
  assert.equal(ZX_PALETTE.cyan, '#00C8C8');
  assert.equal(ZX_PALETTE.yellow, '#C8C800');
  assert.equal(ZX_PALETTE.white, '#C8C8C8');
  // Bright colors 8-15
  assert.equal(ZX_PALETTE.brightBlack, '#000000');
  assert.equal(ZX_PALETTE.brightBlue, '#0022FF');
  assert.equal(ZX_PALETTE.brightRed, '#FF1E1E');
  assert.equal(ZX_PALETTE.brightMagenta, '#FF22FF');
  assert.equal(ZX_PALETTE.brightGreen, '#1AE62A');
  assert.equal(ZX_PALETTE.brightCyan, '#00E8E8');
  assert.equal(ZX_PALETTE.brightYellow, '#FFEE00');
  assert.equal(ZX_PALETTE.brightWhite, '#FFFFFF');
});

test('All ZX_PALETTE colors are valid 6-digit hex', () => {
  const hexRe = /^#[0-9A-Fa-f]{6}$/;
  for (const key of Object.keys(ZX_PALETTE) as (keyof typeof ZX_PALETTE)[]) {
    assert.ok(
      hexRe.test(ZX_PALETTE[key]),
        `Invalid hex color for ${key}: ${ZX_PALETTE[key]}`
    );
  }
});

test('ZX_BORDER_COLORS has exactly 8 border colors', () => {
  assert.equal(ZX_BORDER_COLORS.length, 8);
  // First 8 match normal palette colors
  assert.equal(ZX_BORDER_COLORS[0], ZX_PALETTE.black);
  assert.equal(ZX_BORDER_COLORS[1], ZX_PALETTE.blue);
  assert.equal(ZX_BORDER_COLORS[2], ZX_PALETTE.red);
});

test('MG_DIN_PINOUT has 5 pins with correct signals', () => {
  assert.equal(MG_DIN_PINOUT.length, 5);
  const pin1 = MG_DIN_PINOUT.find((p) => p.pin === 1);
  assert.ok(pin1);
  assert.equal(pin1.signal, 'MIC (Výstup)');
  const pin2 = MG_DIN_PINOUT.find((p) => p.pin === 2);
  assert.ok(pin2);
  assert.equal(pin2.signal, 'GND (Zem)');
  const pin3 = MG_DIN_PINOUT.find((p) => p.pin === 3);
  assert.ok(pin3);
  assert.equal(pin3.signal, 'EAR (Vstup)');
});

test('MG_DIN_PINOUT pin descriptions are non-empty Slovak', () => {
  for (const pin of MG_DIN_PINOUT) {
    assert.ok(pin.description && pin.description.length > 0, `Pin ${pin.pin} missing description`);
    assert.ok(typeof pin.pin === 'number' && pin.pin >= 1 && pin.pin <= 5);
  }
});

test('LOAD_STEPS has exactly 3 cassette loading steps', () => {
  assert.equal(LOAD_STEPS.length, 3);
  assert.equal(LOAD_STEPS[0].step, '01');
  assert.equal(LOAD_STEPS[1].step, '02');
  assert.equal(LOAD_STEPS[2].step, '03');
});

test('LOAD_STEPS steps have non-empty title and text', () => {
  for (const step of LOAD_STEPS) {
    assert.ok(step.title && step.title.length > 0, `Step ${step.step} missing title`);
    assert.ok(step.text && step.text.length > 0, `Step ${step.step} missing text`);
    assert.ok(step.step && step.step.length > 0, 'Step must have step number');
  }
});

test('LOAD_STEPS mentions key cassette loading actions', () => {
  const text = LOAD_STEPS.map((s) => s.title + ' ' + s.text).join(' ');
  assert.ok(text.includes('LOAD'), 'Should mention LOAD command');
  assert.ok(text.includes('MG'), 'Should mention MG port');
  assert.ok(text.includes('kazet'), 'Should mention cassette');
  assert.ok(text.includes('pilotného'), 'Should mention pilot tone');
});
