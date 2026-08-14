import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';
import { boostContent, boostTypes } from '../public/js/modules/wellness-boost/content.js';
import { wellnessBoostModule } from '../public/js/modules/wellness-boost/module.js';

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
  assert.equal(frontend.slots[0].name, 'today-boost');
});

test('boost platform metadata is generic while Meditation remains module content', () => {
  assert.ok(boostTypes.meditation);
  assert.ok(boostContent.every((item) => item.boostType && item.title && item.category));
  assert.ok(boostContent.every((item) => Number.isInteger(item.durationMinutes)));
  assert.ok(boostContent.every((item) => ['voice', 'music', 'both'].includes(item.audioKind)));
  assert.ok(boostContent.some((item) => item.audioKind === 'music' && item.tracks.length));
  assert.ok(boostContent.some((item) => item.audioKind === 'both'));
});

test('module-owned UI provides native accessible audio semantics', () => {
  const html = wellnessBoostModule.renderSlot({ slot: 'today-boost' });
  assert.match(html, /data-module="wellness-boost"/);
  assert.match(html, /<audio controls preload="metadata" aria-label="Play/);
  assert.match(html, /<source src="data:audio\/wav;base64,/);
  assert.match(html, /Duration 3 minutes/);
  assert.match(html, /rights-safe placeholder/);
  assert.match(html, /no unlicensed recording has been added/i);
});

test('Today stays composition-only and does not own Wellness Boost content or controls', () => {
  assert.match(app, /forSlot\('today-boost'\)/);
  assert.match(todayUi, /\$\{todayBoostPanel\}/);
  assert.doesNotMatch(todayUi, /Meditation|<audio|wellness-boost-card|boostContent/);
});

test('module removal leaves Today valid and removes only its optional slot', () => {
  const registry = createFrontendModuleRegistry(frontendModules);
  assert.equal(registry.forSlot('today-boost').length, 1);
  assert.equal(registry.forSlot('today-boost', { 'wellness-boost': false }).length, 0);
  assert.equal(registry.enabled({ 'wellness-boost': false }).some((module) => module.id === 'today'), true);
});

test('Wellness Boost is mobile-safe with accessible touch-size audio controls', () => {
  assert.match(css, /min-height:var\(--gc-target-min\)/);
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /grid-template-columns:1fr/);
});
