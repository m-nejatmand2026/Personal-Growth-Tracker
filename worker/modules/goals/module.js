import {
  archiveGoalRoute,
  createGoalRoute,
  listGoalsRoute,
  updateGoalRoute
} from '../../routes/goals.js';

export const goalsModule = Object.freeze({
  id: 'goals',
  contractVersion: 1,
  dependsOn: ['areas'],
  defaultEnabled: true,
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/goals', handler: listGoalsRoute },
    { method: 'POST', pattern: '/api/v1/goals', handler: createGoalRoute },
    { method: 'PUT', pattern: /^\/api\/v1\/goals\/\d+$/, handler: updateGoalRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/goals\/\d+$/, handler: archiveGoalRoute }
  ]),
  publishes: Object.freeze(['goal.created','goal.updated','goal.archived']),
  subscribes: Object.freeze([])
});
