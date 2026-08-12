import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { createFrontendModuleRegistry } from '../platform/module-registry.js';
import { frontendModules } from '../modules/catalog.js';
import { bindLegacyPlan, legacyPlanHtml } from './plan/legacy.js';

const registry = createFrontendModuleRegistry(frontendModules);

function slotOrder(module, slotName) {
  return module.slots.find((slot) => slot.name === slotName)?.order ?? 100;
}

function moduleErrorHtml(module, message) {
  return `<div class="card module-error" data-module="${module.id}"><div class="section-head"><div><h2>This section is temporarily unavailable</h2><p>${message}</p></div></div><p class="small muted">The rest of your Plan is still available.</p></div>`;
}

export async function renderPlan({ reload }) {
  const root = $('#planView');
  if (!root) return;

  root.innerHTML = `<div class="card"><div class="section-head"><div><h2>Loading your plan…</h2><p>Bringing together your goals, time and capacity.</p></div></div></div>${legacyPlanHtml(state.data)}`;
  bindLegacyPlan(state.data, { reload });

  const enabled = registry.modules.filter((module) => module.defaultEnabled !== false && module.slots.some((slot) => slot.name === 'plan'));
  const results = {};

  for (const module of enabled) {
    const failedDependency = module.dependsOn.find((dependency) => results[dependency]?.status !== 'ready');
    if (failedDependency) {
      results[module.id] = { status: 'blocked', error: `A required section is unavailable.` };
      continue;
    }

    try {
      const models = Object.fromEntries(Object.entries(results)
        .filter(([, result]) => result.status === 'ready')
        .map(([id, result]) => [id, result.model]));
      results[module.id] = { status: 'ready', model: await module.load({ date: state.date, models }) };
    } catch (error) {
      results[module.id] = { status: 'failed', error: error?.message || 'Could not load this section.' };
    }
  }

  const models = Object.fromEntries(Object.entries(results)
    .filter(([, result]) => result.status === 'ready')
    .map(([id, result]) => [id, result.model]));

  const planModules = [...enabled].sort((a, b) => slotOrder(a, 'plan') - slotOrder(b, 'plan'));
  const panels = planModules.map((module) => {
    const result = results[module.id];
    if (!result || result.status !== 'ready') return moduleErrorHtml(module, result?.error || 'Section unavailable.');
    try {
      return module.render({ model: result.model, models, date: state.date });
    } catch (error) {
      results[module.id] = { status: 'failed', error: error?.message || 'Could not display this section.' };
      return moduleErrorHtml(module, results[module.id].error);
    }
  }).join('');

  root.innerHTML = `
    <div class="page-lead">
      <p class="eyebrow">Plan</p>
      <h2>Build a plan that fits your real life</h2>
      <p>Start simple. Open details only when you want more control. Changes to future plans should not rewrite your past.</p>
    </div>
    ${panels}
    ${legacyPlanHtml(state.data)}
  `;

  const reloadPlatform = async () => renderPlan({ reload });
  for (const module of enabled) {
    const result = results[module.id];
    if (result?.status !== 'ready' || typeof module.bind !== 'function') continue;
    try {
      module.bind({ model: result.model, models, date: state.date, reload: reloadPlatform });
    } catch (error) {
      console.error(`Failed to bind module ${module.id}`, error);
    }
  }
  bindLegacyPlan(state.data, { reload });
}
