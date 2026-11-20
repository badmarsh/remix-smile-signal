import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWorld,
  distPointToSegment,
  evaluateCbctBeamSegment,
  evaluateUvBeamState,
  loadStage,
  stepWorld,
} from './engine';
import { GRID_COLS, GRID_ROWS, isWallTile, isWaterTile, STAGES, TILE_SIZE } from './levels';
import { InputState } from './types';

const IDLE: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  fireJustPressed: false,
  fireHeld: false,
  dashJustPressed: false,
  swapHeroJustPressed: false,
};

test('all 7 stages have valid 32x24 grids and safe spawns away from walls, water, locked doors, and active hazards', () => {
  for (const stage of STAGES) {
    assert.equal(stage.grid.length, GRID_ROWS, `Stage ${stage.index} must have 24 rows`);
    for (let r = 0; r < GRID_ROWS; r++) {
      assert.equal(stage.grid[r].length, GRID_COLS, `Stage ${stage.index} row ${r} must be 32 cols`);
    }

    const col = Math.floor(stage.playerStart.x / TILE_SIZE);
    const row = Math.floor(stage.playerStart.y / TILE_SIZE);
    assert.equal(isWallTile(stage, col, row, false), false, `Stage ${stage.index} spawn not on wall/door`);
    assert.equal(isWaterTile(stage, col, row), false, `Stage ${stage.index} spawn not in water`);

    if (stage.hazards) {
      for (const hz of stage.hazards) {
        if (hz.kind === 'uv_beam') {
          const d = distPointToSegment(
            stage.playerStart.x,
            stage.playerStart.y,
            hz.x1,
            hz.y1,
            hz.x2,
            hz.y2
          );
          assert.ok(d > 20, `Stage ${stage.index} player spawn must be clear of UV beam`);
        } else if (hz.kind === 'cbct_beam') {
          const seg = evaluateCbctBeamSegment(hz, 0);
          const d = distPointToSegment(
            stage.playerStart.x,
            stage.playerStart.y,
            seg.x1,
            seg.y1,
            seg.x2,
            seg.y2
          );
          assert.ok(d > 20, `Stage ${stage.index} player spawn must be clear of CBCT beam at t=0`);
        }
      }
    }
  }
});

test('Stage 1 UV beams cycle off -> telegraph -> on and hurt player only outside i-frames and Saboteur dash', () => {
  const world = createWorld('playing');
  loadStage(world, 0, true);
  world.enemies = [];

  const uv = world.stage.hazards?.find((h) => h.kind === 'uv_beam');
  assert.ok(uv && uv.kind === 'uv_beam');
  assert.equal(evaluateUvBeamState(uv, 0.5), 'off');
  assert.equal(evaluateUvBeamState(uv, 1.7), 'telegraph');
  assert.equal(evaluateUvBeamState(uv, 2.5), 'on');

  // Position player directly on the beam while it is ON
  world.elapsedSec = 2.5;
  world.player.x = uv.x1;
  world.player.y = (uv.y1 + uv.y2) / 2;

  // 1) Protected by Saboteur dash i-frames
  world.player.invulnTimer = 0;
  world.player.dashTimer = 0.12;
  const hpBeforeDash = world.player.hp;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.player.hp, hpBeforeDash, 'Saboteur dash protects player from UV beam');

  // 2) Vulnerable once i-frames and dash expire
  world.player.invulnTimer = 0;
  world.player.dashTimer = 0;
  world.player.x = uv.x1;
  world.player.y = (uv.y1 + uv.y2) / 2;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.player.hp, hpBeforeDash - 1, 'Active UV beam hurts player outside i-frames');
});

test('Stage 2 rotating CBCT beam hurts exposed player and is dodgeable with Saboteur dash', () => {
  const world = createWorld('playing');
  loadStage(world, 1, true);
  world.enemies = [];

  const cbct = world.stage.hazards?.find((h) => h.kind === 'cbct_beam');
  assert.ok(cbct && cbct.kind === 'cbct_beam');

  const seg = evaluateCbctBeamSegment(cbct, world.elapsedSec);
  const midX = (seg.x1 + seg.x2) / 2;
  const midY = (seg.y1 + seg.y2) / 2;

  // Exposed on CBCT beam -> loses 1 HP
  world.player.x = midX;
  world.player.y = midY;
  world.player.invulnTimer = 0;
  world.player.dashTimer = 0;
  const hpBefore = world.player.hp;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.player.hp, hpBefore - 1, 'CBCT rotating beam hurts player outside i-frames');

  // With Saboteur dash -> takes no damage
  world.hitstopTimer = 0;
  world.player.invulnTimer = 0;
  world.player.dashCooldown = 0;
  const seg2 = evaluateCbctBeamSegment(cbct, world.elapsedSec);
  world.player.x = (seg2.x1 + seg2.x2) / 2;
  world.player.y = (seg2.y1 + seg2.y2) / 2;
  const hpBeforeDash = world.player.hp;
  stepWorld(world, 0.016, { ...IDLE, right: true, dashJustPressed: true });
  assert.equal(world.player.hp, hpBeforeDash, 'Saboteur dash avoids CBCT beam damage');
});

test('Stage 3 Atomix ordered targets reset chain without damage on wrong order and clear on 1..7 order', () => {
  const world = createWorld('playing');
  loadStage(world, 2, true);
  world.enemies = [];
  assert.equal(world.stage.orderedTargets, true);
  assert.equal(world.targets.length, 7);

  // Restore #1 correctly
  world.player.x = world.targets[0].x;
  world.player.y = world.targets[0].y;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.targets[0].restored, true);

  // Touch #3 out of order -> resets chain WITHOUT hurting player
  const hpBeforeMistake = world.player.hp;
  world.player.invulnTimer = 0;
  world.player.x = world.targets[2].x;
  world.player.y = world.targets[2].y;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.player.hp, hpBeforeMistake, 'Wrong fiber order must NOT damage player');
  assert.equal(
    world.targets.every((t) => !t.restored),
    true,
    'Wrong fiber order must reset all Stage 3 targets'
  );

  // Now restore 1 -> 7 in exact order
  for (let i = 0; i < world.targets.length; i++) {
    world.player.x = world.targets[i].x;
    world.player.y = world.targets[i].y;
    stepWorld(world, 0.016, IDLE);
  }
  assert.equal(world.phase, 'stage_clear', 'Restoring Stage 3 fibers 1..7 in order clears stage');
});

test('Stage 4 Rimava water slows player movement to 50% compared to dry bridge', () => {
  const world = createWorld('playing');
  loadStage(world, 3, true);
  world.enemies = [];

  // 1) Measure movement on dry central bridge (col 15, row 11 -> '.')
  world.player.x = 15 * TILE_SIZE + 4;
  world.player.y = 11 * TILE_SIZE + 4;
  assert.equal(isWaterTile(world.stage, 15, 11), false);
  const startBridgeX = world.player.x;
  for (let i = 0; i < 6; i++) {
    stepWorld(world, 0.016, { ...IDLE, right: true });
  }
  const bridgeDist = world.player.x - startBridgeX;

  // 2) Measure movement in Rimava water (col 6, row 11 -> '~')
  world.player.x = 6 * TILE_SIZE + 4;
  world.player.y = 11 * TILE_SIZE + 4;
  assert.equal(isWaterTile(world.stage, 6, 11), true);
  const startWaterX = world.player.x;
  for (let i = 0; i < 6; i++) {
    stepWorld(world, 0.016, { ...IDLE, right: true });
  }
  const waterDist = world.player.x - startWaterX;

  const ratio = waterDist / bridgeDist;
  assert.ok(
    ratio > 0.45 && ratio < 0.55,
    `Expected water speed ratio ~0.50, got ${ratio.toFixed(3)}`
  );
});

test('Stage 5 locked museum vault doors block entry until Kronika 1270 relic unlocks them', () => {
  const world = createWorld('playing');
  loadStage(world, 4, true);
  world.enemies = [];

  assert.equal(world.doorsOpen, false, 'Vault doors start locked on Stage 5');

  // Position player right below the 'D' vault door (col 15, row 9) and try walking UP through row 8 ('D')
  world.player.x = 15 * TILE_SIZE + 4;
  world.player.y = 9 * TILE_SIZE + 4;
  for (let i = 0; i < 20; i++) {
    stepWorld(world, 0.016, { ...IDLE, up: true });
  }
  assert.ok(
    world.player.y > 8 * TILE_SIZE + 6,
    `Locked vault door must block player from entering row 8 (y=${world.player.y})`
  );

  // Collect Kronika 1270 relic -> unlocks doors!
  world.player.x = world.stageRelic.x;
  world.player.y = world.stageRelic.y;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.stageRelic.collected, true);
  assert.equal(world.doorsOpen, true, 'Collecting Kronika 1270 must unlock museum vault doors');

  // Now walk UP right through the unlocked doorway at col 15, row 8 into the vault (row 7)
  world.player.x = 15 * TILE_SIZE + 4;
  world.player.y = 9 * TILE_SIZE + 4;
  for (let i = 0; i < 25; i++) {
    stepWorld(world, 0.016, { ...IDLE, up: true });
  }
  assert.ok(
    world.player.y < 8 * TILE_SIZE,
    `Player must pass cleanly into the museum vault once unlocked (y=${world.player.y})`
  );
});

test('F2: all 7 stages have complete Slovak content (title, subtitle, chronicle, relic, tags)', () => {
  assert.equal(STAGES.length, 7, 'Expected exactly 7 stages');

  const stageIds = STAGES.map((s) => s.id);
  assert.deepEqual(stageIds, [
    'clinic', 'endo', 'teatro', 'rimava_muzeum', 'rimava_vault', 'finale', 'service',
  ]);

  for (const stage of STAGES) {
    // Title & subtitle must be non-empty Slovak strings
    assert.ok(stage.title && stage.title.length > 0, `Stage ${stage.index} missing title`);
    assert.ok(stage.subtitle && stage.subtitle.length > 0, `Stage ${stage.index} missing subtitle`);
    assert.ok(
      stage.openingChronicle && stage.openingChronicle.length > 0,
      `Stage ${stage.index} missing openingChronicle`
    );

    // Company/location tags in Slovak
    assert.ok(stage.companyTag && stage.companyTag.length > 0, `Stage ${stage.index} missing companyTag`);
    assert.ok(stage.locationTag && stage.locationTag.length > 0, `Stage ${stage.index} missing locationTag`);
    assert.ok(stage.retroHomage && stage.retroHomage.length > 0, `Stage ${stage.index} missing retroHomage`);

    // Relic must have name and chronicle note (Slovak)
    assert.ok(stage.relic.name && stage.relic.name.length > 0, `Stage ${stage.index} relic missing name`);
    assert.ok(
      stage.relic.chronicleNote && stage.relic.chronicleNote.length > 0,
      `Stage ${stage.index} relic missing chronicleNote`
    );

    // Stage index matches position in array
    assert.equal(stage.index, STAGES.indexOf(stage), `Stage ${stage.id} index mismatch`);

    // Targets must have valid kinds
    for (const target of stage.targets) {
      assert.ok(
        ['caries', 'fiber', 'ornament'].includes(target.kind),
        `Stage ${stage.index} target has invalid kind: ${target.kind}`
      );
    }

    // Pickups must have valid kinds
    for (const pickup of stage.pickups) {
      assert.ok(
        ['crown', 'coil', 'gift'].includes(pickup.kind),
        `Stage ${stage.index} pickup has invalid kind: ${pickup.kind}`
      );
    }

    // Enemies must have valid archetypes
    for (const enemy of stage.enemies) {
      assert.ok(
        ['patroller', 'kiter', 'charger'].includes(enemy.archetype),
        `Stage ${stage.index} enemy has invalid archetype: ${enemy.archetype}`
      );
    }
  }
});

test('F2: stage ordering and ids are unique and sequential', () => {
  const ids = STAGES.map((s) => s.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length, 'Stage IDs must be unique');

  const indexes = STAGES.map((s) => s.index);
  for (let i = 0; i < STAGES.length; i++) {
    assert.equal(indexes[i], i, `Stage at position ${i} must have index ${i}`);
  }

  // Finale must be at index 5, service at index 6
  assert.equal(STAGES[5].id, 'finale', 'Index 5 must be finale');
  assert.equal(STAGES[6].id, 'service', 'Index 6 must be service');

  // Finale: MVP plaque relic
  assert.equal(STAGES[5].relic.kind, 'plaque', 'Finale relic must be plaque');
  // Service: service_key relic, no boss
  assert.equal(STAGES[6].relic.kind, 'service_key', 'Service relic must be service_key');
  assert.equal(STAGES[6].bossSpawn, undefined, 'Service stage must not have bossSpawn');
});

test('F2: all stage titles and chronicles are Slovak (no English-only words)', () => {
  const englishOnly = /^(The|And|Or|Start|Stop|Play|Pause|Resume|Restart|Menu|Home|Back|Next|Close|Open|Save|Load|Settings|Options|Help|Info|OK|Yes|No|Cancel|Apply|Reset|New|Game|Over|Win|Victory|Score|High|Best|Time|Wave|Stage|Level|Player|Hero|Enemy|Boss|Target|Relic|Coin|Gem|Life|HP|Damage|Combo|Multiplier|Click|Key|Space|Shift|Enter|Esc|WASD|Arrow|Dash|Swap|Fire|Laser|Signal|Bubble|Plaque|Checkpoint|Coop|Tape|Cassette|Manual|Visual|Secret|Room|Studio)$/;

  for (const stage of STAGES) {
    for (const field of [stage.title, stage.subtitle, stage.openingChronicle, stage.companyTag, stage.locationTag, stage.retroHomage, stage.relic.name, stage.relic.chronicleNote]) {
      const words = field.split(/[\s·,;:!\-]+/);
      for (const word of words) {
        const clean = word.replace(/[\[\]]/g, '').toLowerCase();
        if (clean.length > 0) {
          assert.ok(
            !englishOnly.test(clean),
            `Stage ${stage.index} field contains English-only word: "${clean}" in "${field}"`
          );
        }
      }
    }
  }
});
