/**
 * Simple BFS pathfinder for grid-based movement (F1.3 bot).
 *
 * Finds a path from start to goal on the stage grid, avoiding walls (#)
 * and locked doors (D). Returns the next step direction towards the goal.
 */

import { TILE_SIZE, GRID_COLS, GRID_ROWS, isWallTile } from '../levels';

export type Dir = 'up' | 'down' | 'left' | 'right' | 'none';

const DIRS: [Dir, number, number][] = [
  ['up', 0, -1],
  ['down', 0, 1],
  ['left', -1, 0],
  ['right', 1, 0],
];

/** BFS to find the next step towards goal. Returns the direction to move. */
export function findNextStep(
  grid: string[],
  startX: number,
  startY: number,
  goalX: number,
  goalY: number,
  doorsOpen = false
): Dir {
  const startCol = Math.floor(startX / TILE_SIZE);
  const startRow = Math.floor(startY / TILE_SIZE);
  const goalCol = Math.floor(goalX / TILE_SIZE);
  const goalRow = Math.floor(goalY / TILE_SIZE);

  if (startCol === goalCol && startRow === goalRow) return 'none';

  // BFS
  const visited: boolean[][] = [];
  const parent: Map<string, { col: number; row: number; dir: Dir }> = new Map();

  for (let r = 0; r < GRID_ROWS; r++) {
    visited[r] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      visited[r][c] = false;
    }
  }

  const queue: [number, number][] = [[startCol, startRow]];
  visited[startRow][startCol] = true;

  while (queue.length > 0) {
    const [c, r] = queue.shift()!;

    if (c === goalCol && r === goalRow) {
      // Reconstruct path to find first step
      let curr: { col: number; row: number } = { col: c, row: r };
      let firstDir: Dir = 'none';
      while (true) {
        const entry = parent.get(`${curr.col},${curr.row}`);
        if (!entry) break;
        if (entry.col === startCol && entry.row === startRow) {
          firstDir = entry.dir;
          break;
        }
        curr = { col: entry.col, row: entry.row };
      }
      return firstDir;
    }

    for (const [dir, dc, dr] of DIRS) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;
      if (visited[nr][nc]) continue;
      if (isWallTile({ grid } as any, nc, nr, doorsOpen)) continue;
      visited[nr][nc] = true;
      parent.set(`${nc},${nr}`, { col: c, row: r, dir: dir as Dir });
      queue.push([nc, nr]);
    }
  }

  // No path found
  return 'none';
}
