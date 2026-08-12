import { bad, json } from '../core/http.js';

export async function momenteRoute({ request, env }) {
  const body = await request.json();
  const lesson = Number(body.lesson);
  if (!(lesson >= 1 && lesson <= 24)) return bad('lesson must be 1..24');

  await env.DB.prepare('UPDATE momente_lessons SET completed_at=? WHERE lesson=?')
    .bind(body.completed ? (body.completed_at || new Date().toISOString()) : null, lesson)
    .run();

  return json({ ok: true });
}
