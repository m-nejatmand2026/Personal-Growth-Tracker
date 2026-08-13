import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../worker/routes/export.js', import.meta.url),
  'utf8'
);

test('Export composition uses hardened module public contracts', () => {
  for (const contract of [
    'exportAreasV1',
    'exportGoalsV1',
    'exportActivitiesV1',
    'exportPlansV1',
    'exportCapacityV1',
    'exportDailyPlanV1',
    'exportJournalV1',
    'exportProgressV1',
    'exportWellbeingV1'
  ]) {
    assert.match(source, new RegExp(`\\b${contract}\\b`));
  }
});

test('Export composition never reads Version 1 module tables directly', () => {
  const forbidden = /\b(?:FROM|JOIN)\s+(?:areas|goals|goal_activities|plan_versions|goal_plan_values|capacity_commitments|daily_plan_items|journal_entries|progress_records|energy_logs_v1|sleep_logs_v1|day_context_logs_v1)\b/i;
  assert.doesNotMatch(source, forbidden);
});

test('Legacy Beta export is explicit compatibility data only', () => {
  for (const legacyTable of [
    'activities',
    'weekly_targets',
    'sessions',
    'energy_logs',
    'momente_lessons',
    'roadmap_items',
    'settings'
  ]) {
    assert.match(source, new RegExp(`\\bFROM\\s+${legacyTable}\\b`, 'i'));
  }

  assert.match(source, /Legacy Beta compatibility export/);
});
