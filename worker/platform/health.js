import { json } from '../core/http.js';

export async function healthRoute({ env }) {
  if (!env?.DB) {
    throw new Error('D1 binding unavailable');
  }

  const result = await env.DB.prepare('SELECT 1 AS ok').first();
  if (Number(result?.ok) !== 1) {
    throw new Error('D1 health check failed');
  }

  return json({
    status: 'ok',
    database: 'ok'
  });
}
