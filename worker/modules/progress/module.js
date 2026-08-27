import {
  createProgressRoute,
  deleteProgressRoute,
  listProgressRoute
} from './routes.js';

export const progressModule = Object.freeze({
  id: 'progress',
  contractVersion: 1,
  dependsOn: Object.freeze(['activities']),
  defaultEnabled: true,
  ownsTables: Object.freeze(['progress_records']),
  compatibilityTables: Object.freeze(['sessions']),
  compatibilitySunset: 'before-public-launch',
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/progress', handler: listProgressRoute },
    { method: 'POST', pattern: '/api/v1/progress', handler: createProgressRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/progress\/\d+$/, handler: deleteProgressRoute }
  ]),
  publishes: Object.freeze(['progress.recorded', 'progress.deleted']),
  subscribes: Object.freeze([])
});
