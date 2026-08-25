import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/experience/2/js/live-session.js', import.meta.url), 'utf8');

test('live-session completion freezes background timer and refresh until the factual dialog closes', () => {
  assert.match(source, /function completionOpen\(\)/);
  assert.match(source, /if \(refreshInFlight \|\| !host \|\| completionOpen\(\)\) return/);
  const openCompletion = source.slice(source.indexOf('function openCompletion()'));
  assert.match(openCompletion, /const actual = elapsedMinutes\(item\);\s*stopClock\(\);/);
  const closeCompletion = source.slice(source.indexOf('function closeCompletion(opener)'), source.indexOf('async function existingProgressForSession'));
  assert.match(closeCompletion, /classList\.remove\('gc-live-completion-open'\)[\s\S]*startClock\(\)[\s\S]*scheduleRefresh\(0\)/);
});

test('successful live-session completion updates in place instead of forcing a page reload', () => {
  assert.doesNotMatch(source, /window\.location\.reload\(/);
  assert.match(source, /current = null;\s*render\(\);\s*scheduleRefresh\(0\);\s*document\.dispatchEvent\(new CustomEvent\('gc:session-completed'/);
});
