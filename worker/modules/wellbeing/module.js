import {
  listEnergyRoute,
  recordDayContextRoute,
  recordEnergyRoute,
  recordSleepRoute,
  wellbeingDayRoute
} from './routes.js';

export const wellbeingModule = Object.freeze({
  id: 'wellbeing',
  contractVersion: 1,
  dependsOn: Object.freeze([]),
  defaultEnabled: true,
  ownsTables: Object.freeze([
    'energy_logs_v1',
    'sleep_logs_v1',
    'day_context_logs_v1'
  ]),
  compatibilityTables: Object.freeze([]),
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/wellbeing/day', handler: wellbeingDayRoute },
    { method: 'GET', pattern: '/api/v1/wellbeing/energy', handler: listEnergyRoute },
    { method: 'POST', pattern: '/api/v1/wellbeing/energy', handler: recordEnergyRoute },
    { method: 'POST', pattern: '/api/v1/wellbeing/sleep', handler: recordSleepRoute },
    { method: 'POST', pattern: '/api/v1/wellbeing/context', handler: recordDayContextRoute }
  ]),
  publishes: Object.freeze([
    'wellbeing.energy-recorded',
    'wellbeing.sleep-recorded',
    'wellbeing.context-recorded'
  ]),
  subscribes: Object.freeze([])
});
