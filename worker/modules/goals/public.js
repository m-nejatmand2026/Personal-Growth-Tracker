import { exportGoalsData } from './data.js';
import {
  getGoal,
  listGoals
} from './data.js';

function toReference(goal) {
  if (!goal) return null;

  return Object.freeze({
    id: Number(goal.id),
    profile_id: goal.profile_id,
    area_id:
      goal.area_id == null
        ? null
        : Number(goal.area_id),
    name: goal.name,
    measurement_type:
      goal.measurement_type,
    unit: goal.unit || null,
    target_period:
      goal.target_period,
    status: goal.status
  });
}

/**
 * Goals public contract — Version 1.
 *
 * Consumers receive stable Goal references.
 * Private Goal persistence remains replaceable.
 */
export const goalsContractV1 =
  Object.freeze({
    async getReference(
      DB,
      profileId,
      id
    ) {
      const numericId =
        Number(id);

      if (
        !Number.isInteger(numericId)
        || numericId <= 0
      ) {
        return null;
      }

      return toReference(
        await getGoal(
          DB,
          profileId,
          numericId
        )
      );
    },

    async listReferences(
      DB,
      profileId,
      {
        includeArchived = false
      } = {}
    ) {
      const goals =
        await listGoals(
          DB,
          profileId,
          includeArchived
        );

      return goals.map(
        toReference
      );
    }
  });

export async function exportGoalsV1(
  DB,
  profileId
) {
  return exportGoalsData(
    DB,
    profileId
  );
}
