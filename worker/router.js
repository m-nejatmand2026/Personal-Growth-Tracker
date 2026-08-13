import { bad } from './core/http.js';
import { createModuleRegistry } from './platform/module-registry.js';
import { platformModules } from './modules/catalog.js';
import { bootstrapRoute } from './routes/bootstrap.js';
import { energyRoute } from './routes/energy.js';
import { exportRoute } from './routes/export.js';
import { historyRoute } from './routes/history.js';
import { momenteRoute } from './routes/momente.js';
import { createRoadmapRoute, updateRoadmapRoute } from './routes/roadmap.js';
import { createSessionRoute, deleteSessionRoute } from './routes/sessions.js';
import { targetsRoute } from './routes/targets.js';
import { weekRoute } from './routes/week.js';

// Immutable catalog validation happens once at module initialization. It holds
// no request-scoped mutable state and is safe to reuse across Worker requests.
const moduleRegistry = createModuleRegistry(platformModules);
const LEGACY_BETA_SUNSET = 'before-public-launch';
const LEGACY_CLASSIFICATIONS = new Set(['read-model', 'forwarder', 'retired']);

// Explicit migration-only compatibility surface. No new Version 1 capability
// may be added here: new capabilities register routes in their module manifest.
// These routes disappear after Beta compatibility data/clients are retired.
export const legacyBetaRoutes = Object.freeze([
  Object.freeze({ method: 'GET', path: '/api/bootstrap', classification: 'read-model', sunset: LEGACY_BETA_SUNSET, handler: bootstrapRoute }),
  Object.freeze({ method: 'GET', path: '/api/week', classification: 'read-model', sunset: LEGACY_BETA_SUNSET, handler: weekRoute }),
  Object.freeze({ method: 'GET', path: '/api/history', classification: 'read-model', sunset: LEGACY_BETA_SUNSET, handler: historyRoute }),
  Object.freeze({ method: 'POST', path: '/api/energy', classification: 'forwarder', sunset: LEGACY_BETA_SUNSET, handler: energyRoute }),
  Object.freeze({ method: 'POST', path: '/api/session', classification: 'forwarder', sunset: LEGACY_BETA_SUNSET, handler: createSessionRoute }),
  Object.freeze({ method: 'DELETE', path: '/api/session', classification: 'retired', sunset: LEGACY_BETA_SUNSET, handler: deleteSessionRoute }),
  Object.freeze({ method: 'PUT', path: '/api/targets', classification: 'retired', sunset: LEGACY_BETA_SUNSET, handler: targetsRoute }),
  Object.freeze({ method: 'PUT', path: '/api/momente', classification: 'retired', sunset: LEGACY_BETA_SUNSET, handler: momenteRoute }),
  Object.freeze({ method: 'POST', path: '/api/roadmap', classification: 'retired', sunset: LEGACY_BETA_SUNSET, handler: createRoadmapRoute }),
  Object.freeze({ method: 'PUT', prefix: '/api/roadmap/', classification: 'retired', sunset: LEGACY_BETA_SUNSET, handler: updateRoadmapRoute })
]);

function validateLegacyRoutes(routes) {
  const seen = new Set();
  for (const route of routes) {
    if (!LEGACY_CLASSIFICATIONS.has(route.classification)) {
      throw new Error(`Invalid legacy route classification: ${route.classification}`);
    }
    if (route.sunset !== LEGACY_BETA_SUNSET) {
      throw new Error('Legacy route is missing the Beta sunset contract.');
    }
    if (Boolean(route.path) === Boolean(route.prefix)) {
      throw new Error('Legacy route must declare exactly one path or prefix.');
    }
    if (typeof route.handler !== 'function') {
      throw new Error('Legacy route must declare a handler.');
    }
    const key = `${route.method}:${route.path || `${route.prefix}*`}`;
    if (seen.has(key)) throw new Error(`Duplicate legacy route: ${key}`);
    seen.add(key);
  }
}

validateLegacyRoutes(legacyBetaRoutes);

function matchesLegacyRoute(route, method, path) {
  if (route.method !== method) return false;
  if (route.path) return route.path === path;
  if (route.prefix) return path.startsWith(route.prefix);
  return false;
}

export async function routeApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const context = { request, url, env };

  // Version 1 routes are registered by module manifests. Adding/removing a
  // Version 1 module does not require another central-router conditional.
  const registered = moduleRegistry.match(method, path);
  if (registered) return registered.route.handler({ ...context, module: registered.module });

  for (const route of legacyBetaRoutes) {
    if (matchesLegacyRoute(route, method, path)) {
      return route.handler(context);
    }
  }

  // Export is a cross-cutting platform service, not a business-module route.
  if (method === 'GET' && path === '/api/export') return exportRoute(context);

  return bad('API route not found', 404);
}
