import { bad } from '../core/http.js';

/**
 * Legacy Beta endpoint retained only so old clients receive an explicit
 * migration response. Canonical Minimum/Target values are owned by Plans and
 * are edited through the Plan capability.
 */
export async function targetsRoute() {
  return bad('Legacy weekly target editing has moved to Plan.', 410);
}
