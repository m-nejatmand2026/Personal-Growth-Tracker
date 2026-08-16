import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const shellCss = await readFile(new URL('../public/css/navigation-shell.css', import.meta.url), 'utf8');
const currentCss = await readFile(new URL('../public/css/figma-current.css', import.meta.url), 'utf8');
const rebuildCss = await readFile(new URL('../public/css/product-rebuild.css', import.meta.url), 'utf8');
const pagesCss = await readFile(new URL('../public/css/product-rebuild-pages.css', import.meta.url), 'utf8');
const appJs = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');

function between(source, start, end) { const from = source.indexOf(start); assert.ok(from >= 0, `Missing ${start}`); const to = source.indexOf(end, from); assert.ok(to > from, `Missing ${end}`); return source.slice(from, to + end.length); }

test('shell foundation loads before Product Rebuild overrides', () => { const design=indexHtml.indexOf('/css/design-system.css');const shell=indexHtml.indexOf('/css/navigation-shell.css');const rebuild=indexHtml.indexOf('/css/product-rebuild.css');assert.ok(design>=0&&shell>design&&rebuild>shell); });

test('mobile primary navigation is exactly Today Plan Add Progress Wellness', () => { const nav=between(indexHtml,'<nav class="bottom-nav"','</nav>'); const today=nav.indexOf('data-view="today"');const plan=nav.indexOf('data-view="plan"');const add=nav.indexOf('id="quickAddBtn"');const progress=nav.indexOf('data-view="progress"');const wellness=nav.indexOf('data-view="wellness-boost"');assert.ok(today>=0&&today<plan&&plan<add&&add<progress&&progress<wellness);assert.match(nav,/quickAddBtn[^>]*nav-add[^>]*data-open-logger/);assert.match(nav,/aria-label="Add activity"/);assert.match(nav,/<b>Add<\/b>/);assert.doesNotMatch(nav.match(/id="quickAddBtn"[^>]*>/)?.[0]||'',/data-view=/);assert.doesNotMatch(nav,/data-view="insights"/); });

test('secondary destinations are behind one accessible Explore control', () => { assert.match(indexHtml,/<details id="topMore" class="top-more">/);assert.match(indexHtml,/aria-label="Explore Insights, Journal and Settings"/);assert.match(indexHtml,/class="top-more-label">Explore/);for(const id of ['insightsBtn','journalBtn','settingsBtn'])assert.match(indexHtml,new RegExp(`id="${id}"`));assert.match(rebuildCss,/\.topbar\{position:fixed!important/);assert.match(appJs,/function closeTopMore\(\)/);assert.match(appJs,/showView\('insights'\)/); });

test('mobile shell remains safe-area aware and touch sized', () => { assert.match(currentCss,/height:calc\(80px \+ env\(safe-area-inset-bottom\)\)/);assert.match(shellCss,/env\(safe-area-inset-bottom\)/);assert.match(rebuildCss,/\.bottom-nav \.nav-add\{[^}]*height:58px!important/s);assert.match(rebuildCss,/min-height:44px/); });

test('desktop rail keeps primary routes persistent while secondary routes stay in Explore', () => { const rail=between(indexHtml,'<aside class="app-rail"','</aside>');for(const view of ['today','plan','progress','wellness-boost'])assert.match(rail,new RegExp(`data-view="${view}"`));assert.doesNotMatch(rail,/data-view="insights"|id="journalRailBtn"|id="settingsRailBtn"/);assert.match(indexHtml,/id="topMore"/);assert.match(rail,/rail-log-btn[\s\S]*?Add activity/);assert.match(currentCss,/\.app-rail\{position:fixed!important/); });

test('active primary navigation is semantic as well as visual', () => { const todayCurrent=indexHtml.match(/data-view="today"[^>]*aria-current="page"/g)||[];assert.equal(todayCurrent.length,2);assert.match(appJs,/setAttribute\('aria-current',\s*'page'\)/);assert.match(appJs,/removeAttribute\('aria-current'\)/); });

test('decorative nav symbols stay out of accessible names and use one outline icon system', () => { const bottomNav=between(indexHtml,'<nav class="bottom-nav"','</nav>');const rail=between(indexHtml,'<aside class="app-rail"','</aside>');assert.match(bottomNav,/aria-hidden="true"/);assert.match(rail,/aria-hidden="true"/);assert.match(pagesCss,/Coherent outline nav icons using masks/);assert.match(pagesCss,/mask-image:url/); });
