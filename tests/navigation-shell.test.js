import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const shellCss = await readFile(new URL('../public/css/navigation-shell.css', import.meta.url), 'utf8');
const currentCss = await readFile(new URL('../public/css/figma-current.css', import.meta.url), 'utf8');
const liveCss = await readFile(new URL('../public/css/figma-current-live.css', import.meta.url), 'utf8');
const appJs = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `Missing ${start}`);
  const to = source.indexOf(end, from);
  assert.ok(to > from, `Missing ${end}`);
  return source.slice(from, to + end.length);
}

test('shell foundation loads before canonical Figma Current overrides', () => {
  const design = indexHtml.indexOf('/css/design-system.css');
  const shell = indexHtml.indexOf('/css/navigation-shell.css');
  const current = indexHtml.indexOf('/css/figma-current.css');
  assert.ok(design >= 0 && shell > design && current > shell);
});

test('mobile primary navigation is exactly Today Plan Add Progress Wellness', () => {
  const nav = between(indexHtml, '<nav class="bottom-nav"', '</nav>');
  const today = nav.indexOf('data-view="today"');
  const plan = nav.indexOf('data-view="plan"');
  const add = nav.indexOf('id="quickAddBtn"');
  const progress = nav.indexOf('data-view="progress"');
  const wellness = nav.indexOf('data-view="wellness-boost"');
  assert.ok(today >= 0 && today < plan && plan < add && add < progress && progress < wellness);
  assert.match(nav, /quickAddBtn[^>]*nav-add[^>]*data-open-logger/);
  assert.doesNotMatch(nav.match(/id="quickAddBtn"[^>]*>/)?.[0] || '', /data-view=/);
  assert.match(nav, /data-view="wellness-boost"[^>]*aria-label="Wellness"/);
  assert.doesNotMatch(nav, /data-view="insights"/);
});

test('mobile secondary destinations are behind one accessible More control without duplicating Logger', () => {
  assert.match(indexHtml, /<details id="topMore" class="top-more">/);
  assert.match(indexHtml, /aria-label="More sections and settings"/);
  assert.match(indexHtml, /id="insightsBtn" type="button">Insights<\/button>/);
  assert.match(indexHtml, /id="journalBtn" type="button">Journal<\/button>/);
  assert.match(indexHtml, /id="settingsBtn" type="button">Settings<\/button>/);
  assert.match(liveCss, /\.top-more>summary\{width:48px!important;height:48px!important/);
  assert.match(appJs, /function closeTopMore\(\)/);
  assert.match(appJs, /showView\('insights'\)/);
});

test('mobile Current shell is safe-area aware and keeps frequent controls touch-sized', () => {
  assert.match(currentCss, /height:calc\(80px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(currentCss, /grid-template-columns:repeat\(5,1fr\)/);
  assert.match(currentCss, /\.nav-btn\{[^}]*min-height:52px!important/s);
  assert.match(currentCss, /\.nav-add\{[^}]*width:56px!important[^}]*height:56px!important/s);
  assert.match(currentCss, /overflow/);
  assert.match(shellCss, /env\(safe-area-inset-bottom\)/);
});

test('desktop Current shell keeps primary routes persistent and secondary routes directly reachable', () => {
  assert.match(currentCss, /\.app-rail\{position:fixed!important/);
  assert.match(currentCss, /width:var\(--gc-desktop-rail-width\)!important/);
  assert.match(currentCss, /\.bottom-nav\{display:none!important\}/);
  const rail = between(indexHtml, '<aside class="app-rail"', '</aside>');
  for (const view of ['today', 'plan', 'progress', 'wellness-boost', 'insights']) assert.match(rail, new RegExp(`data-view="${view}"`));
  assert.match(rail, /id="journalRailBtn"/);
  assert.match(rail, /id="settingsRailBtn"/);
  assert.match(rail, /rail-log-btn[\s\S]*?Log activity/);
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
  const rail = between(indexHtml, '<aside class="app-rail"', '</aside>');
  assert.doesNotMatch(bottomNav, /<span>(?:⌂|◎|＋|↗|✦|☼)<\/span>/);
  assert.doesNotMatch(rail, /<span>(?:⌂|◎|↗|✦|☼)<\/span>/);
  assert.match(bottomNav, /aria-hidden="true"/);
  assert.match(rail, /aria-hidden="true"/);
});
