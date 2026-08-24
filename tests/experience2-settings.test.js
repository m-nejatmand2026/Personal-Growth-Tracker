import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const app=await readFile(new URL('../public/experience/2/js/app.js',import.meta.url),'utf8');
const settings=await readFile(new URL('../public/experience/2/js/views/settings.js',import.meta.url),'utf8');
const preferences=await readFile(new URL('../public/experience/2/js/core/preferences.js',import.meta.url),'utf8');
const debug=await readFile(new URL('../public/experience/2/debug/debug.js',import.meta.url),'utf8');
const debugHtml=await readFile(new URL('../public/experience/2/debug/index.html',import.meta.url),'utf8');
const bootstrap=await readFile(new URL('../public/experience/2/js/theme-bootstrap.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/settings.css',import.meta.url),'utf8');
const html=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');

test('Experience 2 Settings is product-facing appearance and help',()=>{assert.match(app,/renderSettings\s*,\s*bindSettings\s*,\s*applyPresentationPreferences/);assert.match(app,/function renderSettingsView\(version=renderVersion\)/);assert.match(app,/if\(current==='settings'\)\{renderSettingsView\(version\);return;\}/);assert.match(settings,/Appearance and help/);assert.match(settings,/Open full tutorial/);assert.doesNotMatch(settings,/Preview 2|Experience selector|offline cache|Reset Experience/);assert.match(html,/\/experience\/2\/css\/settings\.css/);});

test('Settings preferences remain inside the isolated Experience 2 preference contract',()=>{assert.match(preferences,/PREFERENCE_PREFIX='growth-compass:preview2:e2:'/);assert.match(settings,/readPreference\('theme','dark'\)/);assert.match(settings,/writePreference\('theme',input\.value\)/);assert.match(settings,/writePreference\('motion',input\.value\)/);assert.doesNotMatch(settings,/localStorage\.clear\s*\(/);assert.doesNotMatch(settings,/\/api\//);});

test('Preview diagnostics and cache cleanup live only in the separate debug interface',()=>{assert.doesNotMatch(settings,/PREFERENCE_PREFIX|CACHE_PREFIX|caches\.delete|Experience selector/);assert.match(debug,/PREFERENCE_PREFIX/);assert.match(debug,/CACHE_PREFIX='growth-compass-preview2-e2-'/);assert.match(debug,/const owned=names\.filter\(name=>name\.startsWith\(CACHE_PREFIX\)\)/);assert.match(debug,/Promise\.all\(owned\.map\(name=>caches\.delete\(name\)\)\)/);assert.doesNotMatch(debug,/Promise\.all\(names\.map\(name=>caches\.delete\(name\)\)\)/);assert.match(debugHtml,/Preview 2 debug/);});

test('Settings exposes theme and an accessibility-safe reduce-motion option',()=>{assert.match(settings,/value="dark"/);assert.match(settings,/value="light"/);assert.match(settings,/value="system"/);assert.match(settings,/value="reduce"/);assert.match(css,/html\[data-motion="reduce"\]/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);});

test('saved Experience 2 presentation preferences are applied by a CSP-safe external script before styles paint',()=>{assert.match(bootstrap,/growth-compass:preview2:e2:/);assert.match(bootstrap,/`\$\{prefix\}theme`/);assert.match(bootstrap,/`\$\{prefix\}motion`/);assert.match(bootstrap,/value==='system'/);assert.match(bootstrap,/prefers-color-scheme: dark/);assert.match(bootstrap,/root\.dataset\.theme=resolved\(stored\)/);assert.match(bootstrap,/dataset\.motion='reduce'/);assert.match(bootstrap,/#f3f0e8/);assert.match(bootstrap,/#151714/);const script=html.indexOf('<script src="/experience/2/js/theme-bootstrap.js"></script>');const styles=html.indexOf('<link rel="stylesheet" href="/experience/2/css/foundation.css">');assert.ok(script>=0&&styles>script,'presentation bootstrap must execute before Experience 2 stylesheets');assert.doesNotMatch(html,/<script>(?![\s\S]*src=)/);});

test('editorial theme bootstrap supports only dark light and system and retires palette state',()=>{assert.match(bootstrap,/new Set\(\['dark','light','system'\]\)/);assert.match(bootstrap,/delete root\.dataset\.palette/);assert.doesNotMatch(bootstrap,/applyPaletteAppearance|lightPaletteSet|palette-appearance-v2/);});

test('Experience 2 offline shell includes Settings and pre-paint presentation bootstrap and remains namespace-versioned',()=>{assert.match(sw,/growth-compass-preview2-e2-v\d+/);assert.match(sw,/\/experience\/2\/css\/settings\.css/);assert.match(sw,/\/experience\/2\/js\/views\/settings\.js/);assert.match(sw,/\/experience\/2\/js\/theme-bootstrap\.js/);assert.match(sw,/key\.startsWith\('growth-compass-preview2-e2-'\)/);});
