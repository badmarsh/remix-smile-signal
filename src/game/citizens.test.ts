import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CITIZEN_SIGNATURES,
  deriveSecretCode,
  formatSignaturesAsBasicData,
  validateSecretCode,
} from '../data/signatures';
import { DEFAULT_TAPE_CONFIG, generateSinclairBasicLines } from '../didaktik/basicSource';
import { buildDeluxeTapFile, parseTap, tokenizeBasicLine } from '../didaktik/tapeBuilder';
import {
  CITIZEN_SPEECH_DURATION,
  CITIZEN_TRIGGER_RADIUS,
  createCitizenSpeechState,
  getCitizensForStage,
  STAGE_CITIZENS,
  updateCitizenSpeech,
} from './citizens';
import { isWallTile, isWaterTile, STAGES, TILE_SIZE } from './levels';

test('every stage has 1-2 NPC citizens on safe open tiles with quotes <= 56 chars', () => {
  for (let s = 0; s < STAGES.length; s++) {
    const list = getCitizensForStage(s);
    assert.ok(list.length >= 1 && list.length <= 2, `Stage ${s} should have 1-2 citizens`);
    const stage = STAGES[s];
    for (const npc of list) {
      assert.ok(
        npc.quote.length > 0 && npc.quote.length <= 56,
        `Citizen ${npc.id} quote exceeds 56 chars: ${npc.quote.length}`
      );
      const col = Math.floor(npc.x / TILE_SIZE);
      const row = Math.floor(npc.y / TILE_SIZE);
      assert.equal(isWallTile(stage, col, row, false), false, `Citizen ${npc.id} not inside wall/door`);
      assert.equal(isWaterTile(stage, col, row), false, `Citizen ${npc.id} not in water`);
    }
  }
});

test('NPC citizen speech triggers only within proximity radius and hides after 3.0 seconds', () => {
  const npc = STAGE_CITIZENS[0];
  const state = createCitizenSpeechState();

  // Far away -> does not trigger
  updateCitizenSpeech(npc.stageIndex, npc.x + CITIZEN_TRIGGER_RADIUS + 20, npc.y, 0.1, state);
  assert.equal(state.activeCitizenId, null);
  assert.equal(state.timer, 0);

  // Within trigger radius -> activates for 3.0s
  updateCitizenSpeech(npc.stageIndex, npc.x + 4, npc.y, 0.016, state);
  assert.equal(state.activeCitizenId, npc.id);
  assert.equal(state.activeQuote, npc.quote);
  assert.equal(state.timer, CITIZEN_SPEECH_DURATION);

  // Still visible at 2.5s
  updateCitizenSpeech(npc.stageIndex, npc.x + 40, npc.y, 2.5, state);
  assert.equal(state.activeCitizenId, npc.id);
  assert.ok(state.timer > 0);

  // Disappears after remaining 0.6s (total > 3.0s)
  updateCitizenSpeech(npc.stageIndex, npc.x + 40, npc.y, 0.6, state);
  assert.equal(state.activeCitizenId, null);
  assert.equal(state.activeQuote, '');
  assert.equal(state.timer, 0);
});

test('deriveSecretCode is deterministic 8-char code and validateSecretCode accepts/rejects properly', () => {
  const codeA = deriveSecretCode('TEST-SEED-1270');
  const codeB = deriveSecretCode('TEST-SEED-1270');
  assert.equal(codeA, codeB);
  assert.equal(codeA.length, 8);
  assert.match(codeA, /^[A-Z0-9]{8}$/);

  const defaultCode = deriveSecretCode();
  assert.equal(validateSecretCode(defaultCode), true);
  assert.equal(validateSecretCode(`  ${defaultCode.toLowerCase().slice(0, 4)}-${defaultCode.slice(4)} `), true);
  assert.equal(validateSecretCode('WRONG123'), false);
  assert.equal(validateSecretCode('SHORT'), false);
});

test('formatSignaturesAsBasicData produces executable 9000-9030 reader + DATA lines for Deluxe .TAP without altering base BASIC', () => {
  const dataLines = formatSignaturesAsBasicData(CITIZEN_SIGNATURES);
  assert.ok(dataLines.length >= 7);
  assert.ok(dataLines.some((l) => l.startsWith('9000 RESTORE 9100')));
  assert.ok(dataLines.some((l) => l.startsWith('9010 READ N$')));

  for (const line of dataLines) {
    // Must contain only safe ASCII chars
    assert.match(line, /^[\x20-\x7e]+$/, `Non-ASCII char leaked into BASIC line: ${line}`);
    const tokenized = tokenizeBasicLine(line);
    assert.ok(tokenized.length > 4);
  }

  // Original generateSinclairBasicLines stays untouched
  const baseLines = generateSinclairBasicLines(DEFAULT_TAPE_CONFIG);
  assert.ok(baseLines.includes('795 PAUSE 0: GOTO 30'));

  // Embed cleanly in buildDeluxeTapFile, routes 795 -> GOTO 9000, and validates all 6 block checksums
  const blankScreen = new Uint8Array(6912);
  const deluxe = buildDeluxeTapFile(DEFAULT_TAPE_CONFIG, blankScreen, dataLines);
  assert.ok(deluxe.gameLines.includes('795 PAUSE 120: GOTO 9000'));
  const parsed = parseTap(deluxe.tapBytes);
  assert.equal(parsed.length, 6);
  for (const blk of parsed) {
    assert.equal(blk.checksumValid, true);
  }
});

test('all stage openingChronicle and relic chronicleNote texts are <= 56 chars and free of ARTFAKT typo', () => {
  for (const stage of STAGES) {
    assert.ok(
      stage.openingChronicle.length <= 56,
      `Stage ${stage.index} openingChronicle > 56 chars: ${stage.openingChronicle}`
    );
    assert.ok(
      stage.relic.chronicleNote.length <= 56,
      `Stage ${stage.index} relic.chronicleNote > 56 chars: ${stage.relic.chronicleNote}`
    );
    assert.equal(stage.relic.chronicleNote.includes('ARTFAKT'), false);
    assert.equal(stage.openingChronicle.includes('ARTFAKT'), false);
  }
});
