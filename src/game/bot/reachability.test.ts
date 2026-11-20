import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAllStagesReachability, checkStageReachability } from './reachability';
import { STAGES } from '../levels';

test('all stage objectives are reachable from playerStart (BFS analysis)', () => {
  const results = checkAllStagesReachability();
  for (const r of results) {
    console.log(`  Stage ${r.stageIndex} (${r.stageTitle}): ${r.details}`);
  }
  const unreachableStages = results.filter((r) => !r.reachable);
  assert.equal(unreachableStages.length, 0, `Unreachable objectives in stages: ${unreachableStages.map((r) => `${r.stageIndex}:${r.stageTitle}`).join(', ')}`);
});

test('Stage Service Incident objectives are reachable from playerStart', () => {
  const serviceIdx = STAGES.findIndex((s) => s.id === 'service');
  assert.ok(serviceIdx >= 0, 'Service stage exists');
  const r = checkStageReachability(serviceIdx);
  console.log(`  Service stage: ${r.details}`);
  assert.ok(r.reachable, `Service stage objectives unreachable: ${r.unreachable.join(', ')}`);
});

test('Stage Finale objectives are reachable from playerStart', () => {
  const finaleIdx = STAGES.findIndex((s) => s.id === 'finale');
  assert.ok(finaleIdx >= 0, 'Finale stage exists');
  const r = checkStageReachability(finaleIdx);
  console.log(`  Finale stage: ${r.details}`);
  assert.ok(r.reachable, `Finale stage objectives unreachable: ${r.unreachable.join(', ')}`);
});
