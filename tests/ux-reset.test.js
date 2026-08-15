import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const resetCss = await readFile(new URL('../public/css/ux-reset.css', import.meta.url), 'utf8');
const accessibilityCss = await readFile(new URL('../public/css/accessibility-regression.css', import.meta.url), 'utf8');
const planJs = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const progressJs = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const insightsJs = await readFile(new URL('../public/js/modules/insights/ui.js', import.meta.url), 'utf8');
const journalJs = await readFile(new URL('../public/js/modules/journal/module.js', import.meta.url), 'utf8');
const todayJs = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `Missing ${start}`);
  const to = source.indexOf(end, from);
  assert.ok(to > from, `Missing ${end}`);
  return source.slice(from, to + end.length);
}

test('Revision C presentation layer loads after shared experience styling and before accessibility safeguards', () => {
  const framework = indexHtml.indexOf('/css/experience-framework.css');
  const reset = indexHtml.indexOf('/css/ux-reset.css');
  const accessibility = indexHtml.indexOf('/css/accessibility-regression.css');
  assert.ok(framework >= 0 && reset > framework && accessibility > reset);
});

test('Revision C keeps Today action-first without moving business logic into composition', () => {
  const render = todayJs.slice(todayJs.indexOf('root.innerHTML'));
  assert.ok(render.indexOf('today-command') < render.indexOf('${dailyPlanPanel}'));
  assert.match(render, /command-log-btn/);
  assert.match(render, /> Add<\/button>/);
  assert.doesNotMatch(todayJs, /\/api\/v1\/capacity|\/api\/v1\/progress|\/api\/v1\/wellbeing/);
});

test('Plan uses progressive disclosure while preserving module-owned rendering and dependencies', () => {
  assert.match(planJs, /<details class="plan-module-disclosure"/);
  assert.match(planJs, /plan-module-summary/);
  assert.match(planJs, /module\.render\(\{ date, models \}\)/);
});

test('Progress foregrounds recent facts and moves goal guidance behind progressive disclosure', () => {
  assert.match(progressJs, /<details class="progress-breakdown"/);
  assert.match(progressJs, /<summary>By goal<\/summary>/);
  assert.ok(progressJs.indexOf('progress-history') < progressJs.indexOf('progress-breakdown'));
});

test('Insights shows current evidence state first and keeps methodology on demand', () => {
  assert.match(insightsJs, /<details class="insights-method"/);
  assert.match(insightsJs, /<summary>How insights work<\/summary>/);
  assert.ok(insightsJs.indexOf('insights-evidence-card') < insightsJs.indexOf('insights-method'));
});

test('evidence-backed mobile simplification keeps state and Progress compact without shrinking targets', () => {
  assert.match(resetCss, /#todayView \.state-card \{[\s\S]*min-height: 78px;/);
  assert.match(resetCss, /@media \(max-width: 680px\)/);
  assert.match(accessibilityCss, /min-height:\s*var\(--gc-target-min\)/);
});

test('mobile topbar uses one accessible More control and desktop delegates actions to the rail', () => {
  const top = between(indexHtml, '<div class="top-actions">', '</div>\n      </header>');
  assert.match(top, /id="topMore"/);
  assert.match(top, /aria-label="More sections and settings"/);
  assert.match(indexHtml, /class="app-rail"/);
});

test('Journal does not repeat the shell-owned destination title', () => {
  assert.doesNotMatch(journalJs, /<h2>Journal<\/h2>/);
});

test('Revision C reduces explanatory chrome while preserving minimum touch targets', () => {
  assert.match(resetCss, /\.today-command \{[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(resetCss, /\.command-log-btn \{[\s\S]*min-height: var\(--gc-target-min\);/);
  assert.match(resetCss, /\.plan-module-summary \{[\s\S]*min-height: 56px;/);
  assert.match(resetCss, /#loggerActivityQuery \{[\s\S]*min-height: 52px;/);
  assert.doesNotMatch(resetCss, /min-height:\s*(?:3[0-9]|4[0-3])px/);
});

test('Logger visual simplification preserves its mode legend and dynamic guidance for assistive technology', () => {
  assert.match(
    accessibilityCss,
    /\.logger-mode-fieldset legend,\s*\.logger-mode-hint\s*\{[\s\S]*display: block;[\s\S]*position: absolute;[\s\S]*inline-size: 1px;[\s\S]*clip-path: inset\(50%\);/
  );
});

test('primary capture wording stays consistent while shell icons use the shared SVG family', () => {
  assert.match(indexHtml, /rail-log-btn[^>]*>[\s\S]*?gc-icon-add[\s\S]*? Add<\/button>/);
  assert.match(indexHtml, /top-log-btn[^>]*>[\s\S]*?gc-icon-add[\s\S]*?<span>Add<\/span>/);
  assert.match(indexHtml, /id="quickAddBtn"[\s\S]*?gc-icon-add[\s\S]*?<b>Add<\/b>/);
  assert.match(indexHtml, /id="gc-icon-compass"/);
  assert.match(indexHtml, /id="gc-icon-today"/);
  assert.match(indexHtml, /id="gc-icon-plan"/);
  assert.match(indexHtml, /id="gc-icon-progress"/);
  assert.match(indexHtml, /id="gc-icon-wellness"/);
});