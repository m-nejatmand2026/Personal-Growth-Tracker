import { json } from './core/http.js';
import { routeApi } from './router.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS
        ? env.ASSETS.fetch(request)
        : new Response('Not found', { status: 404 });
    }

    try {
      return await routeApi(request, env);
    } catch (error) {
      console.error(JSON.stringify({
        event: 'api_error',
        path: url.pathname,
        method: request.method,
        message: error?.message || 'Unexpected error'
      }));
      return json({ error: error?.message || 'Unexpected error' }, 500);
    }
  }
};
