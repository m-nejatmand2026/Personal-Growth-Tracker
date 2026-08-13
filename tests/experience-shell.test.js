import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const loggerJs = await readFile(new URL('../public/js/features/logger.js', import.meta.url), 'utf8');
const planJs = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const progressJs = await readFile(new URL('../public/js/features/progress.js', import.meta.url), 'utf8');
const insightsJs = await readFile(new URL('../public/js/features/insights.js', import.meta.url), 'utf8');
const todayJs = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const todayIntentionsJs = await readFile(new URL('../public/js/modules/today-intentions/module.js', import.meta.url), 'utf8');
const experienceDoc = await readFile(new URL('../docs/EXPERIENCE_ARCHITECTURE.md', import.meta.url), 'utf8');

test('primary navigation matches the Version 1 experience contract on mobile and desktop', () => {
  for (const label of ['Today','Plan','Progress','Insights']) assert.match(indexHtml, new RegExp(`>${label}<|<b>${label}</b>`));
  assert.match(indexHtml, /id="quickAddBtn"/);
  assert.match(indexHtml, /class="app-rail"/);
  assert.match(indexHtml, /data-open-logger/);
  assert.doesNotMatch(indexHtml, /data-view="settings"/);
  assert.doesNotMatch(indexHtml, /data-view="week"/);
  assert.doesNotMatch(indexHtml, /data-view="history"/);
});

test('logger supports plan doing-now done without confusing intentions with progress facts', () => {
  assert.match(loggerJs, /export function createLogger/);
  assert.match(loggerJs, /id="loggerDuration"[^>]*min="1"[^>]*max="1440"/);
  assert.match(loggerJs, /Plan today/);
  assert.match(loggerJs, /Doing now/);
  assert.match(loggerJs, /Save completed progress/);
  assert.match(loggerJs, /This is an intention, not completed progress/);
  assert.match(loggerJs, /Recent repeats/);
  assert.match(loggerJs, /data-repeat-index/);
  assert.match(loggerJs, /method: 'POST'/);
  assert.doesNotMatch(loggerJs, /Energy check-in instead/);
  assert.doesNotMatch(loggerJs, /from '\.\/today\.js'/);
  assert.doesNotMatch(loggerJs, /from '\.\/plan\.js'/);
});

test('logger subtype hint changes with the selected activity', () => {
  assert.match(loggerJs, /Back, Abs, Push-ups/);
  assert.match(loggerJs, /Speaking, Grammar, Vocabulary/);
  assert.match(loggerJs, /Chords, Technique, Song practice/);
  assert.match(loggerJs, /loggerActivity.*addEventListener\('change', updateSubtypeHint\)/s);
});

test('Today is a command center with capacity, Today plan, goals and activity feed', () => {
  assert.match(todayJs, /Your daily command center/);
  assert.match(todayJs, /\/api\/v1\/capacity\?date=/);
  assert.match(todayJs, /intentionPanel/);
  assert.match(todayJs, /Actual · Minimum · Target/);
  assert.match(todayJs, /Activity feed/);
  assert.match(todayJs, /id="energyDetails"/);
  assert.match(todayJs, /id="openEnergyCheckin"/);
  assert.match(todayJs, /function energyMap\(/);
  assert.match(todayIntentionsJs, /Today&apos;s plan/);
  assert.match(todayIntentionsJs, /data-intent-start/);
  assert.match(todayIntentionsJs, /data-intent-done/);
});

test('Progress foregrounds Actual Minimum Target and no catch-up debt', () => {
  assert.match(progressJs, /Actual, minimum, target/i);
  assert.match(progressJs, /Below minimum — no catch-up required/);
  assert.match(progressJs, /Minimum marker/);
  assert.match(progressJs, /data-delete-session/);
});

test('Insights keeps evidence thresholds and refuses to invent missing associations', () => {
  for (const threshold of ['0–6','7–20','21–41','42+']) assert.match(insightsJs, new RegExp(threshold.replace('+','\\+')));
  assert.match(insightsJs, /Waiting for paired wellbeing data/);
  assert.match(insightsJs, /associated with/);
  assert.doesNotMatch(insightsJs, /causes higher|causes lower|because of sleep/i);
});

test('normal Plan UI is human-facing and starts with time reality', () => {
  assert.match(planJs, /Plan at a glance/);
  assert.match(planJs, /Flexible this week/);
  assert.match(planJs, /How full\?/);
  assert.doesNotMatch(planJs, /independently registered module/i);
  assert.doesNotMatch(planJs, /explicit contract/i);
  assert.doesNotMatch(planJs, /failure boundary/i);
});

test('experience documentation records the rejected first prototype and recursive modularity', () => {
  assert.match(experienceDoc, /Iteration 1 — rejected prototype/);
  assert.match(experienceDoc, /Universal Logger/);
  assert.match(experienceDoc, /car-parts rule/);
  assert.match(experienceDoc, /Growth Compass — Version 1 Beta/);
});
