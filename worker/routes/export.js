import { json } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { getProfile } from '../data/profiles.js';

export async function exportRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const profile = await getProfile(env.DB, profileId);
  const [activities,targets,sessions,energy,lessons,roadmap,settings,areas,goals,goalActivities,planVersions,goalPlanValues,commitments,progressRecords,sleepLogs,contextLogs,dailyPlanItems,journalEntries] = await Promise.all([
    env.DB.prepare('SELECT * FROM activities').all(),
    env.DB.prepare('SELECT * FROM weekly_targets').all(),
    env.DB.prepare('SELECT * FROM sessions ORDER BY occurred_on,id').all(),
    env.DB.prepare('SELECT * FROM energy_logs ORDER BY occurred_on').all(),
    env.DB.prepare('SELECT * FROM momente_lessons ORDER BY lesson').all(),
    env.DB.prepare('SELECT * FROM roadmap_items ORDER BY horizon,sort_order,id').all(),
    env.DB.prepare('SELECT * FROM settings').all(),
    env.DB.prepare('SELECT * FROM areas WHERE profile_id=? ORDER BY sort_order,id').bind(profileId).all(),
    env.DB.prepare('SELECT * FROM goals WHERE profile_id=? ORDER BY sort_order,id').bind(profileId).all(),
    env.DB.prepare('SELECT * FROM goal_activities WHERE profile_id=? ORDER BY sort_order,id').bind(profileId).all(),
    env.DB.prepare('SELECT * FROM plan_versions WHERE profile_id=? ORDER BY effective_from,id').bind(profileId).all(),
    env.DB.prepare(`SELECT gpv.* FROM goal_plan_values gpv JOIN plan_versions pv ON pv.id=gpv.plan_version_id WHERE pv.profile_id=? ORDER BY pv.effective_from,gpv.goal_id`).bind(profileId).all(),
    env.DB.prepare('SELECT * FROM capacity_commitments WHERE profile_id=? ORDER BY sort_order,id').bind(profileId).all(),
    env.DB.prepare('SELECT * FROM progress_records WHERE profile_id=? ORDER BY occurred_on,id').bind(profileId).all(),
    env.DB.prepare('SELECT * FROM sleep_logs_v1 WHERE profile_id=? ORDER BY occurred_on').bind(profileId).all(),
    env.DB.prepare('SELECT * FROM day_context_logs_v1 WHERE profile_id=? ORDER BY occurred_on').bind(profileId).all(),
    env.DB.prepare('SELECT * FROM daily_plan_items WHERE profile_id=? ORDER BY planned_for,sort_order,id').bind(profileId).all(),
    env.DB.prepare('SELECT * FROM journal_entries WHERE profile_id=? ORDER BY occurred_on,id').bind(profileId).all()
  ]);
  return json({schema_version:1,exported_at:new Date().toISOString(),timezone:profile?.timezone||'Europe/Berlin',profile,version_one:{areas:areas.results,goals:goals.results,goal_activities:goalActivities.results,plan_versions:planVersions.results,goal_plan_values:goalPlanValues.results,capacity_commitments:commitments.results,progress_records:progressRecords.results,sleep_logs:sleepLogs.results,day_context_logs:contextLogs.results,daily_plan_items:dailyPlanItems.results,journal_entries:journalEntries.results},legacy_beta:{activities:activities.results,targets:targets.results,sessions:sessions.results,energy:energy.results,momente_lessons:lessons.results,roadmap:roadmap.results,settings:settings.results}});
}
