import { bad, json } from '../core/http.js';

export async function energyRoute({ request, env }) {
  const body = await request.json();
  if (!body.occurred_on || !body.label) return bad('occurred_on and label are required');

  await env.DB.prepare(`
    INSERT INTO energy_logs(occurred_on,label,row_idx,col_idx,energy_score,valence_score,note,updated_at)
    VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(occurred_on) DO UPDATE SET
      label=excluded.label,
      row_idx=excluded.row_idx,
      col_idx=excluded.col_idx,
      energy_score=excluded.energy_score,
      valence_score=excluded.valence_score,
      note=excluded.note,
      updated_at=CURRENT_TIMESTAMP
  `).bind(
    body.occurred_on,
    body.label,
    body.row_idx,
    body.col_idx,
    body.energy_score,
    body.valence_score,
    body.note || null
  ).run();

  return json({ ok: true });
}
