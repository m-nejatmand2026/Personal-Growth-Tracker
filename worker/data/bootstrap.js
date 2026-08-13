import { weekStart } from '../core/dates.js';
import { getLegacyWeek } from '../compatibility/legacy-beta/progress.js';
import { progressContractV1 } from '../modules/progress/public.js';
import { wellbeingContractV1 } from '../modules/wellbeing/public.js';

/**
 * Legacy /api/bootstrap response composer.
 *
 * Runtime data is generic and comes from Version 1 public contracts. Founder
 * seed artifacts remain preserved in legacy export data but no longer define
 * the application model for new users.
 */
export async function getBootstrap(DB, profileId, date) {
  const start = weekStart(date);

  const [week, wellbeing, progress] = await Promise.all([
    getLegacyWeek(DB, profileId, start),
    wellbeingContractV1.getDay(DB, profileId, date),
    progressContractV1.listHistory(DB, profileId, {
      from: date,
      to: date,
      limit: 100,
      includeLegacy: true
    })
  ]);

  return {
    date,
    week_start: start,
    targets: [],
    week,
    energy: wellbeing.energy,
    wellbeing,
    sessions: progress,
    roadmap: [],
    lessons: []
  };
}
