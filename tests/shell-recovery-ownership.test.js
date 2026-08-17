import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const recoveryCss = await readFile(new URL('public/css/functional-recovery.css', root), 'utf8');
const shellCss = await readFile(new URL('public/css/navigation-shell.css', root), 'utf8');

function importantCount(source) {
  return (source.replace(/\/\*[\s\S]*?\*\//g, '').match(/!important/g) || []).length;
}

test('shell owns Explore presentation without a late global recovery override', () => {
  assert.doesNotMatch(recoveryCss, /\.top-more|\.topbar/);
  assert.match(shellCss, /\.top-more>summary\{/);
  assert.match(shellCss, /\.top-more-menu\{/);
  assert.match(shellCss, /\.os-shell \.top-more>summary\{/);
});

test('functional recovery shrinkage is ratcheted after Explore cleanup', () => {
  assert.ok(recoveryCss.length <= 8623, `functional recovery grew to ${recoveryCss.length} bytes`);
  assert.ok(importantCount(recoveryCss) <= 32, `functional recovery grew to ${importantCount(recoveryCss)} !important declarations`);
});
