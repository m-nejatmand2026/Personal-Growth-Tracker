import { json } from '../core/http.js';

export async function historyRoute({ url, env }) {
  const from = url.searchParams.get('from') || '2026-08-10';
  const to = url.searchParams.get('to') || new Date().toISOString().slice(0, 10);
  const [energy, sessions] = await Promise.all([
    env.DB.prepare('SELECT * FROM energy_logs WHERE occurred_on BETWEEN ? AND ? ORDER BY occurred_on DESC').bind(from, to).all(),
    env.DB.prepare(`
      SELECT s.*, a.name AS activity_name
      FROM sessions s
      JOIN activities a ON a.key=s.activity_key
      WHERE occurred_on BETWEEN ? AND ?
      ORDER BY occurred_on DESC, id DESC
      LIMIT 300
    `).bind(from, to).all()
  ]);
  return json({ energy: energy.results, sessions: sessions.results });
}
