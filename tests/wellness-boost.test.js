import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';
import { boostContent, boostTypes } from '../public/js/modules/wellness-boost/content.js';
import { wellnessBoostModule } from '../public/js/modules/wellness-boost/module.js';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const indexHtml = await read('public/index.html');
const todayUi = await read('public/js/features/today.js');
const app = await read('public/js/app.js');
const moduleJs = await read('public/js/modules/wellness-boost/module.js');
const playerJs = await read('public/js/modules/wellness-boost/player.js');
const css = await read('public/css/modules/wellness-boost.css');
const recoveryCss = await read('public/css/functional-recovery.css');
const deviceCss = await read('public/css/screenshot-recovery.css');
const runtime = `${moduleJs}\n${playerJs}`;

test('Wellness owns an independent dependency-free capability', () => {
  const worker = createModuleRegistry(platformModules).get('wellness-boost');
  const frontend = createFrontendModuleRegistry(frontendModules).get('wellness-boost');
  assert.ok(worker && frontend);
  assert.deepEqual(worker.dependsOn, []);
  assert.deepEqual(frontend.dependsOn, []);
  assert.deepEqual(worker.ownsTables, []);
  assert.deepEqual(worker.routes, []);
  assert.deepEqual(frontend.slots, []);
  for (const fn of ['renderView', 'bindView', 'deactivate']) assert.equal(typeof frontend[fn], 'function');
});

test('Meditation starter library preserves concise choice copy and guided content', () => {
  assert.ok(boostTypes.meditation);
  assert.deepEqual(boostContent.map((item) => item.durationMinutes), [3, 5, 10, 20]);
  assert.ok(boostContent.every((item) => item.boostType === 'meditation' && item.title && item.category && item.icon && item.summary && item.description));
  assert.ok(boostContent.every((item) => item.summary.length < item.description.length));
  assert.ok(boostContent.every((item) => item.availableModes.join(',') === 'voice,ambient,both'));
  assert.ok(boostContent.every((item) => item.cues.length >= 5 && item.cues[0].atSeconds === 0));
});

test('Wellness landing page uses one coherent whole-surface tile language', () => {
  const html = wellnessBoostModule.renderView();
  assert.match(html, /wellness-boost-library-view gc-page-frame gc-page-flow/);
  assert.match(html, /<h2 id="wellnessCurrentTitle">Wellness<\/h2>/);
  assert.match(html, /Your sanctuary/);
  assert.match(html, /Find your center/);
  assert.match(html, /Immersive sessions/);
  assert.equal((html.match(/class="wellness-session-tile gc-live-tile/g) || []).length, 4);
  assert.equal((html.match(/data-wb-open=/g) || []).length, 4);
  assert.doesNotMatch(html, /wellness-boost-featured|gc-feature-card|gc-choice-row|Open practice|>Open</);
  assert.doesNotMatch(html, /How would you like to listen\?|data-wb-mode=/);
  assert.match(recoveryCss, /\.wellness-session-grid/);
  assert.match(recoveryCss, /\.wellness-session-tile/);
});

test('Wellness breathing guide is live, touchable and routes into the existing breath practice', () => {
  const html = wellnessBoostModule.renderView();
  assert.match(html, /<button[^>]*class="living-breathing-orb"[^>]*data-wb-breathe/);
  assert.match(html, /Open A steadier breath session/);
  assert.match(html, /Tap to begin/);
  assert.match(moduleJs, /BREATHING_PRACTICE_ID\s*=\s*'meditation-steadier-breath'/);
  assert.match(moduleJs, /querySelector\('\[data-wb-breathe\]'\)[\s\S]*addEventListener\('click'/);
  assert.match(deviceCss, /@keyframes gc-breath-orb/);
  assert.match(deviceCss, /\.living-breathing-orb\s*\{[\s\S]*animation:\s*gc-breath-orb/);
  assert.match(deviceCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test('Wellness sanctuary and session grid have explicit responsive alignment', () => {
  assert.match(moduleJs, /wellness-sanctuary-copy/);
  assert.match(recoveryCss, /\.living-wellness-hero\{[^}]*grid-template-columns:minmax\(0,1fr\) 150px/s);
  assert.match(recoveryCss, /\.living-breathing-orb\{[^}]*justify-self:center/s);
  assert.match(recoveryCss, /\.wellness-session-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(recoveryCss, /@media\(max-width:760px\)[\s\S]*\.wellness-session-grid\{grid-template-columns:1fr\}/);
});

test('Meditation player asks listening style only after a practice is chosen and then becomes minimal', () => {
  for (const label of ['Guided', 'Ambient', 'Both']) assert.match(moduleJs, new RegExp(`label:\\s*'${label}'`));
  assert.match(moduleJs, /How would you like to listen\?/);
  assert.match(moduleJs, /data-wb-start/);
  assert.match(moduleJs, /wellness-boost-active-player/);
  assert.match(moduleJs, /wellness-boost-player-time/);
  assert.match(moduleJs, />remaining</);
  assert.match(moduleJs, /role="progressbar"/);
  assert.match(moduleJs, /Read guidance/);
  assert.match(css, /\.wellness-boost-player\.is-active \.wellness-boost-prestart\{display:none\}/);
  assert.match(css, /\.wellness-boost-player\.is-active \.wellness-boost-active-player\{display:grid\}/);
});

test('Meditation playback is local rights-safe and never creates Progress or Wellbeing facts', () => {
  assert.match(playerJs, /SpeechSynthesisUtterance/);
  assert.match(playerJs, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(moduleJs, /Ambient sound is generated locally in your browser/);
  assert.match(moduleJs, /No meditation recording is uploaded/);
  assert.match(moduleJs, /nothing here is added to Progress or Wellbeing/);
  assert.doesNotMatch(runtime, /\/api\/v1\/progress|\/api\/v1\/wellbeing|fetch\(|localStorage|sessionStorage/);
});

test('Meditation playback engine remains private and replaceable', () => {
  assert.match(moduleJs, /createMeditationPlayer/);
  assert.match(playerJs, /export function createMeditationPlayer\(\)/);
  assert.match(playerJs, /return Object\.freeze\(\{/);
  for (const token of ['isActive()', 'start,', 'toggle,', 'stop']) assert.match(playerJs, new RegExp(token.replace(/[()]/g, '\\$&')));
  assert.doesNotMatch(moduleJs, /SpeechSynthesisUtterance|AudioContext|setInterval|clearInterval/);
  assert.doesNotMatch(playerJs, /boostContent|activePracticeId|renderLibrary/);
});

test('Meditation player owns start pause resume end and navigation cleanup lifecycle', () => {
  assert.match(moduleJs, /data-wb-start/);
  assert.match(moduleJs, /data-wb-toggle/);
  assert.match(moduleJs, /data-wb-end/);
  assert.match(playerJs, /formatMeditationClock\(total - safeElapsed\)/);
  assert.match(playerJs, /speechSynthesis\.pause\(\)/);
  assert.match(playerJs, /speechSynthesis\.resume\(\)/);
  assert.match(moduleJs, /function deactivate\(\)/);
  assert.match(moduleJs, /player\.stop\(\{\s*quiet:\s*true\s*\}\)/);
  assert.match(app, /wellnessBoost\?\.bindView/);
  assert.match(app, /state\.view\s*===\s*'wellness-boost'\s*&&\s*name\s*!==\s*'wellness-boost'/);
  assert.match(app, /wellnessBoost\?\.deactivate/);
});

test('Wellness remains a first-class section on mobile and desktop', () => {
  const start = indexHtml.indexOf('<nav class="bottom-nav"');
  const bottom = indexHtml.slice(start, indexHtml.indexOf('</nav>', start) + 6);
  assert.match(indexHtml, /data-view="wellness-boost"[^>]*class="rail-nav-btn"/);
  assert.match(bottom, /data-view="wellness-boost"[^>]*aria-label="Wellness"/);
  assert.match(bottom, />Wellness<\/button>/);
  assert.match(indexHtml, /id="wellness-boostView" class="view"/);
  assert.match(app, /moduleRegistry\.get\('wellness-boost'\)/);
  assert.match(app, /wellnessBoost\?\.renderView/);
  assert.doesNotMatch(bottom, /data-view="insights"/);
});

test('Today does not embed Wellness practice content', () => {
  assert.doesNotMatch(todayUi, /Meditation|<audio|wellness-session-tile|boostContent|Wellness Boost/);
});

test('module removal leaves unrelated capabilities available', () => {
  const registry = createFrontendModuleRegistry(frontendModules);
  const enabled = registry.enabled({ 'wellness-boost': false });
  assert.equal(enabled.some((module) => module.id === 'wellness-boost'), false);
  for (const id of ['today', 'progress', 'journal']) assert.equal(enabled.some((module) => module.id === id), true);
});

test('Wellness destination and player remain phone-first accessible', () => {
  assert.match(recoveryCss, /\.wellness-session-tile\{[^}]*min-height:100px/s);
  assert.match(recoveryCss, /\.gc-live-tile:focus-visible/);
  assert.match(css, /min-height:var\(--gc-target-min\)/);
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /\.wellness-boost-mode-picker\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(moduleJs, /role="status" aria-live="polite"/);
  assert.match(moduleJs, /role="group" aria-label="Playback style"/);
  assert.match(moduleJs, /aria-label="\$\{escapeHtml\(item\.title\)\}, \$\{item\.durationMinutes\} minutes/);
});
