import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const framework = await readFile(new URL('../public/css/experience-framework.css', import.meta.url), 'utf8');
const today = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const plan = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');

test('shell owns first-class destination identity while view headers add context only', () => {
  assert.match(framework, /\.gc-page-header\.progress-dashboard \.eyebrow,/);
  assert.match(framework, /\.gc-page-header\.insights-hero \.eyebrow,/);
  assert.match(framework, /\.journal-hero > div > \.eyebrow\{display:none\}/);

  // Today keeps only its date as useful context; Plan uses the shell title plus
  // a concise content heading instead of repeating another destination eyebrow.
  assert.match(today, /<p class="eyebrow">\$\{formatDateLabel\(date\)\}<\/p>/);
  assert.match(plan, /aria-label="Plan at a glance"/);
  assert.match(plan, /<h2>Your plan<\/h2>/);
  assert.doesNotMatch(plan, /<span class="section-kicker">Plan at a glance<\/span>/);
});
