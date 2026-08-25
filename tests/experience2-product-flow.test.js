import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const index=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const onboarding=await readFile(new URL('../public/experience/2/js/onboarding-v2.js',import.meta.url),'utf8');
const tutorial=await readFile(new URL('../public/experience/2/js/tutorial.js',import.meta.url),'utf8');
const settings=await readFile(new URL('../public/experience/2/js/views/settings.js',import.meta.url),'utf8');
const coaching=await readFile(new URL('../public/experience/2/js/contextual-coaching.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/product-simplification.css',import.meta.url),'utf8');

test('Experience 2 teaches one four-destination mental model',()=>{const dock=index.match(/<nav class="mobile-dock"[\s\S]*?<\/nav>/)?.[0]||'';for(const view of ['today','compass','patterns','reflect'])assert.match(dock,new RegExp(`data-view="${view}"`));assert.equal((dock.match(/data-primary-nav/g)||[]).length,4);assert.match(index,/rail-more/);assert.match(index,/product-simplification\.css/);});
test('zero-data setup is a three-step doing flow that creates real work',()=>{assert.match(onboarding,/step:1/);assert.match(onboarding,/state\.step===2/);assert.match(onboarding,/state\.step===3/);assert.match(onboarding,/goalsCapability\.create/);assert.match(onboarding,/activitiesCapability\.create/);assert.match(onboarding,/api\.post\('\/v1\/daily-plan'/);assert.match(onboarding,/Routine setup can wait/);});
test('tutorial is manual-only and contextual coaching owns first-use teaching',()=>{assert.doesNotMatch(tutorial,/MutationObserver|maybeStart|eligibleForAutomaticStart/);assert.match(tutorial,/gc:start-tutorial/);assert.match(coaching,/coach-compass-seen-v1/);assert.match(coaching,/patterns-view:not\(\.is-baseline\)/);});
test('normal settings contains product settings and export, not preview diagnostics',()=>{assert.match(settings,/Appearance, data and help/);assert.match(settings,/Your data/);assert.match(settings,/Export my data/);assert.match(settings,/Open full tutorial/);assert.doesNotMatch(settings,/Preview 2|offline cache|Experience selector|Reset Experience 2|CACHE_PREFIX|PREFERENCE_PREFIX/);});
test('visual simplification removes card competition and glass decoration',()=>{assert.match(css,/\.today-side-column\{display:none/);assert.match(css,/\.living-surface::before\{display:none/);assert.match(css,/gc-context-coach/);assert.match(css,/gc-onboard-sheet/);});
