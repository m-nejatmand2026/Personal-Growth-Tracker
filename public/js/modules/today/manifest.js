import { api } from '../../core/api.js';

function emptySummary(date) {
  return Object.freeze({
    date,
    weekStart: date,
    weeklyDirection: Object.freeze([]),
    progress: Object.freeze([]),
    available: false
  });
}

export const todayModule = Object.freeze({
  id: 'today',
  contractVersion: 1,
  dependsOn: Object.freeze([]),
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([]),

  async loadSummary({ date }) {
    try {
      const summary = await api(`/api/v1/today?date=${encodeURIComponent(date)}`);
      return Object.freeze({
        date,
        weekStart: summary.week_start,
        weeklyDirection: Object.freeze(summary.weekly_direction || []),
        progress: Object.freeze(summary.progress || []),
        available: true
      });
    } catch {
      return emptySummary(date);
    }
  }
});
