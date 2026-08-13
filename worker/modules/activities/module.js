import {
  archiveActivityRoute,
  createActivityRoute,
  listActivitiesRoute,
  updateActivityRoute
} from './routes.js';

export const activitiesModule = Object.freeze({
  id: 'activities',
  contractVersion: 1,
  dependsOn: ['goals'],
  defaultEnabled: true,
  ownsTables: Object.freeze(['goal_activities']),
  compatibilityTables: Object.freeze(['activities']),
  routes: Object.freeze([
    {
      method: 'GET',
      pattern: '/api/v1/activities',
      handler: listActivitiesRoute
    },
    {
      method: 'POST',
      pattern: '/api/v1/activities',
      handler: createActivityRoute
    },
    {
      method: 'PUT',
      pattern: /^\/api\/v1\/activities\/\d+$/,
      handler: updateActivityRoute
    },
    {
      method: 'DELETE',
      pattern: /^\/api\/v1\/activities\/\d+$/,
      handler: archiveActivityRoute
    }
  ]),
  publishes: Object.freeze([
    'activity.created',
    'activity.updated',
    'activity.archived'
  ]),
  subscribes: Object.freeze([])
});
