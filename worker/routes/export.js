import { json } from '../core/http.js';

export async function exportRoute({ env }) {
  const [activities, targets, sessions, energy, lessons, roadmap, settings] = await Promise.all([
    env.DB.prepare('SELECT * FROM activities').all(),
    env.DB.prepare('SELECT * FROM weekly_targets').all(),
    env.DB.prepare('SELECT * FROM sessions ORDER BY occurred_on,id').all(),
    env.DB.prepare('SELECT * FROM energy_logs ORDER BY occurred_on').all(),
    env.DB.prepare('SELECT * FROM momente_lessons ORDER BY lesson').all(),
    env.DB.prepare('SELECT * FROM roadmap_items ORDER BY horizon,sort_order,id').all(),
    env.DB.prepare('SELECT * FROM settings').all()
  ]);

  return json({
    exported_at: new Date().toISOString(),
    activities: activities.results,
    targets: targets.results,
    sessions: sessions.results,
    energy: energy.results,
    momente_lessons: lessons.results,
    roadmap: roadmap.results,
    settings: settings.results
  });
}
