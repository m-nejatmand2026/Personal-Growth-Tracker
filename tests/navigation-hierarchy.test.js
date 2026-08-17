import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const indexSource = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const shellCss = await readFile(new URL('../public/css/navigation-shell.css', import.meta.url), 'utf8');
const finalCss = await readFile(new URL('../public/css/accessibility-regression.css', import.meta.url), 'utf8');

test('secondary Explore destinations do not become primary navigation state', () => {
  const primarySet = appSource.match(/PRIMARY_VIEWS=new Set\(\[([^\]]+)\]\)/)?.[1] || '';
  assert.match(primarySet, /'today'/);
  assert.match(primarySet, /'plan'/);
  assert.match(primarySet, /'progress'/);
  assert.match(primarySet, /'wellness-boost'/);
  assert.doesNotMatch(primarySet, /'insights'|'journal'|'settings'/);
});

test('mobile primary navigation remains Today, Plan, Add, Progress, Wellness', () => {
  const nav = indexSource.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.match(nav, /data-view="today"[^>]*>[\s\S]*?Today<\/button>/);
  assert.match(nav, /data-view="plan"[^>]*>[\s\S]*?Plan<\/button>/);
  assert.match(nav, /id="quickAddBtn"[^>]*>[\s\S]*?<b>Add<\/b>/);
  assert.match(nav, /data-view="progress"[^>]*>[\s\S]*?Progress<\/button>/);
  assert.match(nav, /data-view="wellness-boost"[^>]*>[\s\S]*?Wellness<\/button>/);
  assert.doesNotMatch(nav, />Insights<\/button>|>Journal<\/button>|>Settings<\/button>/);
});

test('desktop keeps secondary destinations behind the labeled Explore control', () => {
  const rail = indexSource.match(/<aside class="app-rail"[\s\S]*?<\/aside>/)?.[0] || '';
  assert.doesNotMatch(rail, />Insights<\/b>|>Journal<\/b>|>Settings<\/b>/);
  assert.match(indexSource, /<span class="top-more-label">Explore<\/span>/);
  assert.match(indexSource, /<button id="insightsBtn"[^>]*><strong>Insights<\/strong>/);
  assert.match(indexSource, /<button id="journalBtn"[^>]*><strong>Journal<\/strong>/);
  assert.match(indexSource, /<button id="settingsBtn"[^>]*><strong>Settings<\/strong>/);
  assert.match(shellCss, /@media \(min-width:900px\)[\s\S]*\.topbar\{display:flex;position:fixed;z-index:95/);
  assert.match(shellCss, /\.topbar-title\{display:none\}[\s\S]*\.top-actions\{display:flex\}/);
  assert.doesNotMatch(finalCss, /@media\(min-width:900px\)[\s\S]*\.topbar/);
});
