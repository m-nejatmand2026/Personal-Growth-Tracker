import { api } from '../../core/api.js';

const DIRECTION_PERIODS = new Set(['day', 'week', 'month', 'year']);

function emptySummary(date, period) {
  return Object.freeze({
    date,
    weekStart: date,
    directionPeriod: period,
    directionStart: date,
    directionEnd: date,
    direction: Object.freeze([]),
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

  async loadSummary({ date, period = 'week' }) {
    const selectedPeriod = DIRECTION_PERIODS.has(period) ? period : 'week';
    try {
      const summary = await api(`/api/v1/today?date=${encodeURIComponent(date)}&period=${encodeURIComponent(selectedPeriod)}`);
      const direction = Object.freeze(summary.direction || summary.weekly_direction || []);
      return Object.freeze({
        date,
        weekStart: summary.week_start,
        directionPeriod: summary.direction_period || selectedPeriod,
        directionStart: summary.direction_start || date,
        directionEnd: summary.direction_end || date,
        direction,
        weeklyDirection: Object.freeze(summary.weekly_direction || []),
        progress: Object.freeze(summary.progress || []),
        available: true
      });
    } catch {
      return emptySummary(date, selectedPeriod);
    }
  }
});
