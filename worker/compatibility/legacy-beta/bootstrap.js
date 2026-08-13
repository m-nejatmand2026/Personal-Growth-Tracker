import { weekStart } from '../../core/dates.js';
import { progressContractV1 } from '../../modules/progress/public.js';
import { wellbeingContractV1 } from '../../modules/wellbeing/public.js';
import { getLegacyWeek } from './progress.js';

/**
 * Legacy /api/bootstrap response composer.
 * Runtime facts come only from Version 1 public contracts.
 */
export async function getLegacyBootstrap(DB, profileId, date) {
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
