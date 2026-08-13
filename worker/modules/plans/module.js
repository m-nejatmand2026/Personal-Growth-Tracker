import { getPlanRoute, planHistoryRoute, savePlanRoute } from '../../routes/plans.js';

export const plansModule = Object.freeze({
  id: 'plans',
  contractVersion: 1,
  dependsOn: ['goals'],
  defaultEnabled: true,
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/plan', handler: getPlanRoute },
    { method: 'GET', pattern: '/api/v1/plan/history', handler: planHistoryRoute },
    { method: 'POST', pattern: '/api/v1/plan/versions', handler: savePlanRoute }
  ]),
  publishes: Object.freeze(['plan.version-created']),
  subscribes: Object.freeze([])
});
