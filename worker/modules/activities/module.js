import {
  archiveActivityRoute,
  createActivityRoute,
  listActivitiesRoute,
  removeActivityRoute,
  restoreActivityRoute,
  updateActivityRoute
} from './routes.js';

export const activitiesModule = Object.freeze({
  id: 'activities',
  contractVersion: 1,
  dependsOn: ['goals'],
  defaultEnabled: true,
  ownsTables: Object.freeze(['goal_activities']),
  compatibilityTables: Object.freeze([]),
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/activities', handler: listActivitiesRoute },
    { method: 'POST', pattern: '/api/v1/activities', handler: createActivityRoute },
    { method: 'PUT', pattern: /^\/api\/v1\/activities\/\d+$/, handler: updateActivityRoute },
    { method: 'POST', pattern: /^\/api\/v1\/activities\/\d+\/restore$/, handler: restoreActivityRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/activities\/\d+\/permanent$/, handler: removeActivityRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/activities\/\d+$/, handler: archiveActivityRoute }
  ]),
  publishes: Object.freeze(['activity.created', 'activity.updated', 'activity.archived', 'activity.restored', 'activity.removed']),
  subscribes: Object.freeze([])
});
