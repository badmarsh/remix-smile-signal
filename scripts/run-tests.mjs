import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function collectTestFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectTestFiles(full, out);
    } else if (entry.endsWith('.test.ts')) {
      out.push(full);
    }
  }
  return out;
}

const rootDir = process.cwd();
const files = collectTestFiles(resolve(rootDir, 'src')).sort();

if (files.length === 0) {
  console.error('No *.test.ts files found under src/');
  process.exit(1);
}

const isWin = process.platform === 'win32';
const tsxBin = resolve(rootDir, 'node_modules', '.bin', isWin ? 'tsx.cmd' : 'tsx');

// On Windows, node --import requires a file:// URL, not a bare path
const tsxEsm = resolve(rootDir, 'node_modules', 'tsx', 'dist', 'esm', 'index.mjs');
const tsxEsmUrl = pathToFileURL(tsxEsm).href;

const result = spawnSync(
  process.execPath,
  ['--import', tsxEsmUrl, '--test', ...files],
  {
  stdio: 'inherit',
  shell: false,
  }
);

process.exit(result.status ?? 1);
