import { exportCapacityData } from './data.js';
import {
  getCapacitySummary,
  listCapacityCommitments
} from './data.js';

export const capacityContractV1 =
  Object.freeze({
    async getSummary(
      DB,
      profileId,
      date,
      period = 'week'
    ) {
      return getCapacitySummary(
        DB,
        profileId,
        date,
        period
      );
    },

    async listCommitments(
      DB,
      profileId,
      {
        includeInactive = false,
        activeOn = null
      } = {}
    ) {
      return listCapacityCommitments(
        DB,
        profileId,
        includeInactive,
        activeOn
      );
    }
  });

export async function exportCapacityV1(
  DB,
  profileId
) {
  return exportCapacityData(
    DB,
    profileId
  );
}
