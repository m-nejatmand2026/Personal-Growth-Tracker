import { DEFAULT_PROFILE_ID } from '../../core/profile.js';

const EMPTY_LEGACY_EXPORT = Object.freeze({
  activities: Object.freeze([]),
  targets: Object.freeze([]),
  sessions: Object.freeze([]),
  energy: Object.freeze([]),
  momente_lessons: Object.freeze([]),
  roadmap: Object.freeze([]),
  settings: Object.freeze([])
});

/**
 * Original Beta tables are global and belong only to the original profile.
 * Future authenticated profiles must never receive another profile's history.
 */
export async function exportLegacyBeta(DB, profileId) {
  if (profileId !== DEFAULT_PROFILE_ID) return EMPTY_LEGACY_EXPORT;

  const [
    activities,
    targets,
    sessions,
    energy,
    lessons,
    roadmap,
    settings
  ] = await Promise.all([
    DB.prepare('SELECT * FROM activities').all(),
    DB.prepare('SELECT * FROM weekly_targets').all(),
    DB.prepare('SELECT * FROM sessions ORDER BY occurred_on,id').all(),
    DB.prepare('SELECT * FROM energy_logs ORDER BY occurred_on').all(),
    DB.prepare('SELECT * FROM momente_lessons ORDER BY lesson').all(),
    DB.prepare('SELECT * FROM roadmap_items ORDER BY horizon,sort_order,id').all(),
    DB.prepare('SELECT * FROM settings').all()
  ]);

  return Object.freeze({
    activities: activities.results,
    targets: targets.results,
    sessions: sessions.results,
    energy: energy.results,
    momente_lessons: lessons.results,
    roadmap: roadmap.results,
    settings: settings.results
  });
}
