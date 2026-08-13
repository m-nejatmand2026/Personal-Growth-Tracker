import { weekStart } from '../core/dates.js';
import { getLegacyWeek } from '../compatibility/legacy-beta/progress.js';
import { progressContractV1 } from '../modules/progress/public.js';
import { getTargets } from './targets.js';

/**
 * Legacy /api/bootstrap compatibility composition.
 *
 * Progress facts are sourced through the Progress V1 public contract. The
 * `sessions` response key is retained temporarily so the existing Beta UI can
 * cut over without losing historical records.
 */
export async function getBootstrap(DB, profileId, date) {
  const start = weekStart(date);

  const [
    targets,
    week,
    energy,
    progress,
    roadmap,
    lessons
  ] = await Promise.all([
    profileId === 'default'
      ? getTargets(DB)
      : Promise.resolve([]),

    getLegacyWeek(DB, profileId, start),

    DB.prepare(
      'SELECT * FROM energy_logs WHERE occurred_on=?'
    ).bind(date).first(),

    progressContractV1.listHistory(
      DB,
      profileId,
      {
        from: date,
        to: date,
        limit: 100,
        includeLegacy: true
      }
    ),

    DB.prepare(
      'SELECT * FROM roadmap_items WHERE active=1 ORDER BY horizon, sort_order, id'
    ).all(),

    DB.prepare(
      'SELECT * FROM momente_lessons ORDER BY lesson'
    ).all()
  ]);

  return {
    date,
    week_start: start,
    targets,
    week,
    energy,
    sessions: progress,
    roadmap: roadmap.results,
    lessons: lessons.results
  };
}
