import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const shellCss = await readFile(new URL('../public/css/navigation-shell.css', import.meta.url), 'utf8');
const appJs = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `Missing ${start}`);
  const to = source.indexOf(end, from);
  assert.ok(to > from, `Missing ${end}`);
  return source.slice(from, to + end.length);
}

test('Revision A shell stylesheet loads after design tokens and before module sheets', () => {
  const design = indexHtml.indexOf('/css/design-system.css');
  const shell = indexHtml.indexOf('/css/navigation-shell.css');
  const modules = indexHtml.indexOf('/css/module-sheets.css');
  assert.ok(design >= 0);
  assert.ok(shell > design);
  assert.ok(modules > shell);
});

test('mobile main navigation makes Wellness first-class while Logger stays centered', () => {
  const nav = between(indexHtml, '<nav class="bottom-nav"', '</nav>');
  const today = nav.indexOf('data-view="today"');
  const plan = nav.indexOf('data-view="plan"');
  const add = nav.indexOf('id="quickAddBtn"');
  const progress = nav.indexOf('data-view="progress"');
  const wellness = nav.indexOf('data-view="wellness-boost"');
  assert.ok(today >= 0 && today < plan && plan < add && add < progress && progress < wellness);
  assert.match(nav, /quickAddBtn[^>]*nav-add[^>]*data-open-logger/);
  assert.doesNotMatch(nav.match(/id="quickAddBtn"[^>]*>/)?.[0] || '', /data-view=/);
  assert.match(nav, /data-view="wellness-boost"[^>]*aria-label="Wellness Boost"/);
  assert.doesNotMatch(nav, /data-view="insights"/);
});

test('mobile header keeps Insights reachable as a labeled secondary section without duplicating Log', () => {
  assert.match(indexHtml, /id="insightsBtn"[^>]*aria-label="Open Insights"[^>]*>[\s\S]*?<b class="top-section-label">Insights<\/b>/);
  assert.match(shellCss, /\.top-section-btn\{[^}]*display:inline-flex/s);
  assert.match(shellCss, /@media \(max-width:760px\)\{\s*\.top-log-btn\{display:none\}/s);
  assert.match(shellCss, /@media \(min-width:900px\)[\s\S]*?\.top-section-btn\{display:none\}/);
  assert.match(appJs, /insightsBtn/);
  assert.match(appJs, /showView\('insights'\)/);
});

test('navigation shell is phone-first safe-area aware and keeps frequent controls at touch size', () => {
  assert.match(shellCss, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(shellCss, /env\(safe-area-inset-bottom\)/);
  assert.match(shellCss, /min-height:var\(--gc-target-min\)/);
  assert.match(shellCss, /\.nav-add\{[^}]*width:64px[^}]*height:64px/s);
  assert.match(shellCss, /overflow-x:clip/);
  assert.match(shellCss, /@media \(max-width:420px\)/);
});

test('desktop presentation keeps all major destinations in the persistent rail', () => {
  assert.match(shellCss, /@media \(min-width:900px\)/);
  assert.match(shellCss, /\.bottom-nav\{display:none\}/);
  assert.match(shellCss, /\.app-rail\{[^}]*position:sticky[^}]*display:flex/s);
  assert.match(shellCss, /grid-template-columns:238px minmax\(0,1fr\)/);

  const rail = between(indexHtml, '<nav class="rail-nav"', '</nav>');
  for (const view of ['today', 'plan', 'progress', 'insights', 'wellness-boost']) {
    assert.match(rail, new RegExp(`data-view="${view}"`));
  }
});

test('active primary navigation is semantic as well as visual', () => {
  const todayCurrent = indexHtml.match(/data-view="today"[^>]*aria-current="page"/g) || [];
  assert.equal(todayCurrent.length, 2);
  assert.match(appJs, /setAttribute\('aria-current', 'page'\)/);
  assert.match(appJs, /removeAttribute\('aria-current'\)/);
  assert.match(appJs, /button\.dataset\.view === name/);
});

test('decorative navigation symbols stay out of accessible names', () => {
  const bottomNav = between(indexHtml, '<nav class="bottom-nav"', '</nav>');
  const railNav = between(indexHtml, '<nav class="rail-nav"', '</nav>');
  assert.doesNotMatch(bottomNav, /<span>(?:⌂|◎|＋|↗|✦|☼)<\/span>/);
  assert.doesNotMatch(railNav, /<span>(?:⌂|◎|↗|✦|☼)<\/span>/);
  assert.match(bottomNav, /aria-hidden="true"/);
  assert.match(railNav, /aria-hidden="true"/);
});
