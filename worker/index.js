import { HttpError, json } from './core/http.js';
import { routeApi } from './router.js';

const SECURITY_HEADERS = Object.freeze({
  'content-security-policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; media-src 'self' blob:",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'referrer-policy': 'no-referrer',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY'
});

function secureResponse(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function logApiFailure(request, url, error) {
  const status = error instanceof HttpError ? error.status : 500;
  if (status < 500) return;
  console.error(JSON.stringify({ event: 'api_error', path: url.pathname, method: request.method, status, error_name: error?.name || 'Error', message: error?.message || 'Unexpected error', ray_id: request.headers.get('cf-ray') || null }));
}

async function serveExperienceOne(request, env) {
  if (!env.ASSETS) return new Response('Not found', { status: 404 });
  const assetUrl = new URL('/experience/1/index.html', request.url);
  const source = await env.ASSETS.fetch(new Request(assetUrl, request));
  if (!source.ok) return source;
  const html = (await source.text())
    .replace('href="/manifest.webmanifest"', 'href="/experience/1/manifest.webmanifest"')
    .replace('</body>', '<script type="module" src="/experience/1/bootstrap.js"></script></body>');
  const headers = new Headers(source.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(html, { status: source.status, statusText: source.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      if (url.pathname === '/experience/1') return Response.redirect(new URL('/experience/1/', request.url), 308);
      if (url.pathname === '/experience/1/') return secureResponse(await serveExperienceOne(request, env));
      const response = env.ASSETS ? await env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
      return secureResponse(response);
    }

    try {
      return secureResponse(await routeApi(request, env));
    } catch (error) {
      logApiFailure(request, url, error);
      if (error instanceof HttpError) return secureResponse(json({ error: error.message }, error.status));
      return secureResponse(json({ error: 'Unexpected server error' }, 500));
    }
  }
};
