import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const rootDir = process.cwd();
let failures = 0;
let warnings = 0;

function fail(msg) {
  console.error(`❌ ${msg}`);
  failures += 1;
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
  warnings += 1;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

// ── (a) Forbidden APIs in sim files ────────────────────────────────────────

const SIM_FILES = [
  'src/game/engine.ts',
  'src/game/music.ts',
  'src/game/levels.ts',
  'src/game/hash.ts',
];

const FORBIDDEN = [
  'Math.random',
  'Date.now',
  'new Date',
  'performance.now',
  'performance.',
  'window.',
  'document.',
  'localStorage',
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'crypto.getRandomValues',
];

console.log('\n▸ check-rules.mjs — forbidden APIs in sim files\n');

for (const file of SIM_FILES) {
  const path = resolve(rootDir, file);
  let src;
  try {
    src = readFileSync(path, 'utf8');
  } catch {
    fail(`${file}: neexistuje`);
    continue;
  }

  const lines = src.split('\n');
  let fileHasIssue = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    for (const api of FORBIDDEN) {
      if (line.includes(api)) {
        fail(`${file}:${i + 1}: zakázané API "${api}"`);
        fileHasIssue = true;
      }
    }
  }
  if (!fileHasIssue) ok(`${file}: žiadne zakázané API`);
}

// ── (b) Import layer checks ────────────────────────────────────────────────

const PRESENTATION_IMPORTS = [
  "from './components",
  "from '../components",
  "from './renderer",
  "from '../renderer",
  "from './audio",
  "from '../audio",
  "from './App",
  "from '../App",
];

console.log('\n▸ check-rules.mjs — import layer separation\n');

for (const file of SIM_FILES) {
  const path = resolve(rootDir, file);
  let src;
  try {
    src = readFileSync(path, 'utf8');
  } catch {
    continue;
  }

  const lines = src.split('\n');
  let fileHasIssue = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    for (const imp of PRESENTATION_IMPORTS) {
      if (line.includes(imp)) {
        fail(`${file}:${i + 1}: sim importuje prezentačnú vrstvu "${imp}"`);
        fileHasIssue = true;
      }
    }
  }
  if (!fileHasIssue) ok(`${file}: žiadne importy z prezentačnej vrstvy`);
}

// ── (c) dist size budget ───────────────────────────────────────────────────

console.log('\n▸ check-rules.mjs — dist size budget\n');

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      total += statSync(full).size;
    }
  }
  return total;
}

let distSize = 0;
const distDir = resolve(rootDir, 'dist');
try {
  distSize = dirSize(distDir);
} catch {
  distSize = 0;
}

const distSizeMB = (distSize / (1024 * 1024)).toFixed(2);
const distSizeLimitMB = 5;

console.log(`   dist: ${distSizeMB} MB (limit ${distSizeLimitMB} MB po optimalizácii obrázkov)`);
if (distSize > distSizeLimitMB * 1024 * 1024) {
  warn(`dist prekračuje limit ${distSizeLimitMB} MB — optimalizuj obrázky (F0.5 / F7)`);
} else {
  ok(`dist v limite ${distSizeLimitMB} MB`);
}

// ── Summary ────────────────────────────────────────────────────────────────

console.log(`\n📊 check-rules.mjs: ${failures} chýb, ${warnings} upozornení\n`);

if (failures > 0) {
  process.exit(1);
}
