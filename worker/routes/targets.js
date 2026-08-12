import { bad, json } from '../core/http.js';
import { getTargets } from '../data/targets.js';

export async function targetsRoute({ request, env }) {
  const body = await request.json();
  if (!Array.isArray(body.items)) return bad('items must be an array');

  const statements = body.items.map((item) => env.DB.prepare(`
    UPDATE weekly_targets
    SET target_minutes=?, minimum_minutes=?, updated_at=CURRENT_TIMESTAMP
    WHERE activity_key=?
  `).bind(
    Math.round(Number(item.target_minutes)),
    Math.round(Number(item.minimum_minutes)),
    item.key
  ));

  if (statements.length) await env.DB.batch(statements);
  return json({ ok: true, targets: await getTargets(env.DB) });
}
