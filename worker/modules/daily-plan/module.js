import {
  createDailyPlanRoute,
  deleteDailyPlanRoute,
  listDailyPlanRoute,
  updateDailyPlanRoute
} from './routes.js';

export const dailyPlanModule = Object.freeze({
  id: 'daily-plan',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  ownsTables: Object.freeze(['daily_plan_items']),
  compatibilityTables: Object.freeze([]),
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/daily-plan', handler: listDailyPlanRoute },
    { method: 'POST', pattern: '/api/v1/daily-plan', handler: createDailyPlanRoute },
    { method: 'PUT', pattern: /^\/api\/v1\/daily-plan\/\d+$/, handler: updateDailyPlanRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/daily-plan\/\d+$/, handler: deleteDailyPlanRoute }
  ]),
  publishes: Object.freeze([
    'daily-plan.created',
    'daily-plan.started',
    'daily-plan.completed',
    'daily-plan.dismissed',
    'daily-plan.updated',
    'daily-plan.deleted'
  ]),
  subscribes: Object.freeze([])
});
