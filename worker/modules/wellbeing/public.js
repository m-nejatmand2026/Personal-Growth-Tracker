import {
  exportWellbeingData,
  getDayContextObservation,
  getEnergyObservation,
  getSleepObservation,
  listEnergyObservations,
  upsertDayContextObservation,
  upsertEnergyObservation,
  upsertSleepObservation
} from './data.js';

function freezeObservation(item) {
  return item ? Object.freeze({ ...item }) : null;
}

export const wellbeingContractV1 = Object.freeze({
  async getDay(DB, profileId, date) {
    const [energy, sleep, context] = await Promise.all([
      getEnergyObservation(DB, profileId, date),
      getSleepObservation(DB, profileId, date),
      getDayContextObservation(DB, profileId, date)
    ]);

    return Object.freeze({
      date,
      energy: freezeObservation(energy),
      sleep: freezeObservation(sleep),
      context: freezeObservation(context)
    });
  },

  async getEnergy(DB, profileId, date) {
    return freezeObservation(await getEnergyObservation(DB, profileId, date));
  },

  async listEnergy(DB, profileId, options = {}) {
    const items = await listEnergyObservations(DB, profileId, options);
    return Object.freeze(items.map((item) => freezeObservation(item)));
  },

  async recordEnergy(DB, profileId, input) {
    return freezeObservation(await upsertEnergyObservation(DB, profileId, input));
  },

  async recordSleep(DB, profileId, input) {
    return freezeObservation(await upsertSleepObservation(DB, profileId, input));
  },

  async recordDayContext(DB, profileId, input) {
    return freezeObservation(
      await upsertDayContextObservation(DB, profileId, input)
    );
  }
});

export async function exportWellbeingV1(DB, profileId) {
  return exportWellbeingData(DB, profileId);
}
