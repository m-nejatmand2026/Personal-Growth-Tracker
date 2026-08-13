import {
  json
} from '../core/http.js';

import {
  resolveProfileId
} from '../core/profile.js';

import {
  getProfile
} from '../data/profiles.js';

import {
  exportActivitiesV1
} from '../modules/activities/public.js';

import {
  exportAreasV1
} from '../modules/areas/public.js';

import {
  exportCapacityV1
} from '../modules/capacity/public.js';

import {
  exportDailyPlanV1
} from '../modules/daily-plan/public.js';

import {
  exportGoalsV1
} from '../modules/goals/public.js';

import {
  exportJournalV1
} from '../modules/journal/public.js';

import {
  exportPlansV1
} from '../modules/plans/public.js';

import {
  exportProgressV1
} from '../modules/progress/public.js';

export async function exportRoute({
  request,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const profile =
    await getProfile(
      env.DB,
      profileId
    );

  const [
    areas,
    goals,
    goalActivities,
    plans,
    commitments,
    dailyPlanItems,
    journalEntries,

    progressRecords,
    sleepLogs,
    contextLogs,

    activities,
    targets,
    sessions,
    energy,
    lessons,
    roadmap,
    settings
  ] = await Promise.all([
    exportAreasV1(
      env.DB,
      profileId
    ),

    exportGoalsV1(
      env.DB,
      profileId
    ),

    exportActivitiesV1(
      env.DB,
      profileId
    ),

    exportPlansV1(
      env.DB,
      profileId
    ),

    exportCapacityV1(
      env.DB,
      profileId
    ),

    exportDailyPlanV1(
      env.DB,
      profileId
    ),

    exportJournalV1(
      env.DB,
      profileId
    ),

    exportProgressV1(
      env.DB,
      profileId
    ),

    // Remaining Version 1 architecture debt.
    env.DB.prepare(`
      SELECT *
      FROM sleep_logs_v1
      WHERE profile_id=?
      ORDER BY occurred_on
    `)
      .bind(profileId)
      .all(),

    env.DB.prepare(`
      SELECT *
      FROM day_context_logs_v1
      WHERE profile_id=?
      ORDER BY occurred_on
    `)
      .bind(profileId)
      .all(),

    // Legacy Beta compatibility export.
    env.DB.prepare(
      'SELECT * FROM activities'
    ).all(),

    env.DB.prepare(
      'SELECT * FROM weekly_targets'
    ).all(),

    env.DB.prepare(
      'SELECT * FROM sessions ORDER BY occurred_on,id'
    ).all(),

    env.DB.prepare(
      'SELECT * FROM energy_logs ORDER BY occurred_on'
    ).all(),

    env.DB.prepare(
      'SELECT * FROM momente_lessons ORDER BY lesson'
    ).all(),

    env.DB.prepare(
      'SELECT * FROM roadmap_items ORDER BY horizon,sort_order,id'
    ).all(),

    env.DB.prepare(
      'SELECT * FROM settings'
    ).all()
  ]);

  return json({
    schema_version: 1,

    exported_at:
      new Date().toISOString(),

    timezone:
      profile?.timezone
      || 'Europe/Berlin',

    profile,

    version_one: {
      areas,

      goals,

      goal_activities:
        goalActivities,

      plan_versions:
        plans.plan_versions,

      goal_plan_values:
        plans.goal_plan_values,

      capacity_commitments:
        commitments,

      progress_records:
        progressRecords,

      sleep_logs:
        sleepLogs.results,

      day_context_logs:
        contextLogs.results,

      daily_plan_items:
        dailyPlanItems,

      journal_entries:
        journalEntries
    },

    legacy_beta: {
      activities:
        activities.results,

      targets:
        targets.results,

      sessions:
        sessions.results,

      energy:
        energy.results,

      momente_lessons:
        lessons.results,

      roadmap:
        roadmap.results,

      settings:
        settings.results
    }
  });
}
