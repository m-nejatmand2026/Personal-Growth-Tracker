import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const quickAddJs = await readFile(new URL('../public/js/features/quick-add.js', import.meta.url), 'utf8');
const planJs = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const todayJs = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');

test('primary navigation matches the Version 1 experience contract', () => {
  for (const label of ['Today','Plan','Progress','Insights']) assert.match(indexHtml, new RegExp(`>${label}<`));
  assert.match(indexHtml, /id="quickAddBtn"/);
  assert.doesNotMatch(indexHtml, /data-view="settings"/);
  assert.doesNotMatch(indexHtml, /data-view="week"/);
  assert.doesNotMatch(indexHtml, /data-view="history"/);
});

test('Quick Add stays isolated from business feature implementations', () => {
  assert.match(quickAddJs, /from '\.\.\/core\/dom\.js'/);
  assert.doesNotMatch(quickAddJs, /features\//);
  assert.doesNotMatch(quickAddJs, /api\(/);
});

test('normal Plan UI does not expose architecture implementation language', () => {
  assert.doesNotMatch(planJs, /independently registered module/i);
  assert.doesNotMatch(planJs, /explicit contract/i);
  assert.doesNotMatch(planJs, /failure boundary/i);
});

test('Today progressively discloses the full Energy Map', () => {
  assert.match(todayJs, /id="energyDetails"/);
  assert.match(todayJs, /id="openEnergyCheckin"/);
  assert.match(todayJs, /function energyMap\(/);
});
