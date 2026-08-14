import { $ } from '../core/dom.js';
import { formatMinutes } from '../core/format.js';
import { state } from '../core/state.js';
import { createFrontendModuleRegistry } from '../platform/module-registry.js';
import { frontendModules } from '../modules/catalog.js';
import { bindLegacyPlan, legacyPlanHtml } from './plan/legacy.js';

const registry = createFrontendModuleRegistry(frontendModules);
const EXPERIENCE_ORDER = Object.freeze({ goals: 10, areas: 20, plans: 30, capacity: 40 });

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

function moduleErrorHtml(module, message) {
  return `<section class="plan-module-block" data-module="${module.id}"><div class="card module-error"><div class="section-head"><div><h2>This section is temporarily unavailable</h2><p>${message}</p></div></div><p class="small muted">The rest of your Plan is still available.</p></div></section>`;
}

function timeFitCard(fit) {
  if (!fit) return '<div><span>Still flexible</span><strong>—</strong><small>time fit unavailable</small></div>';
  if (fit.overcommittedMinutes > 0) {
    return `<div><span>Schedule over by</span><strong>${formatMinutes(fit.overcommittedMinutes)}</strong><small>recurring commitments exceed total time</small></div>`;
  }
  if (fit.overByMinutes > 0) {
    return `<div><span>Plan over by</span><strong>${formatMinutes(fit.overByMinutes)}</strong><small>planned goal time exceeds available time</small></div>`;
  }
  return `<div><span>Still flexible</span><strong>${formatMinutes(fit.remainingMinutes)}</strong><small>not currently assigned to goal time</small></div>`;
}

function planOverview(models) {
  const areas = models.areas?.areas || [];
  const goals = (models.goals?.goals || []).filter((goal) => goal.status !== 'archived');
  const fit = models.capacity?.timeFit?.week || null;

  return `<section class="plan-overview">
    <div class="plan-overview-copy">
      <span class="section-kicker">Plan at a glance</span>
      <h2>Make ambition fit the life you actually have</h2>
      <p>Choose direction first, then see what time is actually available before adding more.</p>
    </div>
    <div class="plan-overview-grid">
      <div><span>Active goals</span><strong>${goals.length}</strong><small>${areas.length} life areas</small></div>
      <div><span>Available this week</span><strong>${fit ? formatMinutes(fit.availableMinutes) : '—'}</strong><small>after recurring commitments</small></div>
      <div><span>Planned this week</span><strong>${fit ? formatMinutes(fit.plannedMinutes) : '—'}</strong><small>goal time currently planned</small></div>
      ${timeFitCard(fit)}
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
      const models = Object.fromEntries(Object.entries(results)
        .filter(([, result]) => result.status === 'ready')
        .map(([id, result]) => [id, result.model]));
      results[module.id] = {
        status: 'ready',
        model: await module.load({ date: state.date, models, dependencies: dependenciesFor(module) })
      };
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
      return `<section class="plan-module-block" id="plan-module-${module.id}" data-module="${module.id}">${module.render({ model: result.model, models, date: state.date, dependencies: dependenciesFor(module) })}</section>`;
    } catch (error) {
      results[module.id] = { status: 'failed', error: error?.message || 'Could not display this section.' };
      return moduleErrorHtml(module, results[module.id].error);
    }
  }).join('');

  root.innerHTML = `
    ${planOverview(models)}
    ${planNavigation()}
    <div class="plan-module-stack">${panels}</div>
    <section id="compassSection" class="compass-section">
      <div class="os-section-head"><div><span class="section-kicker">Long-term direction</span><h2>Compass</h2></div><small>Directional, editable, never contractual</small></div>
      ${legacyPlanHtml()}
    </section>
  `;

  root.querySelectorAll('[data-plan-scroll]').forEach((button) => button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.planScroll);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const reloadPlatform = async () => renderPlan({ reload });
  for (const module of enabled) {
    const result = results[module.id];
    if (result?.status !== 'ready' || typeof module.bind !== 'function') continue;
    try {
      module.bind({
        model: result.model,
        models,
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
