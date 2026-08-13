import { addDays } from '../../core/dates.js';
import { getTargets } from '../../data/targets.js';
import { progressContractV1 } from '../../modules/progress/public.js';

/**
 * Legacy /api/week compatibility adapter.
 *
 * New factual records come from Progress V1. The original default profile
 * still receives its legacy weekly target rows so the current Beta UI keeps
 * its historical Minimum/Target presentation until the UX slice replaces it.
 * Generic Activities with recorded facts are appended with zero legacy
 * targets instead of being hidden.
 */
export async function getLegacyWeek(
  DB,
  profileId,
  start
) {
  const end = addDays(start, 6);

  const [history, legacyTargets] = await Promise.all([
    progressContractV1.listHistory(
      DB,
      profileId,
      {
        from: start,
        to: end,
        limit: 500,
        includeLegacy: true
      }
    ),

    profileId === 'default'
      ? getTargets(DB)
      : Promise.resolve([])
  ]);

  const actualByKey = new Map();
  const nameByKey = new Map();

  for (const item of history) {
    if (!item.activity_key) continue;

    const key = item.activity_key;
    const minutes = Math.max(0, Number(item.minutes) || 0);

    actualByKey.set(
      key,
      (actualByKey.get(key) || 0) + minutes
    );

    if (!nameByKey.has(key)) {
      nameByKey.set(
        key,
        item.activity_name || key
      );
    }
  }

  const rows = legacyTargets.map((target) => {
    const actual = actualByKey.get(target.key) || 0;

    actualByKey.delete(target.key);

    return {
      ...target,
      actual_minutes: actual,
      progress: target.target_minutes
        ? Math.min(1, actual / target.target_minutes)
        : 0
    };
  });

  for (const [key, actual] of actualByKey) {
    rows.push({
      key,
      name: nameByKey.get(key) || key,
      target_minutes: 0,
      minimum_minutes: 0,
      actual_minutes: actual,
      progress: 0
    });
  }

  return rows;
}
