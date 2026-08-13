import { exportDailyPlanData } from './data.js';
import {
  getDailyPlanItem,
  listDailyPlanItems
} from './data.js';

function toReference(item) {
  if (!item) return null;

  return Object.freeze({
    id:
      Number(item.id),

    planned_for:
      item.planned_for,

    title:
      item.title,

    activity_key:
      item.activity_key || null,

    activity_label:
      item.activity_label || null,

    subtype:
      item.subtype || null,

    planned_minutes:
      item.planned_minutes == null
        ? null
        : Number(
            item.planned_minutes
          ),

    planned_time:
      item.planned_time || null,

    status:
      item.status
  });
}

/**
 * Daily Plan public contract — Version 1.
 *
 * Daily Plan represents intentions, never Progress facts.
 * Activity identity is optional snapshot metadata, not a
 * runtime dependency.
 */
export const dailyPlanContractV1 =
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
        await getDailyPlanItem(
          DB,
          profileId,
          numericId
        )
      );
    },

    async listForDate(
      DB,
      profileId,
      date,
      {
        includeClosed = false
      } = {}
    ) {
      const items =
        await listDailyPlanItems(
          DB,
          profileId,
          date,
          includeClosed
        );

      return Object.freeze(
        items.map(
          toReference
        )
      );
    }
  });

export async function exportDailyPlanV1(
  DB,
  profileId
) {
  return exportDailyPlanData(
    DB,
    profileId
  );
}
