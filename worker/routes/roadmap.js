import { bad, json } from '../core/http.js';

export async function createRoadmapRoute({ request, env }) {
  const body = await request.json();
  if (!['six_month', 'compass'].includes(body.horizon) || !body.title) return bad('invalid roadmap item');

  const result = await env.DB.prepare(
    'INSERT INTO roadmap_items(horizon,title,detail,sort_order) VALUES(?,?,?,?)'
  ).bind(body.horizon, body.title, body.detail || '', Number(body.sort_order) || 100).run();

  return json({ ok: true, id: result.meta.last_row_id });
}

export async function updateRoadmapRoute({ request, url, env }) {
  const id = Number(url.pathname.split('/').pop());
  const body = await request.json();
  if (!id || !body.title) return bad('invalid roadmap item');

  await env.DB.prepare(`
    UPDATE roadmap_items
    SET title=?, detail=?, active=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(body.title, body.detail || '', body.active === false ? 0 : 1, id).run();

  return json({ ok: true });
}
