import {
  listEnergyRoute,
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
  compatibilityTables: Object.freeze(['energy_logs']),
  routes: Object.freeze([
    {
      method: 'GET',
      pattern: '/api/v1/wellbeing/day',
      handler: wellbeingDayRoute
    },
    {
      method: 'GET',
      pattern: '/api/v1/wellbeing/energy',
      handler: listEnergyRoute
    }
  ]),
  publishes: Object.freeze(['wellbeing.energy-recorded']),
  subscribes: Object.freeze([])
});
