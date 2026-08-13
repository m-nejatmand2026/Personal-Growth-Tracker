import { renderProgress } from './ui.js';

export const progressModule = Object.freeze({
  id: 'progress',
  contractVersion: 1,
  dependsOn: ['activities'],
  defaultEnabled: true,
  slots: Object.freeze([
    { name: 'today-direction', order: 40 },
    { name: 'today-recent', order: 50 }
  ]),
  render({ reload } = {}) {
    return renderProgress({ reload });
  },
  todayDirection({ items = [] } = {}) {
    return Object.freeze({
      id: 'progress.direction',
      kind: 'cards',
      kicker: 'Goals',
      title: 'Your weekly direction',
      detail: 'Actual · Minimum · Target',
      empty: 'No active goal data yet.',
      cards: Object.freeze(items.slice(0, 4).map((item) => Object.freeze({
        title: item.name || item.key || 'Activity',
        status: Number(item.minimum_minutes || 0) > 0 && Number(item.actual_minutes || 0) >= Number(item.minimum_minutes || 0)
          ? 'Minimum reached this week'
          : 'Building',
        metrics: Object.freeze([
          Object.freeze({ label: 'Actual', minutes: Math.max(0, Number(item.actual_minutes) || 0) }),
          Object.freeze({ label: 'Minimum', minutes: Math.max(0, Number(item.minimum_minutes) || 0) }),
          Object.freeze({ label: 'Target', minutes: Math.max(0, Number(item.target_minutes) || 0) })
        ])
      })))
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
