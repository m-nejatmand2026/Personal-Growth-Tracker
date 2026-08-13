import {
  archiveAreaRoute,
  areaTemplatesRoute,
  createAreaRoute,
  listAreasRoute,
  updateAreaRoute
} from '../../routes/areas.js';

export const areasModule = Object.freeze({
  id: 'areas',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/area-templates', handler: areaTemplatesRoute },
    { method: 'GET', pattern: '/api/v1/areas', handler: listAreasRoute },
    { method: 'POST', pattern: '/api/v1/areas', handler: createAreaRoute },
    { method: 'PUT', pattern: /^\/api\/v1\/areas\/\d+$/, handler: updateAreaRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/areas\/\d+$/, handler: archiveAreaRoute }
  ]),
  publishes: Object.freeze(['area.created','area.updated','area.archived']),
  subscribes: Object.freeze([])
});
