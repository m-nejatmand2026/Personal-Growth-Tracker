import { bad } from '../core/http.js';

/** Founder-specific Beta mutation retained only as an explicit retired endpoint. */
export async function momenteRoute() {
  return bad('Legacy Momente lesson editing is retired from the generic Version 1 runtime.', 410);
}
