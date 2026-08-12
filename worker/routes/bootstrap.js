import { json } from '../core/http.js';
import { getBootstrap } from '../data/bootstrap.js';

export async function bootstrapRoute({ url, env }) {
  const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  return json(await getBootstrap(env.DB, date));
}
