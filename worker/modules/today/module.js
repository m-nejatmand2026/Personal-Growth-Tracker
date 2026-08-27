import { todayRoute } from './routes.js';

export const todayModule = Object.freeze({
  id: 'today',
  contractVersion: 1,
  dependsOn: Object.freeze(['activities', 'plans', 'progress']),
  defaultEnabled: true,
  ownsTables: Object.freeze([]),
  compatibilityTables: Object.freeze([]),
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/today', handler: todayRoute }
  ]),
  publishes: Object.freeze([]),
  subscribes: Object.freeze([])
});
