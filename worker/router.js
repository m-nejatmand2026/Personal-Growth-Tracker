import { bad } from './core/http.js';
import {
  archiveAreaRoute,
  areaTemplatesRoute,
  createAreaRoute,
  listAreasRoute,
  updateAreaRoute
} from './routes/areas.js';
import { bootstrapRoute } from './routes/bootstrap.js';
import {
  capacitySummaryRoute,
  createCapacityCommitmentRoute,
  listCapacityCommitmentsRoute,
  updateCapacityCommitmentRoute
} from './routes/capacity.js';
import { energyRoute } from './routes/energy.js';
import { exportRoute } from './routes/export.js';
import {
  archiveGoalRoute,
  createGoalRoute,
  listGoalsRoute,
  updateGoalRoute
} from './routes/goals.js';
import { historyRoute } from './routes/history.js';
import { momenteRoute } from './routes/momente.js';
import { createRoadmapRoute, updateRoadmapRoute } from './routes/roadmap.js';
import { createSessionRoute, deleteSessionRoute } from './routes/sessions.js';
import { targetsRoute } from './routes/targets.js';
import { weekRoute } from './routes/week.js';

export async function routeApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const context = { request, url, env };

  // Version 1 platform APIs. These live beside legacy beta routes until UI/data cutover.
  if (method === 'GET' && path === '/api/v1/area-templates') return areaTemplatesRoute(context);
  if (method === 'GET' && path === '/api/v1/areas') return listAreasRoute(context);
  if (method === 'POST' && path === '/api/v1/areas') return createAreaRoute(context);
  if (method === 'PUT' && /^\/api\/v1\/areas\/\d+$/.test(path)) return updateAreaRoute(context);
  if (method === 'DELETE' && /^\/api\/v1\/areas\/\d+$/.test(path)) return archiveAreaRoute(context);

  if (method === 'GET' && path === '/api/v1/goals') return listGoalsRoute(context);
  if (method === 'POST' && path === '/api/v1/goals') return createGoalRoute(context);
  if (method === 'PUT' && /^\/api\/v1\/goals\/\d+$/.test(path)) return updateGoalRoute(context);
  if (method === 'DELETE' && /^\/api\/v1\/goals\/\d+$/.test(path)) return archiveGoalRoute(context);

  if (method === 'GET' && path === '/api/v1/capacity') return capacitySummaryRoute(context);
  if (method === 'GET' && path === '/api/v1/capacity/commitments') return listCapacityCommitmentsRoute(context);
  if (method === 'POST' && path === '/api/v1/capacity/commitments') return createCapacityCommitmentRoute(context);
  if (method === 'PUT' && /^\/api\/v1\/capacity\/commitments\/\d+$/.test(path)) return updateCapacityCommitmentRoute(context);

  // Legacy beta APIs. Remove only after the Version 1 UI is fully cut over.
  if (method === 'GET' && path === '/api/bootstrap') return bootstrapRoute(context);
  if (method === 'GET' && path === '/api/week') return weekRoute(context);
  if (method === 'GET' && path === '/api/history') return historyRoute(context);
  if (method === 'POST' && path === '/api/energy') return energyRoute(context);
  if (method === 'POST' && path === '/api/session') return createSessionRoute(context);
  if (method === 'DELETE' && path === '/api/session') return deleteSessionRoute(context);
  if (method === 'PUT' && path === '/api/targets') return targetsRoute(context);
  if (method === 'PUT' && path === '/api/momente') return momenteRoute(context);
  if (method === 'POST' && path === '/api/roadmap') return createRoadmapRoute(context);
  if (method === 'PUT' && path.startsWith('/api/roadmap/')) return updateRoadmapRoute(context);
  if (method === 'GET' && path === '/api/export') return exportRoute(context);

  return bad('API route not found', 404);
}
