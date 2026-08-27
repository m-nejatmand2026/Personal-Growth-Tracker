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

test('first-class Product Rebuild screens own one real destination heading', () => {
  assert.match(today, /<h2[^>]*>Today<\/h2>/);
  assert.match(plan, /<h2 id="planCurrentTitle">Plan<\/h2>/);
  assert.match(progress, /<h2 id="progressCurrentTitle">Progress<\/h2>/);
  assert.match(insights, /<h2 id="insightsCurrentTitle">Insights<\/h2>/);
  assert.match(journal, /<h2 id="journalCurrentTitle">Journal<\/h2>/);
  assert.match(settings, /<h2 id="settingsCurrentTitle">Settings<\/h2>/);
  assert.match(wellness, /<h2 id="wellnessCurrentTitle">Wellness<\/h2>/);
});

test('destination heading is followed by concise job-specific context', () => {
  assert.match(today, /One clear step at a time\./);
  assert.match(plan, /Choose what deserves attention, then fit it to the time you actually have\./);
  assert.match(progress, /What actually happened\. Plans never appear here until you explicitly record them as done\./);
  assert.match(insights, /What the evidence may support\. Association is never presented as cause\./);
  assert.match(journal, /A private place to think, remember and notice what matters\./);
  assert.match(settings, /Real controls only/);
  assert.match(wellness, /A quieter space to reset, focus, or restore\./);
});
