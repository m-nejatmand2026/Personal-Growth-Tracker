import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const today = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const plan = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const progress = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const insights = await readFile(new URL('../public/js/modules/insights/ui.js', import.meta.url), 'utf8');
const journal = await readFile(new URL('../public/js/modules/journal/module.js', import.meta.url), 'utf8');
const settings = await readFile(new URL('../public/js/features/settings.js', import.meta.url), 'utf8');
const wellness = await readFile(new URL('../public/js/modules/wellness-boost/module.js', import.meta.url), 'utf8');

test('first-class Current screens own one real destination heading', () => {
  assert.match(today, /<h2 id="todaySanctuaryTitle">Today<\/h2>/);
  assert.match(plan, /<h2 id="planCurrentTitle">Plan<\/h2>/);
  assert.match(progress, /<h2 id="progressCurrentTitle">Progress<\/h2>/);
  assert.match(insights, /<h2 id="insightsCurrentTitle">Insights<\/h2>/);
  assert.match(journal, /<h2 id="journalCurrentTitle">Journal<\/h2>/);
  assert.match(settings, /<h2>Settings<\/h2>/);
  assert.match(wellness, /<h2 id="wellnessCurrentTitle">Wellness<\/h2>/);
});

test('destination heading is followed by concise context rather than duplicated shell identity', () => {
  assert.match(today, /<strong class="today-greeting">Good morning\.<\/strong><p>Keep the next useful step visible/);
  assert.match(plan, /<p>Set direction, then fit it to the week ahead\.<\/p>/);
  assert.match(progress, /What actually happened\. Targets and minimums are guidance, not debt\./);
  assert.match(insights, /Patterns only when the evidence is strong enough\. Association never proves cause\./);
  assert.match(journal, /Write when there is something you want to remember\./);
  assert.match(settings, /Profile, experience, and data ownership\./);
  assert.match(wellness, /A quieter space to reset, focus, or restore\./);
});
