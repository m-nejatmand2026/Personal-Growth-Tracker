import { bad } from '../core/http.js';

function retired() {
  return bad('Legacy personal roadmap editing is retired from the generic Version 1 runtime.', 410);
}

export async function createRoadmapRoute() {
  return retired();
}

export async function updateRoadmapRoute() {
  return retired();
}
