import { json } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { progressContractV1 } from '../modules/progress/public.js';

export async function historyRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const from = url.searchParams.get('from') || '2026-08-10';
  const to = url.searchParams.get('to') || new Date().toISOString().slice(0, 10);

  const [energy, progress] = await Promise.all([
    env.DB.prepare(
      'SELECT * FROM energy_logs WHERE occurred_on BETWEEN ? AND ? ORDER BY occurred_on DESC'
    ).bind(from, to).all(),

    progressContractV1.listHistory(
      env.DB,
      profileId,
      {
        from,
        to,
        limit: 300,
        includeLegacy: true
      }
    )
  ]);

  return json({
    energy: energy.results,
    sessions: progress
  });
}
