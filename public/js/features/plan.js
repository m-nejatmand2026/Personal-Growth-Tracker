import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { areasPanelHtml, bindAreasPanel, loadAreasModel } from './plan/areas.js';
import { bindCapacityPanel, capacityPanelHtml, loadCapacityModel } from './plan/capacity.js';
import { bindGoalsPanel, goalsPanelHtml, loadGoalsModel } from './plan/goals.js';
import { bindLegacyPlan, legacyPlanHtml } from './plan/legacy.js';

export async function renderPlan({ reload }) {
  const root = $('#planView');
  if (!root) return;
  root.innerHTML = `<div class="card"><div class="section-head"><div><h2>Loading Version 1 plan…</h2><p>Areas, goals and life capacity are loaded as independent modules.</p></div></div></div>${legacyPlanHtml(state.data)}`;
  bindLegacyPlan(state.data, { reload });

  try {
    const [areasModel, goalsModel, capacityModel] = await Promise.all([
      loadAreasModel(),
      loadGoalsModel(),
      loadCapacityModel(state.date)
    ]);

    root.innerHTML = `
      <div class="plan-intro card"><div><p class="eyebrow">Version 1 · beta</p><h2>Your plan should fit your life</h2><p class="muted">Manage broad areas and goals, then use real time capacity to check whether the plan is physically possible.</p></div></div>
      ${capacityPanelHtml(capacityModel)}
      ${areasPanelHtml(areasModel)}
      ${goalsPanelHtml(goalsModel, areasModel.areas)}
      ${legacyPlanHtml(state.data)}
    `;

    const reloadPlatform = async () => renderPlan({ reload });
    bindCapacityPanel(capacityModel, { reloadPlatform });
    bindAreasPanel(areasModel, { reloadPlatform });
    bindGoalsPanel(goalsModel, { reloadPlatform });
    bindLegacyPlan(state.data, { reload });
  } catch (error) {
    root.innerHTML = `<div class="card"><div class="section-head"><div><h2>Version 1 planning foundation is not initialized</h2><p>${error?.message || 'Could not load the new planning data.'}</p></div></div><p class="small muted">Apply the latest preview database migration, then reload. The legacy beta plan remains available below.</p></div>${legacyPlanHtml(state.data)}`;
    bindLegacyPlan(state.data, { reload });
  }
}
