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
});

test('boost platform metadata is generic while Meditation remains module content', () => {
  assert.ok(boostTypes.meditation);
  assert.ok(boostContent.every((item) => item.boostType && item.title && item.category));
  assert.ok(boostContent.every((item) => Number.isInteger(item.durationMinutes)));
  assert.ok(boostContent.every((item) => ['voice', 'music', 'both'].includes(item.audioKind)));
  assert.ok(boostContent.some((item) => item.audioKind === 'music' && item.tracks.length));
  assert.ok(boostContent.some((item) => item.audioKind === 'both'));
});

test('module-owned dedicated UI provides native accessible audio semantics', () => {
  const html = wellnessBoostModule.renderView();
  assert.match(html, /data-module="wellness-boost"/);
  assert.match(html, /Wellness Boost/);
  assert.match(html, />Meditation</);
  assert.match(html, /<audio controls preload="metadata" aria-label="Play/);
  assert.match(html, /<source src="data:audio\/wav;base64,/);
  assert.match(html, /Duration 3 minutes/);
  assert.match(html, /rights-safe placeholder/);
  assert.match(html, /no unlicensed recording has been added/i);
});

test('Wellness Boost is a first-class app section while the five-slot mobile Logger navigation remains stable', () => {
  assert.match(indexHtml, /data-view="wellness-boost"[^>]*class="rail-nav-btn"/);
  assert.match(indexHtml, /id="wellnessBoostBtn"/);
  assert.match(indexHtml, /id="wellness-boostView" class="view"/);
  assert.match(app, /moduleRegistry\.get\('wellness-boost'\)/);
  assert.match(app, /state\.view === 'wellness-boost'/);
  assert.match(app, /wellnessBoost\?\.renderView/);
  assert.match(indexHtml, /grid-template-columns|id="quickAddBtn"/);
  assert.match(indexHtml, /data-view="today"/);
  assert.match(indexHtml, /data-view="plan"/);
  assert.match(indexHtml, /data-view="progress"/);
  assert.match(indexHtml, /data-view="insights"/);
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

test('Wellness Boost dedicated view is mobile-safe with accessible touch-size audio controls', () => {
  assert.match(css, /\.wellness-boost-view/);
  assert.match(css, /min-height:var\(--gc-target-min\)/);
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /grid-template-columns:1fr/);
});
