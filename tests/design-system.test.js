import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderThresholdTrack, thresholdScale } from '../public/js/platform/charts.js';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const designCss = await readFile(new URL('../public/css/design-system.css', import.meta.url), 'utf8');
const chartsJs = await readFile(new URL('../public/js/platform/charts.js', import.meta.url), 'utf8');
const progressUi = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');

test('canonical design system loads after legacy experience variables and before module sheets', () => {
  const experience = indexHtml.indexOf('/css/experience.css');
  const designSystem = indexHtml.indexOf('/css/design-system.css');
  const moduleSheets = indexHtml.indexOf('/css/module-sheets.css');
  assert.ok(experience >= 0);
  assert.ok(designSystem > experience);
  assert.ok(moduleSheets > designSystem);
});

test('design system defines canonical tokens accessibility focus touch and reduced motion primitives', () => {
  for (const token of [
    '--gc-bg', '--gc-surface', '--gc-text', '--gc-text-muted', '--gc-border',
    '--gc-brand', '--gc-brand-strong', '--gc-focus', '--gc-target-min'
  ]) assert.match(designCss, new RegExp(token.replace('--', '\\-\\-')));

  assert.match(designCss, /--os-teal:\s*var\(--gc-brand\)/);
  assert.match(designCss, /--accent:\s*var\(--gc-brand\)/);
  assert.match(designCss, /focus-visible/);
  assert.match(designCss, /--gc-target-min:\s*44px/);
  assert.match(designCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(designCss, /\.gc-sr-only/);
});

test('threshold scale is generic bounded and preserves overshoot instead of inventing a target ceiling', () => {
  assert.deepEqual(thresholdScale({ actual: -5, minimum: 0, target: 0 }), {
    actual: 0, minimum: 0, target: 0, maximum: 1,
    actualPct: 0, minimumPct: 0, targetPct: 0
  });

  const overshoot = thresholdScale({ actual: 120, minimum: 60, target: 100 });
  assert.equal(overshoot.maximum, 120);
  assert.equal(overshoot.actualPct, 100);
  assert.equal(overshoot.minimumPct, 50);
  assert.ok(overshoot.targetPct > 83 && overshoot.targetPct < 84);
});

test('threshold renderer carries visible-data equivalents for assistive technology and escapes labels', () => {
  const html = renderThresholdTrack({
    label: '<Focus>', actual: 30, minimum: 20, target: 40,
    actualText: '30m', minimumText: '20m', targetText: '40m'
  });

  assert.match(html, /role="group"/);
  assert.match(html, /Actual 30m; Minimum 20m; Target 40m/);
  assert.match(html, /&lt;Focus&gt;/);
  assert.match(html, /gc-sr-only/);
  assert.match(html, /gc-threshold__marker--minimum/);
  assert.match(html, /gc-threshold__marker--target/);
  assert.doesNotMatch(html, /<Focus>/);
});

test('chart primitive is platform-only and Progress consumes it without private coupling', () => {
  assert.match(chartsJs, /\.\.\/core\/dom\.js/);
  assert.doesNotMatch(chartsJs, /modules\/|features\/|progress|goals|activities/i);
  assert.match(progressUi, /platform\/charts\.js/);
  assert.match(progressUi, /renderThresholdTrack/);
  assert.doesNotMatch(progressUi, /class="amt-track"/);
});
