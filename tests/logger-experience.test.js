import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const loggerJs = await readFile(new URL('../public/js/modules/logger/ui.js', import.meta.url), 'utf8');
const loggerCss = await readFile(new URL('../public/css/modules/logger.css', import.meta.url), 'utf8');

test('Logger easy path keeps meaning Activity and duration ahead of optional details', () => {
  const render = loggerJs.slice(loggerJs.indexOf('host.innerHTML'));
  const mode = render.indexOf('logger-mode-fieldset');
  const primary = render.indexOf('logger-primary-grid');
  const activity = render.indexOf('id="loggerActivity"');
  const duration = render.indexOf('id="loggerDuration"');
  const advanced = render.indexOf('class="logger-advanced"');
  const subtype = render.indexOf('id="loggerSubtype"');
  const date = render.indexOf('id="loggerDate"');
  const start = render.indexOf('id="loggerStartTime"');
  const note = render.indexOf('id="loggerNote"');
  const save = render.indexOf('id="loggerSaveButton"');
  assert.ok(mode >= 0 && mode < primary && primary < activity && activity < duration && duration < advanced);
  assert.ok(advanced < subtype && subtype < date && date < start && start < note && note < save);
  assert.match(render, /More details <span>optional<\/span>/);
});

test('Logger preserves Plan Doing now Done semantics and only Done writes factual Progress', () => {
  assert.match(loggerJs, />Plan</);
  assert.match(loggerJs, /Doing now/);
  assert.match(loggerJs, />Done</);
  assert.match(loggerJs, /does not count as completed progress/);
  assert.match(loggerJs, /does not record completed minutes yet/);
  assert.match(loggerJs, /Records what actually happened/);
  const planWrite = loggerJs.indexOf("api('/api/v1/daily-plan'");
  const progressWrite = loggerJs.indexOf("api('/api/v1/progress'");
  assert.ok(planWrite >= 0 && planWrite < progressWrite);
  assert.match(loggerJs, /if \(entryMode === 'planned' \|\| entryMode === 'in_progress'\)/);
  assert.match(loggerJs, /return;\s*}\s*\n\s*const response = await api\('\/api\/v1\/progress'/s);
});

test('optional start time maps to the correct Plan and Progress fields', () => {
  assert.match(loggerJs, /id="loggerStartTime" type="time"/);
  assert.match(loggerJs, /planned_time: startTime/);
  assert.match(loggerJs, /started_at: startTime \? `\$\{occurredOn\}T\$\{startTime\}:00` : null/);
  assert.match(loggerJs, /Doing now must use Today/);
});

test('Logger remains generic and canonical', () => {
  assert.match(loggerJs, /\/api\/v1\/activities/);
  assert.match(loggerJs, /\/api\/v1\/progress/);
  assert.match(loggerJs, /\/api\/v1\/daily-plan/);
  assert.doesNotMatch(loggerJs, /\/api\/session/);
  assert.match(loggerJs, /focus, variation, subtask/i);
  assert.doesNotMatch(loggerJs, /German|Guitar|Calisthenics|Reading|Back, Abs|Vocabulary|Chords/i);
});

test('Logger presentation is phone-first and upgrades to a centered desktop dialog', () => {
  assert.match(loggerCss, /\.logger-panel\{[^}]*left:0[^}]*right:0[^}]*bottom:0/s);
  assert.match(loggerCss, /env\(safe-area-inset-bottom\)/);
  assert.match(loggerCss, /@media \(min-width:640px\)/);
  assert.match(loggerCss, /transform:translate\(-50%,-50%\)/);
  assert.match(loggerCss, /\.duration-presets\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/s);
  assert.match(loggerCss, /min-height:var\(--gc-target-min\)/);
});

test('Logger CSS is module-owned and loaded after other Today contributors', () => {
  assert.doesNotMatch(loggerCss, /daily-plan|journal|time-reality|today-goal|energy-grid|progress-dashboard/);
  const progressToday = indexHtml.indexOf('/css/modules/progress-today.css');
  const logger = indexHtml.indexOf('/css/modules/logger.css');
  const sheets = indexHtml.indexOf('/css/module-sheets.css');
  assert.ok(progressToday >= 0 && progressToday < logger && logger < sheets);
});
