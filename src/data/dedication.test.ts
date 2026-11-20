import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HANDOVER_DEDICATION_LINES,
  SECRET_ROOM_PARAGRAPHS,
  SECRET_ROOM_TITLE,
  SECRET_CODE_SEED,
} from './dedication';

test('HANDOVER_DEDICATION_LINES has 4 non-empty Slovak dedication lines', () => {
  assert.equal(HANDOVER_DEDICATION_LINES.length, 4);
  for (const line of HANDOVER_DEDICATION_LINES) {
    assert.ok(line.length > 0, 'Dedication line must not be empty');
    assert.ok(line.length <= 60, `Dedication line too long: ${line}`);
  }
});

test('HANDOVER_DEDICATION_LINES mentions Rado Ceglédy and Rimavská Sobota', () => {
  const text = HANDOVER_DEDICATION_LINES.join(' ');
  assert.ok(text.includes('RADE CEGLÉDMU'), 'Should address Rado Ceglédy');
  assert.ok(
    text.includes('RIMAVSKEJ SOBOTY') || text.includes('GEMERA'),
    'Should mention region',
  );
  assert.ok(text.includes('CELOŽIVOTNÝ MVP'), 'Should mention lifelong MVP');
});

test('SECRET_CODE_SEED is a fixed deterministic 8-char-code source', () => {
  assert.equal(typeof SECRET_CODE_SEED, 'string');
  assert.ok(SECRET_CODE_SEED.length > 0);
  // Seed must be stable (deterministic — no random generation)
  assert.equal(
    SECRET_CODE_SEED,
    'RYMOS-ZUMBOTA-1270-RADO-CEGLEDY-MVP',
    'Secret code seed must be constant for reproducible 8-char code',
  );
});

test('SECRET_ROOM_TITLE mentions Tajná miestnosť 1270', () => {
  assert.ok(SECRET_ROOM_TITLE.includes('Tajná miestnosť 1270'));
  assert.ok(SECRET_ROOM_TITLE.includes('Rymos Zumbota'));
});

test('SECRET_ROOM_PARAGRAPHS has 6 non-empty Slovak paragraphs', () => {
  assert.equal(SECRET_ROOM_PARAGRAPHS.length, 6);
  for (const para of SECRET_ROOM_PARAGRAPHS) {
    assert.ok(para.length > 0, 'Paragraph must not be empty');
    assert.ok(para.length > 20, `Paragraph too short: ${para.slice(0, 40)}...`);
  }
});

test('SECRET_ROOM_PARAGRAPHS mentions key regional and personal references', () => {
  const text = SECRET_ROOM_PARAGRAPHS.join(' ');
  assert.ok(text.includes('Rado'), 'Should mention Rado');
  assert.ok(text.includes('Rimavská Sobota'), 'Should mention Rimavská Sobota');
  assert.ok(text.includes('TeatrO'), 'Should mention TeatrO');
  assert.ok(text.includes('CEREC'), 'Should mention CEREC');
  assert.ok(text.includes('Tichá noc'), 'Should mention Christmas carol');
  assert.ok(text.includes('Vianoce'), 'Should mention Christmas');
  assert.ok(text.includes('Kronike 1270'), 'Should mention Chronicle 1270');
  // microDENT is mentioned in HANDOVER_DEDICATION_LINES, not secret room paragraphs
});

test('HANDOVER_DEDICATION_LINES mentions microDENT and TeatrO', () => {
  const text = HANDOVER_DEDICATION_LINES.join(' ');
  assert.ok(text.includes('microDENT'), 'Handover should mention microDENT');
  assert.ok(text.includes('TeatrO'), 'Handover should mention TeatrO');
});

test('No paragraph contains English-only UI words', () => {
  const englishOnly = /^(The|And|Or|Start|Stop|Play|Pause|Menu|Home|Back|Close|Open|Save|Load|Settings|OK|Yes|No|Cancel|New|Game|Score|Level|Player|Enemy|Boss|Time|Wave|Stage)$/i;
  for (const para of SECRET_ROOM_PARAGRAPHS) {
    const words = para.split(/[\s.,;:!„"()–—-]+/);
    for (const word of words) {
      const clean = word.replace(/[„"()–—-]/g, '');
      if (clean.length > 0) {
        assert.ok(
          !englishOnly.test(clean),
            `Paragraph contains English-only word: "${clean}" in "${para.slice(0, 60)}..."`
        );
      }
    }
  }
});

test('Dedication lines contain no placeholder or TODO leftovers', () => {
  const allText = [...HANDOVER_DEDICATION_LINES, ...SECRET_ROOM_PARAGRAPHS].join(' ');
  assert.ok(!allText.includes('TODO'), 'No TODO leftovers in dedication text');
  assert.ok(!allText.includes('FIXME'), 'No FIXME leftovers in dedication text');
  assert.ok(!allText.includes('Lorem'), 'No lorem ipsum placeholder text');
});
