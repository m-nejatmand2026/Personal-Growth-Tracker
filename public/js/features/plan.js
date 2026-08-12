import { $ } from '../core/dom.js';
import { formatMinutes } from '../core/format.js';
import { state } from '../core/state.js';
import { createFrontendModuleRegistry } from '../platform/module-registry.js';
import { frontendModules } from '../modules/catalog.js';
import { bindLegacyPlan, legacyPlanHtml } from './plan/legacy.js';

const registry = createFrontendModuleRegistry(frontendModules);
const EXPERIENCE_ORDER = Object.freeze({ areas: 10, goals: 20, plans: 30, capacity: 40 });

function slotOrder(module, slotName) {
  return EXPERIENCE_ORDER[module.id] ?? module.slots.find((slot) => slot.name === slotName)?.order ?? 100;
}

function moduleErrorHtml(module, message) {
  return `<section class="plan-module-block" data-module="${module.id}"><div class="card module-error"><div class="section-head"><div><h2>This section is temporarily unavailable</h2><p>${message}</p></div></div><p class="small muted">The rest of your Plan is still available.</p></div></section>`;
}

function loadLabel(summary) {
  if (!summary) return '—';
  if (summary.impossible_by_minutes) return 'Over capacity';
  const load = Number(summary.plan_load || 0);
  if (load <= 0.5) return 'Spacious';
  if (load <= 0.7) return 'Balanced';
  if (load <= 0.85) return 'Full';
  if (load <= 1) return 'Very full';
  return 'Over capacity';
}

function planOverview(models) {
  const areas = models.areas?.areas || [];
  const goals = (models.goals?.goals || []).filter((goal) => goal.status !== 'archived');
  const week = models.capacity?.week || null;
  const plan = models.plans || null;
  const planLoad = week?.plan_load == null ? null : Math.round(Number(week.plan_load) * 100);

  return `<section class="plan-overview">
    <div class="plan-overview-copy">
      <span class="section-kicker">Plan at a glance</span>
      <h2>Make ambition fit the life you actually have</h2>
      <p>Goals define direction. Capacity protects sleep, work and real commitments before more time is promised.</p>
    </div>
    <div class="plan-overview-grid">
      <div><span>Active goals</span><strong>${goals.length}</strong><small>${areas.length} life areas</small></div>
      <div><span>Flexible this week</span><strong>${week ? formatMinutes(week.flexible_minutes) : '—'}</strong><small>after recurring time</small></div>
      <div><span>How full?</span><strong>${loadLabel(week)}</strong><small>${planLoad == null ? 'No load yet' : `${planLoad}% of flexible time`}</small></div>
      <div><span>Current plan</span><strong class="plan-version-name">${plan?.version?.label || 'No active plan'}</strong><small>future changes preserve history</small></div>
    </div>
  </section>`;
}

function planNavigation() {
  return `<nav class="plan-section-nav" aria-label="Plan sections">
    <button type="button" data-plan-scroll="plan-module-areas"><span>01</span>Goals</button>
    <button type="button" data-plan-scroll="plan-module-capacity"><span>02</span>Capacity</button>
    <button type="button" data-plan-scroll="plan-module-capacity"><span>03</span>Schedule</button>
    <button type="button" data-plan-scroll="compassSection"><span>04</span>Compass</button>
  </nav>`;
}

export async function renderPlan({ reload }) {
  const root = $('#planView');
  if (!root) return;

  root.innerHTML = `<section class="plan-loading"><span class="section-kicker">Plan</span><h2>Loading your goals and time reality…</h2></section>`;

  const enabled = registry.modules.filter((module) => module.defaultEnabled !== false && module.slots.some((slot) => slot.name === 'plan'));
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
      return `<section class="plan-module-block" id="plan-module-${module.id}" data-module="${module.id}">${module.render({ model: result.model, models, date: state.date })}</section>`;
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
      ${legacyPlanHtml(state.data)}
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
      module.bind({ model: result.model, models, date: state.date, reload: reloadPlatform });
    } catch (error) {
      console.error(`Failed to bind module ${module.id}`, error);
    }
  }
  bindLegacyPlan(state.data, { reload });
}
