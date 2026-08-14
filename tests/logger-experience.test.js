import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const appJs = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const loggerJs = await readFile(new URL('../public/js/modules/logger/ui.js', import.meta.url), 'utf8');
const loggerManifest = await readFile(new URL('../public/js/modules/logger/manifest.js', import.meta.url), 'utf8');
const activitiesJs = await readFile(new URL('../public/js/modules/activities/module.js', import.meta.url), 'utf8');
const loggerCss = await readFile(new URL('../public/css/modules/logger.css', import.meta.url), 'utf8');
const navCss = await readFile(new URL('../public/css/navigation-shell.css', import.meta.url), 'utf8');

test('Revision B Logger keeps meaning Activity and duration on the easy path', () => {
  const render = loggerJs.slice(loggerJs.indexOf('host.innerHTML'));
  const mode = render.indexOf('logger-mode-fieldset');
  const primary = render.indexOf('logger-primary-grid');
  const activity = render.indexOf('id="loggerActivityQuery"');
  const duration = render.indexOf('id="loggerDuration"');
  const repeats = render.indexOf('class="logger-repeats"');
  const advanced = render.indexOf('class="logger-advanced"');
  const subtype = render.indexOf('id="loggerSubtype"');
  const date = render.indexOf('id="loggerDate"');
  const start = render.indexOf('id="loggerStartTime"');
  const note = render.indexOf('id="loggerNote"');
  const save = render.indexOf('id="loggerSaveButton"');
  assert.ok(mode >= 0 && mode < primary && primary < activity && activity < duration);
  assert.ok(duration < repeats && repeats < advanced);
  assert.ok(advanced < subtype && subtype < date && date < start && start < note && note < save);
  assert.match(render, /What did you do\?/);
  assert.match(render, /How long\?/);
  assert.match(render, /More details/);
  assert.match(render, /Focus, date, time, note/);
  assert.match(render, /logger-disclosure-icon/);
});

test('Logger uses human-facing Plan Start now Done while only Done writes factual Progress', () => {
  assert.match(loggerJs, />Plan</);
  assert.match(loggerJs, />Start now</);
  assert.match(loggerJs, />Done</);
  assert.match(loggerJs, /does not count as completed Progress/);
  assert.match(loggerJs, /does not record completed Progress yet/);
  assert.match(loggerJs, /Record what actually happened as factual Progress/);
  const planWrite = loggerJs.indexOf("api('/api/v1/daily-plan'");
  const progressWrite = loggerJs.indexOf("api('/api/v1/progress'");
  assert.ok(planWrite >= 0 && planWrite < progressWrite);
  assert.match(loggerJs, /if \(entryMode === 'planned' \|\| entryMode === 'in_progress'\)/);
  assert.match(loggerJs, /return;\s*}\s*\n\s*const response = await api\('\/api\/v1\/progress'/s);
});

test('contextual Activity creation stays behind the Activities public capability', () => {
  assert.match(loggerManifest, /dependsOn:\s*\['activities',\s*'progress',\s*'daily-plan'\]/);
  assert.match(appJs, /const activities = moduleRegistry\.get\('activities'\)/);
  assert.match(appJs, /create\(\{ onSaved: load, activities \}\)/);
  assert.match(loggerJs, /activityCapability\.create\(\{/);
  assert.match(loggerJs, /Create “\$\{String\(query\)\.trim\(\)\}” as a new Activity/);
  assert.match(loggerJs, /Which goal does this support\?/);
  assert.doesNotMatch(loggerJs, /\/api\/v1\/goals/);
  assert.doesNotMatch(loggerJs, /\/api\/v1\/activities/);
  assert.match(activitiesJs, /async creationContext\(\)/);
  assert.match(activitiesJs, /\/api\/v1\/goals/);
  assert.match(activitiesJs, /async create\(input\)/);
  assert.match(activitiesJs, /\/api\/v1\/activities/);
});

test('optional start time maps to the correct Plan and Progress fields', () => {
  assert.match(loggerJs, /id="loggerStartTime" type="time"/);
  assert.match(loggerJs, /planned_time: startTime/);
  assert.match(loggerJs, /started_at: startTime \? `\$\{occurredOn\}T\$\{startTime\}:00` : null/);
  assert.match(loggerJs, /Start now must use Today/);
});

test('Logger remains generic and canonical', () => {
  assert.match(loggerJs, /\/api\/v1\/progress/);
  assert.match(loggerJs, /\/api\/v1\/daily-plan/);
  assert.doesNotMatch(loggerJs, /\/api\/session/);
  assert.match(loggerJs, /Focus \/ variation/);
  assert.doesNotMatch(loggerJs, /German|Guitar|Calisthenics|Reading|Back, Abs|Vocabulary/i);
});

test('Logger presentation is phone-first and contextual creation is touch friendly', () => {
  assert.match(loggerCss, /\.logger-panel\{[^}]*left:0[^}]*right:0[^}]*bottom:0/s);
  assert.match(loggerCss, /env\(safe-area-inset-bottom\)/);
  assert.match(loggerCss, /@media \(min-width:640px\)/);
  assert.match(loggerCss, /transform:translate\(-50%,-50%\)/);
  assert.match(loggerCss, /\.duration-presets\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/s);
  assert.match(loggerCss, /\.logger-create-activity-toggle\{[^}]*min-height:var\(--gc-target-min\)/s);
  assert.match(loggerCss, /\.logger-activity-option\{[^}]*min-height:var\(--gc-target-min\)/s);
});

test('mobile center Logger action uses geometry instead of a font glyph for optical centering', () => {
  assert.match(navCss, /\.nav-add>span\{[^}]*width:24px[^}]*height:24px[^}]*font-size:0!important/s);
  assert.match(navCss, /\.nav-add>span::before,\.nav-add>span::after\{[^}]*left:50%[^}]*top:50%[^}]*translate\(-50%,-50%\)/s);
  assert.match(navCss, /\.nav-add>span::after\{[^}]*rotate\(90deg\)/s);
});

test('Logger CSS is module-owned and loaded after other Today contributors', () => {
  assert.doesNotMatch(loggerCss, /daily-plan|journal|time-reality|today-goal|energy-grid|progress-dashboard/);
  const progressToday = indexHtml.indexOf('/css/modules/progress-today.css');
  const logger = indexHtml.indexOf('/css/modules/logger.css');
  const sheets = indexHtml.indexOf('/css/module-sheets.css');
  assert.ok(progressToday >= 0 && progressToday < logger && logger < sheets);
});
