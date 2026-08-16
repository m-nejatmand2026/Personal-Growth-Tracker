import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const indexSource = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
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
  assert.match(nav, />Today<\/button>/);
  assert.match(nav, />Plan<\/button>/);
  assert.match(nav, /<b>Add<\/b>/);
  assert.match(nav, />Progress<\/button>/);
  assert.match(nav, />Wellness<\/button>/);
  assert.doesNotMatch(nav, />Insights<\/button>|>Journal<\/button>|>Settings<\/button>/);
});

test('desktop keeps secondary destinations behind the labeled Explore control', () => {
  const rail = indexSource.match(/<aside class="app-rail"[\s\S]*?<\/aside>/)?.[0] || '';
  assert.doesNotMatch(rail, />Insights<\/b>|>Journal<\/b>|>Settings<\/b>/);
  assert.match(indexSource, /<span class="top-more-label">Explore<\/span>/);
  assert.match(indexSource, /<button id="insightsBtn"[^>]*><strong>Insights<\/strong>/);
  assert.match(indexSource, /<button id="journalBtn"[^>]*><strong>Journal<\/strong>/);
  assert.match(indexSource, /<button id="settingsBtn"[^>]*><strong>Settings<\/strong>/);
  assert.match(finalCss, /@media\(min-width:900px\)\{\.top-actions\{display:flex!important\}\}/);
});
