import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readFile
} from 'node:fs/promises';

const source =
  await readFile(
    new URL(
      '../worker/routes/export.js',
      import.meta.url
    ),
    'utf8'
  );

test(
  'Export composition uses hardened module public contracts',
  () => {
    for (const contract of [
      'exportAreasV1',
      'exportGoalsV1',
      'exportActivitiesV1',
      'exportPlansV1',
      'exportCapacityV1',
      'exportDailyPlanV1',
      'exportJournalV1',
      'exportProgressV1'
    ]) {
      assert.match(
        source,
        new RegExp(
          `\\b${contract}\\b`
        )
      );
    }
  }
);

test(
  'Export composition never reads hardened module tables directly',
  () => {
    const forbidden =
      /\b(?:FROM|JOIN)\s+(?:areas|goals|goal_activities|plan_versions|goal_plan_values|capacity_commitments|daily_plan_items|journal_entries)\b/i;

    assert.doesNotMatch(
      source,
      forbidden
    );
  }
);

test(
  'Remaining direct Version 1 export reads are explicit architecture debt',
  () => {
    assert.doesNotMatch(
      source,
      /\bFROM\s+progress_records\b/i
    );

    assert.match(
      source,
      /\bFROM\s+sleep_logs_v1\b/i
    );

    assert.match(
      source,
      /\bFROM\s+day_context_logs_v1\b/i
    );

    assert.match(
      source,
      /Remaining Version 1 architecture debt/
    );
  }
);
