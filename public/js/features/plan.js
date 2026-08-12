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
  return `<div class="card module-error" data-module="${module.id}"><div class="section-head"><div><h2>${module.id} is temporarily unavailable</h2><p>${message}</p></div></div><p class="small muted">Other independent modules remain available. Reload after fixing this module.</p></div>`;
}

export async function renderPlan({ reload }) {
  const root = $('#planView');
  if (!root) return;

  root.innerHTML = `<div class="card"><div class="section-head"><div><h2>Loading Version 1 plan…</h2><p>Independent modules are being composed into this screen.</p></div></div></div>${legacyPlanHtml(state.data)}`;
  bindLegacyPlan(state.data, { reload });

  const enabled = registry.modules.filter((module) => module.defaultEnabled !== false && module.slots.some((slot) => slot.name === 'plan'));
  const results = {};

  // Load in dependency order. A failed module blocks only its explicit dependents,
  // not unrelated modules on the same page.
  for (const module of enabled) {
    const failedDependency = module.dependsOn.find((dependency) => results[dependency]?.status !== 'ready');
    if (failedDependency) {
      results[module.id] = { status: 'blocked', error: `Dependency ${failedDependency} is unavailable.` };
      continue;
    }

    try {
      const models = Object.fromEntries(Object.entries(results)
        .filter(([, result]) => result.status === 'ready')
        .map(([id, result]) => [id, result.model]));
      results[module.id] = { status: 'ready', model: await module.load({ date: state.date, models }) };
    } catch (error) {
      results[module.id] = { status: 'failed', error: error?.message || 'Could not load this module.' };
    }
  }

  const models = Object.fromEntries(Object.entries(results)
    .filter(([, result]) => result.status === 'ready')
    .map(([id, result]) => [id, result.model]));

  const planModules = [...enabled].sort((a, b) => slotOrder(a, 'plan') - slotOrder(b, 'plan'));
  const panels = planModules.map((module) => {
    const result = results[module.id];
    if (!result || result.status !== 'ready') return moduleErrorHtml(module, result?.error || 'Module unavailable.');
    try {
      return module.render({ model: result.model, models, date: state.date });
    } catch (error) {
      results[module.id] = { status: 'failed', error: error?.message || 'Could not render this module.' };
      return moduleErrorHtml(module, results[module.id].error);
    }
  }).join('');

  root.innerHTML = `
    <div class="plan-intro card"><div><p class="eyebrow">Version 1 · beta</p><h2>Your plan should fit your life</h2><p class="muted">Each section below is an independently registered module with an explicit contract and failure boundary.</p></div></div>
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
