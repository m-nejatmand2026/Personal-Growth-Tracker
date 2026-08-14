import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const goalsUi = await readFile(new URL('../public/js/modules/goals/ui.js', import.meta.url), 'utf8');
const goalsCss = await readFile(new URL('../public/css/modules/goals.css', import.meta.url), 'utf8');
const goalsRoutes = await readFile(new URL('../worker/modules/goals/routes.js', import.meta.url), 'utf8');

test('Goal easy path explains progress methods with examples instead of data-model vocabulary', () => {
  assert.match(goalsUi, /How will you know you are making progress\?/);
  assert.match(goalsUi, /Time spent[\s\S]*3 hours of guitar/);
  assert.match(goalsUi, /Quantity[\s\S]*50 pages or 10 lessons/);
  assert.match(goalsUi, /Completed[\s\S]*submit the application/);
  assert.match(goalsUi, /Milestones[\s\S]*finish Level 1/);
  assert.doesNotMatch(goalsUi, />Measure by</);
  assert.doesNotMatch(goalsUi, />Target value</);
  assert.doesNotMatch(goalsUi, />Unit</);
});

test('human progress choices map onto the existing canonical Goal contract', () => {
  assert.match(goalsUi, /HUMAN_MEASUREMENTS = Object\.freeze\(\['time', 'count', 'boolean', 'milestone'\]\)/);
  assert.match(goalsUi, /\['time', 'Time spent'/);
  assert.match(goalsUi, /\['count', 'Quantity'/);
  assert.match(goalsUi, /\['boolean', 'Completed'/);
  assert.match(goalsUi, /\['milestone', 'Milestones'/);
  assert.match(goalsUi, /name="goalMeasureChoice" value="\$\{value\}"/);
  assert.match(goalsUi, /id="goalMeasurement" type="hidden"/);
  assert.match(goalsUi, /measurement_type: \$\('#goalMeasurement'\)\.value/);
  for (const type of ['time', 'count', 'milestone', 'boolean', 'number']) {
    assert.match(goalsRoutes, new RegExp(`'${type}'`));
  }
});

test('numeric Goal guidance reads as an optional target sentence', () => {
  assert.match(goalsUi, /Optional target/);
  assert.match(goalsUi, /Aim for/);
  assert.match(goalsUi, /aria-label="Target amount"/);
  assert.match(goalsUi, /aria-label="Target unit"/);
  assert.match(goalsUi, /aria-label="Target period"/);
  assert.match(goalsUi, /Leave the amount empty if you only want to track progress without a target/);
});

test('Completed and Milestones do not force meaningless numeric targets', () => {
  assert.match(goalsUi, /const numeric = canonicalType === 'time' \|\| canonicalType === 'count' \|\| canonicalType === 'number'/);
  assert.match(goalsUi, /goalTargetBuilder'\)\) \$\('#goalTargetBuilder'\)\.hidden = !numeric/);
  assert.match(goalsUi, /goalMinimumField'\)\) \$\('#goalMinimumField'\)\.hidden = !numeric/);
  assert.match(goalsUi, /if \(userChange && !numeric\)[\s\S]*goalTarget'\)\.value = ''[\s\S]*goalPeriod'\)\.value = 'none'/);
  assert.match(goalsUi, /id="goalTargetConnector">per/);
  assert.match(goalsUi, /period === 'none' \? 'for this' : 'per'/);
  assert.match(goalsUi, /goalPeriod'\)\?\.addEventListener\('change'/);
});

test('advanced Goal options preserve supported minimum why priority status and notes fields', () => {
  const advanced = goalsUi.slice(goalsUi.indexOf('id="goalAdvancedOptions"'), goalsUi.indexOf('</details>', goalsUi.indexOf('id="goalAdvancedOptions"')) + 10);
  assert.match(advanced, /Good-enough minimum/);
  assert.match(advanced, /Priority/);
  assert.match(advanced, /Status/);
  assert.match(advanced, /Why does this matter\?/);
  assert.match(advanced, /Notes/);
  assert.match(goalsUi, /minimum_value:/);
  assert.match(goalsUi, /why_text:/);
  assert.match(goalsRoutes, /minimum_value/);
  assert.match(goalsRoutes, /why_text/);
});

test('Revision C keeps the default Goal list about goals rather than administration', () => {
  assert.doesNotMatch(goalsUi, /Choose your direction/);
  assert.doesNotMatch(goalsUi, /Name what matters, place it in your life/);
  assert.doesNotMatch(goalsUi, /no numeric target/);
  assert.match(goalsUi, /if \(goal\.status && goal\.status !== 'active'\) parts\.push/);
  assert.match(goalsUi, /class="goal-row-menu"/);
  assert.match(goalsUi, /aria-label="Actions for \$\{escapeHtml\(goal\.name\)\}"/);
  assert.match(goalsUi, /data-edit-goal/);
  assert.match(goalsUi, /data-archive-goal/);
  assert.match(goalsUi, /Choose the goals that matter now\. Targets are optional guidance\./);
});

test('Goal row actions remain touch-safe and secondary on desktop and phone', () => {
  assert.match(goalsCss, /\.goal-row-menu>summary\{[^}]*width:var\(--gc-target-min\);height:var\(--gc-target-min\)/s);
  assert.match(goalsCss, /\.goal-row-menu-popover button\{[^}]*min-height:var\(--gc-target-min\)/s);
  assert.match(goalsCss, /@media\(max-width:560px\)[\s\S]*\.goal-row-menu-popover\{position:fixed/);
  assert.match(goalsCss, /@media\(max-width:560px\)[\s\S]*\.goal-row-menu-popover button\{min-height:48px/);
});

test('Goal choices remain touch friendly and phone first', () => {
  assert.match(goalsCss, /goal-measure-choice>span\{[^}]*min-height:var\(--gc-target-min\)/s);
  assert.match(goalsCss, /goal-target-sentence input,\.goal-target-sentence select\{[^}]*min-height:var\(--gc-target-min\)/s);
  assert.match(goalsCss, /@media\(max-width:560px\)/);
});
