import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const recoveryCss = await readFile(new URL('../public/css/functional-recovery.css', import.meta.url), 'utf8');
const wellnessRecoveryCss = await readFile(new URL('../public/css/modules/wellness-recovery.css', import.meta.url), 'utf8');

test('recovered Wellness presentation is module-owned after the global recovery layer', () => {
  assert.doesNotMatch(recoveryCss, /wellness-boost-library-view|living-wellness-hero|wellness-sanctuary-copy|wellness-session-grid|wellness-session-tile|living-breathing-orb/);
  assert.match(wellnessRecoveryCss, /\.wellness-boost-library-view\{/);
  assert.match(wellnessRecoveryCss, /\.living-wellness-hero\{/);
  assert.match(wellnessRecoveryCss, /\.wellness-session-grid\{/);

  const recovery = indexHtml.indexOf('/css/functional-recovery.css');
  const wellness = indexHtml.indexOf('/css/modules/wellness-recovery.css');
  const breathing = indexHtml.indexOf('/css/modules/wellness-breathing.css');
  const accessibility = indexHtml.indexOf('/css/accessibility-regression.css');
  assert.ok(recovery >= 0 && recovery < wellness && wellness < breathing && breathing < accessibility);
});

test('global recovery debt ratchets down after Wellness extraction', () => {
  assert.ok(Buffer.byteLength(recoveryCss, 'utf8') <= 10000);
  assert.ok((recoveryCss.match(/!important/g) || []).length <= 75);
});
