import {
  createTodayIntentionRoute,
  deleteTodayIntentionRoute,
  listTodayIntentionsRoute,
  updateTodayIntentionRoute
} from '../../routes/today-intentions.js';

export const todayIntentionsModule = Object.freeze({
  id: 'today-intentions',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/today-intentions', handler: listTodayIntentionsRoute },
    { method: 'POST', pattern: '/api/v1/today-intentions', handler: createTodayIntentionRoute },
    { method: 'PUT', pattern: /^\/api\/v1\/today-intentions\/\d+$/, handler: updateTodayIntentionRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/today-intentions\/\d+$/, handler: deleteTodayIntentionRoute }
  ]),
  publishes: Object.freeze([
    'today-intention.created',
    'today-intention.started',
    'today-intention.completed',
    'today-intention.removed'
  ]),
  subscribes: Object.freeze([])
});
