import { json } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { getBootstrap } from '../data/bootstrap.js';

export async function bootstrapRoute({ request, url, env }) {
  const date =
    url.searchParams.get('date')
    || new Date().toISOString().slice(0, 10);

  const profileId = resolveProfileId(request);

  return json(
    await getBootstrap(
      env.DB,
      profileId,
      date
    )
  );
}
