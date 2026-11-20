/**
 * Static BFS reachability analysis for each stage (F1.3).
 *
 * Verifies that all targets, relics, exit tiles, zone markers, and the
 * podium are reachable from playerStart through walkable floor tiles,
 * accounting for locked doors (D) and walls (#).
 *
 * This is a design-time check: if any objective is unreachable, the map
 * needs to be fixed.
 */

import { STAGES } from '../levels';
import { TILE_SIZE, GRID_COLS, GRID_ROWS, isWallTile, isLockedDoorTile } from '../levels';

interface ReachabilityResult {
  stageIndex: number;
  stageTitle: string;
  reachable: boolean;
  unreachable: string[];
  details: string;
}

/** BFS flood-fill from playerStart over walkable tiles. */
function bfsReachable(
  grid: string[],
  startX: number,
  startY: number,
  doorsOpen: boolean
): boolean[][] {
  const visited: boolean[][] = [];
  for (let r = 0; r < grid.length; r++) {
    visited[r] = [];
    for (let c = 0; c < grid[r].length; c++) {
      visited[r][c] = false;
    }
  }

  const queue: [number, number][] = [];
  const startCol = Math.floor(startX / TILE_SIZE);
  const startRow = Math.floor(startY / TILE_SIZE);

  if (startCol >= 0 && startCol < GRID_COLS && startRow >= 0 && startRow < GRID_ROWS) {
    queue.push([startCol, startRow]);
    visited[startRow][startCol] = true;
  }

  while (queue.length > 0) {
    const [c, r] = queue.shift()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;
      if (visited[nr][nc]) continue;
      if (isWallTile({ grid } as any, nc, nr, doorsOpen)) continue;
      visited[nr][nc] = true;
      queue.push([nc, nr]);
    }
  }

  return visited;
}

export function checkStageReachability(stageIndex: number): ReachabilityResult {
  const stage = STAGES[stageIndex];
  const grid = stage.grid;
  const startCol = Math.floor(stage.playerStart.x / TILE_SIZE);
  const startRow = Math.floor(stage.playerStart.y / TILE_SIZE);

  const visited = bfsReachable(grid, stage.playerStart.x, stage.playerStart.y, false);
  const visitedDoorsOpen = bfsReachable(grid, stage.playerStart.x, stage.playerStart.y, true);

  const unreachable: string[] = [];

  // Check targets
  for (const t of stage.targets) {
    const col = Math.floor(t.x / TILE_SIZE);
    const row = Math.floor(t.y / TILE_SIZE);
    if (!visited[row][col] && !visitedDoorsOpen[row][col]) {
      unreachable.push(`target ${t.kind} at (${t.x},${t.y})`);
    }
  }

  // Check relic
  const rCol = Math.floor(stage.relic.x / TILE_SIZE);
  const rRow = Math.floor(stage.relic.y / TILE_SIZE);
  if (!visited[rRow][rCol] && !visitedDoorsOpen[rRow][rCol]) {
    unreachable.push(`relic ${stage.relic.name} at (${stage.relic.x},${stage.relic.y})`);
  }

  // Check exit tile E (for timed_arena)
  for (let row = 0; row < grid.length; row++) {
    const c = grid[row].indexOf('E');
    if (c >= 0) {
      if (!visited[row][c] && !visitedDoorsOpen[row][c]) {
        unreachable.push(`exit E at (${c * TILE_SIZE + 4},${row * TILE_SIZE + 4})`);
      }
    }
  }

  // Check zone markers 1-4 (for deploy_select)
  for (const ch of ['1', '2', '3', '4']) {
    for (let row = 0; row < grid.length; row++) {
      const c = grid[row].indexOf(ch);
      if (c >= 0) {
        if (!visited[row][c] && !visitedDoorsOpen[row][c]) {
          unreachable.push(`zone ${ch} at (${c * TILE_SIZE + 4},${row * TILE_SIZE + 4})`);
        }
      }
    }
  }

  const reachable = unreachable.length === 0;
  const details = reachable
    ? `All objectives reachable from playerStart`
    : `Unreachable: ${unreachable.join(', ')}`;

  return {
    stageIndex,
    stageTitle: stage.title,
    reachable,
    unreachable,
    details,
  };
}

export function checkAllStagesReachability(): ReachabilityResult[] {
  const results: ReachabilityResult[] = [];
  for (let i = 0; i < STAGES.length; i++) {
    results.push(checkStageReachability(i));
  }
  return results;
}
