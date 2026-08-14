import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';
import { boostContent, boostTypes } from '../public/js/modules/wellness-boost/content.js';
import { wellnessBoostModule } from '../public/js/modules/wellness-boost/module.js';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const todayUi = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const moduleJs = await readFile(new URL('../public/js/modules/wellness-boost/module.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../public/css/modules/wellness-boost.css', import.meta.url), 'utf8');

test('Wellness Boost owns an independent dependency-free capability', () => {
  const worker = createModuleRegistry(platformModules).get('wellness-boost');
  const frontend = createFrontendModuleRegistry(frontendModules).get('wellness-boost');
  assert.ok(worker);
  assert.ok(frontend);
  assert.deepEqual(worker.dependsOn, []);
  assert.deepEqual(frontend.dependsOn, []);
  assert.deepEqual(worker.ownsTables, []);
  assert.deepEqual(worker.routes, []);
  assert.deepEqual(frontend.slots, []);
  assert.equal(typeof frontend.renderView, 'function');
  assert.equal(typeof frontend.bindView, 'function');
  assert.equal(typeof frontend.deactivate, 'function');
});

test('Meditation starter library owns 3 5 10 and 20 minute original guided content', () => {
  assert.ok(boostTypes.meditation);
  assert.deepEqual(boostContent.map((item) => item.durationMinutes), [3, 5, 10, 20]);
  assert.ok(boostContent.every((item) => item.boostType === 'meditation'));
  assert.ok(boostContent.every((item) => item.title && item.category && item.description));
  assert.ok(boostContent.every((item) => item.availableModes.join(',') === 'voice,ambient,both'));
  assert.ok(boostContent.every((item) => item.cues.length >= 5));
  assert.ok(boostContent.every((item) => item.cues[0].atSeconds === 0));
  assert.ok(boostContent.every((item) => item.cues.every((cue) => cue.text && cue.atSeconds < item.durationMinutes * 60)));
});

test('dedicated library exposes duration choice before a practice player', () => {
  const html = wellnessBoostModule.renderView();
  assert.match(html, /data-module="wellness-boost"/);
  assert.match(html, /Wellness Boost/);
  assert.match(html, />Meditation</);
  for (const duration of ['3 min', '5 min', '10 min', '20 min']) assert.match(html, new RegExp(duration));
  assert.match(html, /data-wb-duration=/);
  assert.match(html, /data-wb-open="meditation-gentle-arrival"/);
  assert.match(html, /Guided voice · Ambient · Both/);
  assert.doesNotMatch(html, /<audio|unlicensed recording|rights-safe placeholder/);
});

test('Meditation playback is local rights-safe and does not create Progress', () => {
  assert.match(moduleJs, /SpeechSynthesisUtterance/);
  assert.match(moduleJs, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(moduleJs, /Locally generated tone/);
  assert.match(moduleJs, /No meditation recording is uploaded/);
  assert.match(moduleJs, /Nothing (?:here )?creates Progress|Nothing was added to Progress/);
  assert.doesNotMatch(moduleJs, /\/api\/v1\/progress|fetch\(|localStorage|sessionStorage/);
});

test('Meditation player owns start pause resume end and navigation cleanup lifecycle', () => {
  assert.match(moduleJs, /data-wb-start/);
  assert.match(moduleJs, /data-wb-toggle/);
  assert.match(moduleJs, /data-wb-end/);
  assert.match(moduleJs, /speechSynthesis\.pause\(\)/);
  assert.match(moduleJs, /speechSynthesis\.resume\(\)/);
  assert.match(moduleJs, /function deactivate\(\)/);
  assert.match(app, /wellnessBoost\?\.bindView/);
  assert.match(app, /state\.view === 'wellness-boost' && name !== 'wellness-boost'/);
  assert.match(app, /wellnessBoost\?\.deactivate/);
});

test('Wellness Boost is a first-class app section on both mobile and desktop', () => {
  const bottomNav = indexHtml.slice(indexHtml.indexOf('<nav class="bottom-nav"'), indexHtml.indexOf('</nav>', indexHtml.indexOf('<nav class="bottom-nav"')) + 6);
  assert.match(indexHtml, /data-view="wellness-boost"[^>]*class="rail-nav-btn"/);
  assert.match(bottomNav, /data-view="wellness-boost"[^>]*class="nav-btn"[^>]*aria-label="Wellness Boost"|data-view="wellness-boost"[^>]*aria-label="Wellness Boost"[^>]*class="nav-btn"/);
  assert.match(bottomNav, />Wellness<\/button>/);
  assert.match(indexHtml, /id="wellness-boostView" class="view"/);
  assert.match(app, /moduleRegistry\.get\('wellness-boost'\)/);
  assert.match(app, /state\.view === 'wellness-boost'/);
  assert.match(app, /wellnessBoost\?\.renderView/);
  assert.match(indexHtml, /id="quickAddBtn"/);
  assert.doesNotMatch(bottomNav, /data-view="insights"/);
});

test('Today no longer owns or embeds Wellness Boost content', () => {
  assert.doesNotMatch(app, /forSlot\('today-boost'\)/);
  assert.doesNotMatch(todayUi, /todayBoostPanel|Meditation|<audio|wellness-boost-card|boostContent|Wellness Boost/);
});

test('module removal leaves unrelated capabilities available', () => {
  const registry = createFrontendModuleRegistry(frontendModules);
  const enabled = registry.enabled({ 'wellness-boost': false });
  assert.equal(enabled.some((module) => module.id === 'wellness-boost'), false);
  assert.equal(enabled.some((module) => module.id === 'today'), true);
  assert.equal(enabled.some((module) => module.id === 'progress'), true);
  assert.equal(enabled.some((module) => module.id === 'journal'), true);
});

test('Wellness Boost library and player remain phone-first accessible', () => {
  assert.match(css, /\.wellness-boost-player/);
  assert.match(css, /min-height:var\(--gc-target-min\)/);
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /\.wellness-boost-grid\{grid-template-columns:1fr\}/);
  assert.match(css, /\.wellness-boost-mode-picker\{grid-template-columns:1fr\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(moduleJs, /role="status" aria-live="polite"/);
  assert.match(moduleJs, /role="group" aria-label="Playback style"/);
  assert.match(moduleJs, /Read the guidance/);
});
