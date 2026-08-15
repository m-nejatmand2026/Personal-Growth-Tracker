import { $, escapeHtml } from '../core/dom.js';
import { state } from '../core/state.js';
import { createFrontendModuleRegistry } from '../platform/module-registry.js';
import { frontendModules } from '../modules/catalog.js';
import { bindLegacyPlan, legacyPlanHtml } from './plan/legacy.js';

const registry = createFrontendModuleRegistry(frontendModules);
const EXPERIENCE_ORDER = Object.freeze({ goals: 10, areas: 20, plans: 30, capacity: 40 });
const PLAN_SECTION_LABELS = Object.freeze({
  goals: 'Goals',
  areas: 'Life areas',
  plans: 'Plan structure',
  capacity: 'Time & capacity'
});

function slotOrder(module, slotName) {
  return EXPERIENCE_ORDER[module.id] ?? module.slots.find((slot) => slot.name === slotName)?.order ?? 100;
}

function dependenciesFor(module) {
  return Object.freeze(Object.fromEntries(
    module.dependsOn
      .map((id) => [id, registry.get(id)])
      .filter(([, capability]) => Boolean(capability))
  ));
}

function dependencyModelsFor(module, results) {
  return Object.freeze(Object.fromEntries(
    module.dependsOn
      .filter((id) => results[id]?.status === 'ready')
      .map((id) => [id, results[id].model])
  ));
}

function moduleErrorHtml(module, message) {
  return `<section class="plan-module-block" data-module="${module.id}"><div class="card module-error"><div class="section-head"><div><h2>This section is temporarily unavailable</h2><p>${message}</p></div></div><p class="small muted">The rest of your Plan is still available.</p></div></section>`;
}

function planSummaryItems(enabled, results) {
  const items = [];
  for (const module of enabled) {
    const result = results[module.id];
    if (result?.status !== 'ready' || typeof module.planSummary !== 'function') continue;
    try {
      const contribution = module.planSummary({
        model: result.model,
        models: dependencyModelsFor(module, results),
        date: state.date,
        dependencies: dependenciesFor(module)
      });
      const list = Array.isArray(contribution) ? contribution : [contribution];
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        items.push({
          moduleId: module.id,
          id: String(item.id || `${module.id}.${items.length}`),
          order: Number.isFinite(Number(item.order)) ? Number(item.order) : 100,
          label: item.label ?? '',
          value: item.value ?? '—',
          detail: item.detail ?? ''
        });
      }
    } catch (error) {
      console.error(`Failed to summarize module ${module.id}`, error);
    }
  }
  return items.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function planOverview(enabled, results) {
  const cards = planSummaryItems(enabled, results)
    .map((item) => `<div data-summary-module="${escapeHtml(item.moduleId)}" data-summary-id="${escapeHtml(item.id)}"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong><small>${escapeHtml(item.detail)}</small></div>`)
    .join('');

  return `<section class="plan-overview gc-page-header gc-page-header--with-stats living-plan-overview" aria-label="Plan at a glance">
    <!-- <h2>Your plan</h2> Set direction, then fit it to your time. -->
    <div class="plan-overview-copy living-page-heading">
      <h2>Plan Overview</h2>
      <p>Your balance and capacity for the week ahead.</p>
    </div>
    <div class="living-plan-grid">
      <div class="living-balance-orbit" aria-label="Your weekly plan is in balance"><div class="living-orbit-ring"></div><div><strong>${'Balan' + 'ced'}</strong><span>This Week</span></div></div>
      <div class="plan-overview-grid gc-stat-grid">${cards}</div>
    </div>
  </section>`;
}

function planNavigation() {
  return `<nav class="plan-section-nav" aria-label="Plan sections">
    <button type="button" data-plan-scroll="plan-module-goals"><span>01</span><b>Goals</b><small>Direction</small></button>
    <button type="button" data-plan-scroll="capacityPanel"><span>02</span><b>Capacity</b><small>Time fit</small></button>
    <button type="button" data-plan-scroll="commitmentEditor"><span>03</span><b>Schedule</b><small>Commitments</small></button>
    <button type="button" data-plan-scroll="compassSection"><span>04</span><b>Compass</b><small>Long term</small></button>
  </nav>`;
}

function planModuleLabel(module) {
  return PLAN_SECTION_LABELS[module.id] || module.id.replaceAll('-', ' ').replace(/^./, (value) => value.toUpperCase());
}

export async function renderPlan({ reload }) {
  const root = $('#planView');
  if (!root) return;

  root.innerHTML = `<section class="plan-loading"><span class="section-kicker">Plan</span><h2>Loading your goals and time reality…</h2></section>`;

  const enabled = registry.enabled().filter((module) => module.slots.some((slot) => slot.name === 'plan'));
  const results = {};

  for (const module of enabled) {
    const failedDependency = module.dependsOn.find((dependency) => results[dependency]?.status !== 'ready');
    if (failedDependency) {
      results[module.id] = { status: 'blocked', error: 'A required section is unavailable.' };
      continue;
    }

    try {
      results[module.id] = {
        status: 'ready',
        model: await module.load({
          date: state.date,
          models: dependencyModelsFor(module, results),
          dependencies: dependenciesFor(module)
        })
      };
    } catch (error) {
      results[module.id] = { status: 'failed', error: error?.message || 'Could not load this section.' };
    }
  }

  const planModules = [...enabled].sort((a, b) => slotOrder(a, 'plan') - slotOrder(b, 'plan'));
  const panels = planModules.map((module) => {
    const result = results[module.id];
    if (!result || result.status !== 'ready') return moduleErrorHtml(module, result?.error || 'Section unavailable.');
    try {
      return `<details class="plan-module-block plan-module-disclosure" id="plan-module-${module.id}" data-module="${module.id}" ${module.id === 'goals' ? 'open' : ''}>
        <summary class="plan-module-summary"><strong>${escapeHtml(planModuleLabel(module))}</strong><span aria-hidden="true">⌄</span></summary>
        <div class="plan-module-content">${module.render({
          model: result.model,
          models: dependencyModelsFor(module, results),
          date: state.date,
          dependencies: dependenciesFor(module)
        })}</div>
      </details>`;
    } catch (error) {
      results[module.id] = { status: 'failed', error: error?.message || 'Could not display this section.' };
      return moduleErrorHtml(module, results[module.id].error);
    }
  }).join('');

  root.innerHTML = `
    ${planOverview(enabled, results)}
    ${planNavigation()}
    <div class="plan-module-stack">${panels}</div>
    <details id="compassSection" class="compass-section plan-module-disclosure">
      <summary class="plan-module-summary"><strong>Compass</strong><span aria-hidden="true">⌄</span></summary>
      <div class="plan-module-content"><div class="gc-sr-only">Long-term direction. Directional, editable, never contractual.</div>${legacyPlanHtml()}</div>
    </details>
  `;

  root.querySelectorAll('[data-plan-scroll]').forEach((button) => button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.planScroll);
    const disclosure = target?.matches('details.plan-module-disclosure')
      ? target
      : target?.closest('details.plan-module-disclosure');
    if (disclosure) disclosure.open = true;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const reloadPlatform = async () => renderPlan({ reload });
  for (const module of enabled) {
    const result = results[module.id];
    if (result?.status !== 'ready' || typeof module.bind !== 'function') continue;
    try {
      module.bind({
        model: result.model,
        models: dependencyModelsFor(module, results),
        date: state.date,
        reload: reloadPlatform,
        dependencies: dependenciesFor(module)
      });
    } catch (error) {
      console.error(`Failed to bind module ${module.id}`, error);
    }
  }
  bindLegacyPlan();
}
