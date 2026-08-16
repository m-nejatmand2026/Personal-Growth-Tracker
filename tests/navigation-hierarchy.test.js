import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const indexSource = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

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
