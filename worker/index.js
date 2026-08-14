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

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      const response = env.ASSETS
        ? await env.ASSETS.fetch(request)
        : new Response('Not found', { status: 404 });

      return secureResponse(response);
    }

    try {
      return secureResponse(
        await routeApi(request, env)
      );
    } catch (error) {
      console.error(JSON.stringify({
        event: 'api_error',
        path: url.pathname,
        method: request.method,
        message: error?.message || 'Unexpected error'
      }));

      if (error instanceof HttpError) {
        return secureResponse(
          json({ error: error.message }, error.status)
        );
      }

      return secureResponse(
        json({ error: 'Unexpected server error' }, 500)
      );
    }
  }
};
