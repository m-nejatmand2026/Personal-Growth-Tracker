import { bad, json } from '../core/http.js';

export async function createSessionRoute({ request, env }) {
  const body = await request.json();
  const minutes = Number(body.minutes);
  if (!body.occurred_on || !body.activity_key || !Number.isFinite(minutes) || minutes < 0) {
    return bad('invalid session');
  }

  const result = await env.DB.prepare(
    'INSERT INTO sessions(occurred_on,activity_key,minutes,subtype,note) VALUES(?,?,?,?,?)'
  ).bind(
    body.occurred_on,
    body.activity_key,
    Math.round(minutes),
    body.subtype || null,
    body.note || null
  ).run();

  return json({ ok: true, id: result.meta.last_row_id });
}

export async function deleteSessionRoute({ url, env }) {
  const id = Number(url.searchParams.get('id'));
  if (!id) return bad('id is required');
  await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(id).run();
  return json({ ok: true });
}
