import { build } from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(process.cwd());
const distDir = resolve(rootDir, 'dist');

// Find the Vite-generated entry JS file
const fs = await import('node:fs');
const path = await import('node:path');

function findEntryJs(dir) {
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith('index-') && entry.endsWith('.js')) {
      return resolve(dir, entry);
    }
  }
  return null;
}

const entryJs = findEntryJs(resolve(distDir, 'assets'));
if (!entryJs) {
  console.error('❌ No Vite entry JS found in dist/assets/');
  process.exit(1);
}

console.log(`📦 Bundling ${entryJs} → IIFE for file:// compatibility...\n`);

const result = await build({
  entryPoints: [entryJs],
  outfile: resolve(distDir, 'assets', 'index-offline.iife.js'),
  bundle: true,
  format: 'iife',
  globalName: 'ZubokSignalik',
  minify: true,
  sourcemap: false,
  logLevel: 'info',
});

console.log('\n✅ IIFE bundle created at dist/assets/index-offline.iife.js');

// Now update dist/index.html to use classic script tag for file:// compatibility
const htmlPath = resolve(distDir, 'index.html');
let html = readFileSync(htmlPath, 'utf8');

// Replace the module script tag with a classic script tag
html = html.replace(
  /<script type="module" crossorigin src="\.\/assets\/index-[^"]+\.js"><\/script>/,
  '<script src="./assets/index-offline.iife.js"></script>'
);

writeFileSync(htmlPath, html);
console.log('✅ dist/index.html updated for file:// compatibility');
