import { exportActivitiesData } from './data.js';
import {
  getActivityByKey,
  listActivities
} from './data.js';

/**
 * Activities public contract — Version 1.
 *
 * Consumers receive stable references only. Private persistence details stay
 * inside the Activities module.
 */
export const activitiesContractV1 = Object.freeze({
  async getReferenceByKey(DB, profileId, key) {
    if (!key || typeof key !== 'string') return null;

    const item = await getActivityByKey(DB, profileId, key);

    if (!item || !item.active) return null;

    return Object.freeze({
      id: Number(item.id),
      goal_id: Number(item.goal_id),
      key: item.key,
      name: item.name
    });
  },

  async listReferences(
    DB,
    profileId,
    {
      goalId = null,
      includeArchived = false
    } = {}
  ) {
    const items = await listActivities(
      DB,
      profileId,
      {
        goalId,
        includeArchived
      }
    );

    return items.map((item) => Object.freeze({
      id: Number(item.id),
      goal_id: Number(item.goal_id),
      key: item.key,
      name: item.name
    }));
  }
});

export async function exportActivitiesV1(
  DB,
  profileId
) {
  return exportActivitiesData(
    DB,
    profileId
  );
}
