import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const today = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const plan = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const progress = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const insights = await readFile(new URL('../public/js/modules/insights/ui.js', import.meta.url), 'utf8');
const journal = await readFile(new URL('../public/js/modules/journal/module.js', import.meta.url), 'utf8');
const rebuildCss = await readFile(new URL('../public/css/product-rebuild.css', import.meta.url), 'utf8');
const pagesCss = await readFile(new URL('../public/css/product-rebuild-pages.css', import.meta.url), 'utf8');
const accessibilityCss = await readFile(new URL('../public/css/accessibility-regression.css', import.meta.url), 'utf8');

test('Product Rebuild layers override rejected Current presentation and accessibility remains last', () => { const semantics=indexHtml.indexOf('/css/figma-current-semantics.css');const rebuild=indexHtml.indexOf('/css/product-rebuild.css');const pages=indexHtml.indexOf('/css/product-rebuild-pages.css');const accessibility=indexHtml.indexOf('/css/accessibility-regression.css');assert.ok(semantics>=0&&semantics<rebuild&&rebuild<pages&&pages<accessibility); });
test('Today puts daily action and capacity first without moving business logic into composition', () => { assert.match(today,/\$\{dailyPlanPanel\}[\s\S]*\$\{capacityCard\(capacityModel\)\}/);assert.match(today,/gc-today-more/);assert.doesNotMatch(today,/\/api\/v1\/|fetch\(/); });
test('Plan uses progressive disclosure while preserving module-owned rendering and dependencies', () => { assert.match(plan,/<details class="plan-module-block plan-module-disclosure"/);assert.match(plan,/module\.id === 'goals' \? 'open' : ''/);assert.match(plan,/module\.render\(/);assert.match(plan,/module\.bind\(/);assert.doesNotMatch(plan,/\/api\/v1\//); });
test('Progress foregrounds factual evidence and keeps interpretation out', () => { assert.match(progress,/<h2 id="progressCurrentTitle">Progress<\/h2>/);assert.match(progress,/Recent activity/);assert.match(progress,/By goal/);assert.match(progress,/Evidence only here\. Interpretation belongs in Insights\./); });
test('Insights shows evidence readiness first and keeps methodology on demand', () => { assert.match(insights,/<h2 id="insightsCurrentTitle">Insights<\/h2>/);assert.match(insights,/Evidence readiness/);assert.match(insights,/No defensible matched pattern yet/);assert.match(insights,/<details class="gc-insight-method">/); });
test('mobile navigation exposes five primary destinations plus accessible Explore', () => { assert.match(indexHtml,/id="quickAddBtn"[\s\S]*?<b>Add<\/b>/);assert.match(indexHtml,/aria-label="Add activity"/);assert.match(indexHtml,/<details id="topMore" class="top-more">/);for(const id of ['insightsBtn','journalBtn','settingsBtn'])assert.match(indexHtml,new RegExp(`id="${id}"`));assert.match(rebuildCss,/\.topbar\{position:fixed!important/);assert.match(app,/function closeTopMore\(\)/); });
test('desktop rail keeps primary navigation separate from Add and Explore', () => { const rail=indexHtml.match(/<aside class="app-rail"[\s\S]*?<\/aside>/)?.[0]||'';assert.match(rail,/data-view="today" class="rail-nav-btn active"/);assert.match(rail,/data-view="wellness-boost" class="rail-nav-btn"/);assert.doesNotMatch(rail,/data-view="insights"|journalRailBtn|settingsRailBtn/);assert.match(indexHtml,/id="topMore"/);assert.match(rail,/rail-log-btn[^>]*>[\s\S]*?Add activity<\/button>/);assert.match(rebuildCss,/\.rail-log-btn\{background:var\(--gc-brand\)!important/); });
test('Journal uses a destination heading and preserves its privacy boundary', () => { assert.match(journal,/<h2 id="journalCurrentTitle">Journal<\/h2>/);assert.match(journal,/Journal text is not used by Progress, Insights or AI in this Beta/); });
test('Logger semantic guidance remains available for assistive technology', () => { assert.match(accessibilityCss,/\.logger-mode-fieldset legend,\s*\.logger-mode-hint/); });
test('Product Rebuild preserves touch floors and reduced motion', () => { assert.match(rebuildCss,/min-height:44px/);assert.match(rebuildCss,/@media\(prefers-reduced-motion:reduce\)/);assert.match(pagesCss,/@media\(prefers-reduced-motion:reduce\)/); });
