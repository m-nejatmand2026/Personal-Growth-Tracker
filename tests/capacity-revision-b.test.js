import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { capacityPanelHtml, capacityTimeFit } from '../public/js/modules/capacity/ui.js';

const capacityModule = await readFile(new URL('../public/js/modules/capacity/module.js', import.meta.url), 'utf8');
const planJs = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');

test('Capacity time fit separates available planned remaining and over-by minutes', () => {
  assert.deepEqual(capacityTimeFit({ flexible_minutes: 2100, planned_goal_minutes: 540, overcommitted_minutes: 0 }), {
    availableMinutes: 2100,
    plannedMinutes: 540,
    remainingMinutes: 1560,
    overByMinutes: 0,
    overcommittedMinutes: 0,
    plannedPct: 26
  });
  assert.deepEqual(capacityTimeFit({ flexible_minutes: 300, planned_goal_minutes: 420, overcommitted_minutes: 0 }), {
    availableMinutes: 300,
    plannedMinutes: 420,
    remainingMinutes: 0,
    overByMinutes: 120,
    overcommittedMinutes: 0,
    plannedPct: 140
  });
});

test('full Capacity panel uses concrete time language and removes qualitative load labels', () => {
  const summary = {
    total_minutes: 10080,
    committed_minutes: 7980,
    flexible_minutes: 2100,
    planned_goal_minutes: 540,
    overcommitted_minutes: 0
  };
  const html = capacityPanelHtml({
    day: { ...summary, total_minutes: 1440 },
    week: { ...summary },
    month: { ...summary, start: '2026-08-01', days: 31 },
    commitments: [],
    selectedDate: '2026-08-14'
  });
  assert.match(html, /Time reality/);
  assert.match(html, /Available/);
  assert.match(html, /Planned/);
  assert.match(html, /still flexible/);
  assert.match(html, /26% of available time is planned/);
  assert.match(html, /not a productivity score/);
  assert.doesNotMatch(html, /Spacious|Balanced|Very full|How full\?|Plan load/i);
});

test('Today and Plan consume the same Capacity-owned time-fit semantics', () => {
  assert.match(capacityModule, /capacityTimeFit\(summary\)/);
  assert.match(capacityModule, /timeFit\(summary\)/);
  assert.match(capacityModule, /label: 'Available'/);
  assert.match(capacityModule, /label: 'Planned'/);
  assert.match(planJs, /models\.capacity\?\.timeFit\?\.week/);
  assert.doesNotMatch(planJs, /plan_load|impossible_by_minutes/);
});
