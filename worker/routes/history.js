import { json } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { progressContractV1 } from '../modules/progress/public.js';
import { wellbeingContractV1 } from '../modules/wellbeing/public.js';

export async function historyRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const from = url.searchParams.get('from') || '2026-08-10';
  const to = url.searchParams.get('to') || new Date().toISOString().slice(0, 10);

  const [energy, progress] = await Promise.all([
    wellbeingContractV1.listEnergy(
      env.DB,
      profileId,
      { from, to, limit: 300 }
    ),

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
    energy,
    sessions: progress
  });
}
