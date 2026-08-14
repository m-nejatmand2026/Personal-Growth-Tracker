import { renderProgress } from './ui.js';

function directionStatus(actual, minimum, target) {
  if (!minimum && !target) return actual > 0 ? 'Facts recorded' : 'No target set';
  if (target > 0 && actual >= target) return 'Target reached';
  if (minimum > 0 && actual >= minimum) return 'Good-enough minimum reached';
  return 'Building';
}

export const progressModule = Object.freeze({
  id: 'progress',
  contractVersion: 1,
  dependsOn: ['activities'],
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([
    { name: 'today-direction', order: 40 },
    { name: 'today-recent', order: 50 }
  ]),
  render({ reload, weeklyDirection = [] } = {}) {
    return renderProgress({ reload, weeklyDirection });
  },
  todayDirection({ items = [] } = {}) {
    return Object.freeze({
      id: 'progress.direction',
      kind: 'cards',
      kicker: 'Goals',
      title: 'Your weekly direction',
      detail: 'Actual · Minimum · Target',
      empty: 'No active goal data yet.',
      cards: Object.freeze(items.slice(0, 4).map((item) => {
        const actual = Math.max(0, Number(item.actual_minutes) || 0);
        const minimum = Math.max(0, Number(item.minimum_minutes) || 0);
        const target = Math.max(0, Number(item.target_minutes) || 0);
        return Object.freeze({
          title: item.name || item.key || 'Activity',
          status: directionStatus(actual, minimum, target),
          threshold: Object.freeze({ actual, minimum, target }),
          metrics: Object.freeze([
            Object.freeze({ label: 'Actual', minutes: actual }),
            Object.freeze({ label: 'Minimum', minutes: minimum }),
            Object.freeze({ label: 'Target', minutes: target })
          ])
        });
      }))
    });
  },
  todayRecent({ items = [] } = {}) {
    return Object.freeze({
      id: 'progress.recent',
      kind: 'rows',
      kicker: 'Activity feed',
      title: 'Recent today',
      empty: 'Nothing logged yet today.',
      rows: Object.freeze(items.slice(0, 6).map((item) => Object.freeze({
        title: item.activity_name || item.activity_key || 'Activity',
        subtitle: item.subtype || 'Progress record',
        minutes: Math.max(0, Number(item.minutes) || 0)
      })))
    });
  }
});
