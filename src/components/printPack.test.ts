import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('F6: print pack — collector card front & back are 63mm × 88mm', () => {
  const source = readFileSync('src/components/VisualManualModal.tsx', 'utf-8');
  // Both card front and card back must have exact 1:1 mm dimensions
  const cardDims = source.match(/width:\s*'63mm',\s*height:\s*'88mm'/g);
  assert.equal(
    cardDims?.length,
    2,
    `Expected 2 card elements (front + back) with 63mm × 88mm, found ${cardDims?.length ?? 0}`,
  );
});

test('F6: print pack — physical box dimensions are 165 × 225 × 38 mm', () => {
  const source = readFileSync('src/components/VisualManualModal.tsx', 'utf-8');
  assert.ok(
    source.includes('165 × 225 × 38 mm'),
    'Box dimensions should be 165 × 225 × 38 mm',
  );
  assert.ok(
    source.includes('MIERKA 1:1 mm'),
    'Box blueprint should declare 1:1 mm scale',
  );
});

test('F6: print CSS — @media print hides no-print elements', () => {
  const source = readFileSync('src/index.css', 'utf-8');
  assert.ok(source.includes('@media print'), 'Print media query should exist');
  assert.ok(source.includes('.no-print'), 'no-print class should be targeted');
  assert.ok(
    source.includes('display: none !important'),
    'no-print should use display: none in print',
  );
});

test('F6: print CSS — @page size and margins defined', () => {
  const source = readFileSync('src/index.css', 'utf-8');
  assert.ok(source.includes('@page'), '@page rule should exist');
  assert.ok(source.includes('size: A4'), 'Page size should be A4');
  assert.ok(source.includes('margin: 10mm'), 'Page margins should be defined');
});

test('F6: print CSS — print-avoid-break prevents page breaks inside cards', () => {
  const source = readFileSync('src/index.css', 'utf-8');
  assert.ok(source.includes('.print-avoid-break'), 'print-avoid-break class should exist');
  assert.ok(
    source.includes('break-inside: avoid'),
    'print-avoid-break should prevent page breaks inside',
  );
});

test('F6: print CSS — backgrounds print exactly for card colors', () => {
  const source = readFileSync('src/index.css', 'utf-8');
  assert.ok(
    source.includes('print-color-adjust: exact'),
    'Background colors should print exactly',
  );
  assert.ok(
    source.includes('-webkit-print-color-adjust: exact'),
    'WebKit print color adjust should be set',
  );
});
