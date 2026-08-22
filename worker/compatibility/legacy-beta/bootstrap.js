import { todayContractV1 } from '../../modules/today/public.js';
import { wellbeingContractV1 } from '../../modules/wellbeing/public.js';

/**
 * Legacy /api/bootstrap response composer.
 * Runtime facts come only from Version 1 public contracts.
 */
export async function getLegacyBootstrap(DB, profileId, date) {
  const [today, wellbeing] = await Promise.all([
    todayContractV1.getDay(DB, profileId, date),
    wellbeingContractV1.getDay(DB, profileId, date)
  ]);

  return {
    date,
    week_start: today.week_start,
    targets: [],
    week: today.weekly_direction,
    energy: wellbeing.energy,
    wellbeing,
    sessions: today.progress,
    roadmap: [],
    lessons: []
  };
}
