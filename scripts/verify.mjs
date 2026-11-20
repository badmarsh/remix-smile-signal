import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const isWin = process.platform === 'win32';
const bin = (name) => resolve(rootDir, 'node_modules', '.bin', isWin ? `${name}.cmd` : name);

let failures = 0;

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false, cwd: rootDir, ...opts });
  if (result.status !== 0) {
    console.error(`\n❌ verify failed at: ${cmd} ${args.join(' ')} (exit ${result.status})`);
    failures += 1;
  }
  return result;
}

console.log('🔍 verify.mjs — tsc → test → check:rules → build\n');

// 1. TypeScript check
console.log('▸ tsc --noEmit');
run(bin('tsc'), ['--noEmit']);

// 2. Unit tests
console.log('▸ npm test');
run(bin('tsx'), ['scripts/run-tests.mjs']);

// 3. Design rules check
console.log('▸ check:rules');
run(bin('tsx'), ['scripts/check-rules.mjs']);

// 4. Production build
console.log('▸ vite build');
run(bin('vite'), ['build']);

// 5. Offline file:// compatible bundle
console.log('▸ build:offline');
run(bin('tsx'), ['scripts/build-offline.mjs']);

console.log(`\n📊 verify.mjs: ${failures} chýb\n`);

if (failures > 0) {
  process.exit(1);
}
console.log('✅ verify.mjs — všetky kontroly prešli');
