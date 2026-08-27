import {
  getPlanRoute,
  planHistoryRoute,
  savePlanRoute
} from './routes.js';

export const plansModule = Object.freeze({
  id: 'plans',
  contractVersion: 1,
  dependsOn: ['goals'],
  defaultEnabled: true,
  ownsTables: Object.freeze(['plan_versions', 'goal_plan_values']),
  compatibilityTables: Object.freeze([]),
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/plan', handler: getPlanRoute },
    { method: 'GET', pattern: '/api/v1/plan/history', handler: planHistoryRoute },
    { method: 'POST', pattern: '/api/v1/plan/versions', handler: savePlanRoute }
  ]),
  publishes: Object.freeze(['plan.version-created']),
  subscribes: Object.freeze([])
});
