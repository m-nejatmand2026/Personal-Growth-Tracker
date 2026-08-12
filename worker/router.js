import { bad } from './core/http.js';
import { bootstrapRoute } from './routes/bootstrap.js';
import { energyRoute } from './routes/energy.js';
import { exportRoute } from './routes/export.js';
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
