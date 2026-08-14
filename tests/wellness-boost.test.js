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

test('Meditation starter library owns concise choice copy plus original guided content', () => {
  assert.ok(boostTypes.meditation);
  assert.deepEqual(boostContent.map((item) => item.durationMinutes), [3, 5, 10, 20]);
  assert.ok(boostContent.every((item) => item.boostType === 'meditation'));
  assert.ok(boostContent.every((item) => item.title && item.category && item.icon && item.summary && item.description));
  assert.ok(boostContent.every((item) => item.summary.length < item.description.length));
  assert.ok(boostContent.every((item) => item.availableModes.join(',') === 'voice,ambient,both'));
  assert.ok(boostContent.every((item) => item.cues.length >= 5));
  assert.ok(boostContent.every((item) => item.cues[0].atSeconds === 0));
  assert.ok(boostContent.every((item) => item.cues.every((cue) => cue.text && cue.atSeconds < item.durationMinutes * 60)));
});

test('Meditation library feels like a calm destination instead of a dashboard grid', () => {
  const html = wellnessBoostModule.renderView();
  assert.match(html, /data-module="wellness-boost"/);
  assert.match(html, /class="wellness-boost-view wellness-boost-library-view"/);
  assert.match(html, /<span class="section-kicker">Meditation<\/span>/);
  assert.match(html, /Take a few minutes for yourself\./);
  assert.match(html, /Featured meditation · Calm/);
  assert.match(html, /class="wellness-boost-featured wellness-boost-tone-calm"[^>]*data-wb-open="meditation-steadier-breath"/);
  assert.match(html, />A steadier breath</);
  assert.match(html, /More meditations/);
  assert.equal((html.match(/data-wb-open=/g) || []).length, 4);
  assert.equal((html.match(/class="wellness-boost-row wellness-boost-tone-/g) || []).length, 3);
  assert.doesNotMatch(html, /wellness-boost-grid|class="os-section wellness-boost-type"/);
  assert.doesNotMatch(html, /data-wb-duration=|wellness-boost-filter|Open practice/);
  assert.doesNotMatch(html, /Guided voice · Ambient · Both|How would you like to listen\?|data-wb-mode=/);
});

test('Wellness Boost uses restrained category tones and a narrower content column', () => {
  assert.match(css, /\.wellness-boost-library-view\{[^}]*width:min\(100%,860px\)[^}]*margin:0 auto/s);
  for (const tone of ['reset', 'calm', 'focus', 'restore']) {
    assert.match(css, new RegExp(`\\.wellness-boost-tone-${tone}\\{`));
  }
  assert.match(css, /\.wellness-boost-featured\{[^}]*min-height:210px[^}]*background:linear-gradient/s);
  assert.match(css, /\.wellness-boost-more-list\{display:grid\}/);
  assert.match(css, /\.wellness-boost-row\{[^}]*min-height:78px[^}]*border-top:1px solid var\(--gc-border\)/s);
  assert.doesNotMatch(css, /\.wellness-boost-grid\{/);
});

test('Meditation player asks listening style only after a practice is chosen and then becomes minimal', () => {
  assert.match(moduleJs, /How would you like to listen\?/);
  assert.match(moduleJs, /id: 'voice', label: 'Guided'/);
  assert.match(moduleJs, /id: 'ambient', label: 'Ambient'/);
  assert.match(moduleJs, /id: 'both', label: 'Both'/);
  assert.match(moduleJs, /data-wb-start[^>]*aria-label="Start meditation"/);
  assert.match(moduleJs, /wellness-boost-active-player/);
  assert.match(moduleJs, /wellness-boost-player-time/);
  assert.match(moduleJs, />remaining</);
  assert.match(moduleJs, /role="progressbar"/);
  assert.match(moduleJs, /Read guidance/);
  assert.match(css, /\.wellness-boost-player\.is-active \.wellness-boost-prestart\{display:none\}/);
  assert.match(css, /\.wellness-boost-player\.is-active \.wellness-boost-active-player\{display:grid\}/);
});

test('Meditation playback is local rights-safe and does not create Progress or Wellbeing facts', () => {
  assert.match(moduleJs, /SpeechSynthesisUtterance/);
  assert.match(moduleJs, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(moduleJs, /Ambient sound is generated locally in your browser/);
  assert.match(moduleJs, /No meditation recording is uploaded/);
  assert.match(moduleJs, /nothing here is added to Progress or Wellbeing/);
  assert.doesNotMatch(moduleJs, /\/api\/v1\/progress|\/api\/v1\/wellbeing|fetch\(|localStorage|sessionStorage/);
});

test('Meditation player owns start pause resume end remaining-time and navigation cleanup lifecycle', () => {
  assert.match(moduleJs, /data-wb-start/);
  assert.match(moduleJs, /data-wb-toggle/);
  assert.match(moduleJs, /data-wb-end/);
  assert.match(moduleJs, /formatClock\(total - safeElapsed\)/);
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

test('Wellness Boost destination and player remain phone-first accessible', () => {
  assert.match(css, /min-height:var\(--gc-target-min\)/);
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /\.wellness-boost-featured\{[^}]*min-height:176px/s);
  assert.match(css, /\.wellness-boost-row\{[^}]*min-height:72px/s);
  assert.match(css, /\.wellness-boost-mode-picker\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(moduleJs, /role="status" aria-live="polite"/);
  assert.match(moduleJs, /role="group" aria-label="Playback style"/);
  assert.match(moduleJs, /aria-label="[^\"]+, \$\{item\.durationMinutes\} minutes/);
});
