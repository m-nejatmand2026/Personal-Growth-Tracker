import { bad } from './core/http.js';
import {
  authConfigured,
  authMode,
  createAuth,
  getAuthenticatedContext,
  legacyAuthContext,
  requestWithAuthContext
} from './core/auth.js';
import { healthRoute } from './platform/health.js';
import { createModuleRegistry } from './platform/module-registry.js';
import { platformModules } from './modules/catalog.js';
import {
  accountMeRoute,
  accountStatusRoute,
  createInviteRoute,
  listInvitesRoute,
  resetWorkspaceRoute,
  revokeInviteRoute
} from './routes/account.js';
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

// Explicit migration-only compatibility surface. These tables predate profile
// ownership and therefore remain owner-only once multi-user auth is enforced.
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
    if (route.sunset !== LEGACY_BETA_SUNSET) throw new Error('Legacy route is missing the Beta sunset contract.');
    if (Boolean(route.path) === Boolean(route.prefix)) throw new Error('Legacy route must declare exactly one path or prefix.');
    if (typeof route.handler !== 'function') throw new Error('Legacy route must declare a handler.');
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

function isAuthApi(path) {
  return path === '/api/auth' || path.startsWith('/api/auth/');
}

async function routeAccount(context) {
  const { method, path } = context;
  if (method === 'GET' && path === '/api/account/me') return accountMeRoute(context);
  if (method === 'GET' && path === '/api/account/invites') return listInvitesRoute(context);
  if (method === 'POST' && path === '/api/account/invites') return createInviteRoute(context);
  if (method === 'POST' && path === '/api/account/invites/revoke') return revokeInviteRoute(context);
  if (method === 'POST' && path === '/api/account/reset-workspace') return resetWorkspaceRoute(context);
  return null;
}

export async function routeApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Operational and auth-discovery routes never expose personal product data.
  if (method === 'GET' && path === '/api/health') return healthRoute({ request, url, env });
  if (method === 'GET' && path === '/api/account/status') return accountStatusRoute({ request, url, env });

  // Better Auth owns its standard OAuth/email/session endpoints. It is mounted
  // before the private API boundary so callbacks can create verified sessions.
  if (isAuthApi(path)) {
    if (!authConfigured(env)) return bad('Growth Compass authentication is not configured.', 503);
    const auth = createAuth(request, env, ctx);
    return auth.handler(request);
  }

  const mode = authMode(env);
  const authContext = mode === 'enforced'
    ? await getAuthenticatedContext(request, env, ctx)
    : legacyAuthContext();

  // Remove any client-supplied identity claims and inject only server-resolved
  // ownership. Feature modules can continue using resolveProfileId(request).
  const internalRequest = requestWithAuthContext(request, authContext, mode);
  const internalUrl = new URL(internalRequest.url);
  const context = {
    request: internalRequest,
    url: internalUrl,
    env,
    ctx,
    method,
    path,
    authContext
  };

  const accountResponse = await routeAccount(context);
  if (accountResponse) return accountResponse;

  // Version 1 routes are profile-scoped by their existing module contracts.
  const registered = moduleRegistry.match(method, path);
  if (registered) return registered.route.handler({ ...context, module: registered.module });

  for (const route of legacyBetaRoutes) {
    if (matchesLegacyRoute(route, method, path)) {
      if (mode === 'enforced' && authContext.role !== 'owner') {
        return bad('API route not found', 404);
      }
      return route.handler(context);
    }
  }

  // Export is profile-scoped; its legacy section already returns empty data for
  // non-default profiles.
  if (method === 'GET' && path === '/api/export') return exportRoute(context);

  return bad('API route not found', 404);
}
