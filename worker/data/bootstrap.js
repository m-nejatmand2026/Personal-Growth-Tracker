import { weekStart } from '../core/dates.js';
import { getWeek } from './progress.js';
import { getTargets } from './targets.js';

export async function getBootstrap(DB, date) {
  const start = weekStart(date);
  const [targets, week, energy, sessions, roadmap, lessons] = await Promise.all([
    getTargets(DB),
    getWeek(DB, start),
    DB.prepare('SELECT * FROM energy_logs WHERE occurred_on=?').bind(date).first(),
    DB.prepare(`
      SELECT s.*, a.name AS activity_name
      FROM sessions s
      JOIN activities a ON a.key=s.activity_key
      WHERE occurred_on=?
      ORDER BY s.id DESC
    `).bind(date).all(),
    DB.prepare('SELECT * FROM roadmap_items WHERE active=1 ORDER BY horizon, sort_order, id').all(),
    DB.prepare('SELECT * FROM momente_lessons ORDER BY lesson').all()
  ]);

  return {
    date,
    week_start: start,
    targets,
    week,
    energy,
    sessions: sessions.results,
    roadmap: roadmap.results,
    lessons: lessons.results
  };
}
