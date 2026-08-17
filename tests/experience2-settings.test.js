import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../public/experience/2/js/app.js', import.meta.url), 'utf8');
const settings = await readFile(new URL('../public/experience/2/js/views/settings.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../public/experience/2/css/settings.css', import.meta.url), 'utf8');
const html = await readFile(new URL('../public/experience/2/index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../public/experience/2/sw.js', import.meta.url), 'utf8');

test('Experience 2 Settings replaces the generic foundation placeholder', () => {
  assert.match(app, /renderSettings,bindSettings,applyPresentationPreferences/);
  assert.match(app, /current==='settings'\)\{renderSettingsView\(\);return;\}/);
  assert.match(settings, /Experience 2 settings/);
  assert.match(html, /\/experience\/2\/css\/settings\.css/);
});

test('Settings preferences are local to the isolated Experience 2 namespace', () => {
  assert.match(settings, /PREFERENCE_PREFIX/);
  assert.match(settings, /readPreference\('theme','dark'\)/);
  assert.match(settings, /writePreference\('theme',input\.value\)/);
  assert.match(settings, /writePreference\('motion',input\.value\)/);
  assert.doesNotMatch(settings, /localStorage\.clear\s*\(/);
  assert.doesNotMatch(settings, /\/api\//);
});

test('Settings cache cleanup cannot target Preview 1 or unrelated caches', () => {
  assert.match(settings, /CACHE_PREFIX='growth-compass-preview2-e2-'/);
  assert.match(settings, /const owned=names\.filter\(name=>name\.startsWith\(CACHE_PREFIX\)\)/);
  assert.match(settings, /Promise\.all\(owned\.map\(name=>caches\.delete\(name\)\)\)/);
  assert.doesNotMatch(settings, /Promise\.all\(names\.map\(name=>caches\.delete\(name\)\)\)/);
  assert.doesNotMatch(settings, /caches\.delete\(['"]growth-compass-preview/);
});

test('Settings exposes theme and an accessibility-safe reduce-motion option', () => {
  assert.match(settings, /value="dark"/);
  assert.match(settings, /value="light"/);
  assert.match(settings, /value="system"/);
  assert.match(settings, /value="reduce"/);
  assert.match(css, /html\[data-motion="reduce"\]/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test('Experience 2 offline shell includes Settings and remains namespace-versioned', () => {
  assert.match(sw, /growth-compass-preview2-e2-v11/);
  assert.match(sw, /\/experience\/2\/css\/settings\.css/);
  assert.match(sw, /\/experience\/2\/js\/views\/settings\.js/);
  assert.match(sw, /key\.startsWith\('growth-compass-preview2-e2-'\)/);
});