import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const appJs = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const loggerJs = await readFile(new URL('../public/js/modules/logger/ui.js', import.meta.url), 'utf8');
const loggerManifest = await readFile(new URL('../public/js/modules/logger/manifest.js', import.meta.url), 'utf8');
const activitiesJs = await readFile(new URL('../public/js/modules/activities/module.js', import.meta.url), 'utf8');
const loggerCss = await readFile(new URL('../public/css/modules/logger.css', import.meta.url), 'utf8');
const rebuildCss = await readFile(new URL('../public/css/product-rebuild.css', import.meta.url), 'utf8');
const pagesCss = await readFile(new URL('../public/css/product-rebuild-pages.css', import.meta.url), 'utf8');
const recoveryCss = await readFile(new URL('../public/css/functional-recovery.css', import.meta.url), 'utf8');

test('Product Rebuild Logger easy path is intent then Activity then duration then date then details', () => {
  const render = loggerJs.slice(loggerJs.indexOf('host.innerHTML'));
  const mode = render.indexOf('gc-intent-fieldset');
  const activity = render.indexOf('id="loggerActivityQuery"');
  const recent = render.indexOf('id="loggerRecentActivities"');
  const duration = render.indexOf('id="loggerDuration"');
  const when = render.indexOf('data-logger-when');
  const advanced = render.indexOf('gc-add-more');
  const subtype = render.indexOf('id="loggerSubtype"');
  const note = render.indexOf('id="loggerNote"');
  const save = render.indexOf('id="loggerSaveButton"');
  assert.ok(mode >= 0 && mode < activity && activity < recent && recent < duration && duration < when && when < advanced && advanced < subtype && subtype < note && note < save);
  assert.match(render, /Search or type an activity/);
  assert.match(render, /How long\?/);
  assert.match(render, /When\?/);
  assert.match(render, /More details/);
});

test('Logger uses human-facing Plan Start now Done while only Done writes factual Progress', () => {
  assert.match(loggerJs, />Plan</); assert.match(loggerJs, />Start now</); assert.match(loggerJs, />Done</);
  assert.match(loggerJs, /Plan adds an intention to your day — not Progress/);
  assert.match(loggerJs, /Start now creates an in-progress intention\. Progress waits until Done/);
  assert.match(loggerJs, /Done records factual Progress/);
  const planWrite = loggerJs.indexOf("api('/api/v1/daily-plan'");
  const progressWrite = loggerJs.indexOf("api('/api/v1/progress'");
  assert.ok(planWrite >= 0 && planWrite < progressWrite);
  assert.match(loggerJs, /if \(entryMode === 'planned' \|\| entryMode === 'in_progress'\)/);
});

test('contextual Activity creation stays behind the Activities public capability', () => {
  assert.match(loggerManifest, /dependsOn:\s*\['activities',\s*'progress',\s*'daily-plan'\]/);
  assert.match(appJs, /activities\s*=\s*moduleRegistry\.get\('activities'\)/);
  assert.match(appJs, /create\(\{\s*onSaved:\s*load,\s*activities\s*\}\)/);
  assert.match(loggerJs, /activityCapability\.create\(\{/);
  assert.match(loggerJs, /Create “\$\{String\(query\)\.trim\(\)\}”/);
  assert.match(loggerJs, /What does this support\?/);
  assert.match(loggerJs, /Activities are Goal-linked in the current Beta/);
  assert.doesNotMatch(loggerJs, /\/api\/v1\/goals/);
  assert.doesNotMatch(loggerJs, /\/api\/v1\/activities/);
  assert.match(activitiesJs, /async creationContext\(\)/);
  assert.match(activitiesJs, /async create\(input\)/);
});

test('optional start time maps to Plan and Progress correctly', () => {
  assert.match(loggerJs, /id="loggerStartTime" type="time"/);
  assert.match(loggerJs, /planned_time: startTime/);
  assert.match(loggerJs, /started_at: startTime \? `\$\{occurredOn\}T\$\{startTime\}:00` : null/);
  assert.match(loggerJs, /Start now must use Today/);
});

test('Logger remains generic and canonical', () => {
  assert.match(loggerJs, /\/api\/v1\/progress/); assert.match(loggerJs, /\/api\/v1\/daily-plan/); assert.doesNotMatch(loggerJs, /\/api\/session/); assert.match(loggerJs, /Focus \/ variation/); assert.doesNotMatch(loggerJs, /German|Guitar|Calisthenics|Back, Abs|Vocabulary/i);
});

test('Product Rebuild Logger is full-screen phone-first and touch friendly', () => {
  assert.match(rebuildCss, /\.gc-add-activity-sheet\{[^}]*width:min\(100%,620px\)/s);
  assert.match(rebuildCss, /@media\(max-width:760px\)[\s\S]*\.gc-add-activity-sheet\{position:fixed!important;inset:0!important/);
  assert.match(rebuildCss, /env\(safe-area-inset-bottom\)/);
  assert.match(rebuildCss, /\.logger-activity-option[^}]*min-height:56px/s);
  assert.match(rebuildCss, /\.gc-add-save[^}]*min-height:52px/s);
});

test('mobile center action is explicitly labeled Add and destination icons use one outline mask system', () => {
  assert.match(indexHtml, /id="quickAddBtn"[^>]*aria-label="Add activity"[\s\S]*?<b>Add<\/b>/);
  assert.match(rebuildCss, /\.bottom-nav \.nav-add\{[^}]*min-width:88px!important[^}]*height:58px!important/s);
  assert.match(pagesCss, /Coherent outline nav icons using masks/);
  assert.match(pagesCss, /mask-image:url/);
});

test('Logger owns recovered presentation after global recovery and before final safeguards', () => {
  assert.doesNotMatch(loggerCss, /daily-plan|journal|time-reality|today-goal|energy-grid|progress-dashboard/);
  assert.doesNotMatch(recoveryCss, /logger-backdrop|gc-add-activity-sheet|gc-intent-tabs|logger-activity-search|logger-save/);
  assert.match(loggerCss, /\.gc-add-activity-sheet\{/);
  const recovery = indexHtml.indexOf('/css/functional-recovery.css');
  const logger = indexHtml.indexOf('/css/modules/logger.css');
  const accessibility = indexHtml.indexOf('/css/accessibility-regression.css');
  assert.ok(recovery >= 0 && recovery < logger && logger < accessibility);
});
