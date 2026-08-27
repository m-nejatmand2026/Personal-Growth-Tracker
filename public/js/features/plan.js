import { $, escapeHtml } from '../core/dom.js';
import { state } from '../core/state.js';
import { createFrontendModuleRegistry } from '../platform/module-registry.js';
import { frontendModules } from '../modules/catalog.js';
import { bindLegacyPlan, legacyPlanHtml } from './plan/legacy.js';

const registry = createFrontendModuleRegistry(frontendModules);
const EXPERIENCE_ORDER = Object.freeze({ goals: 10, activities: 15, areas: 20, plans: 30, capacity: 40 });
const PLAN_SECTION_LABELS = Object.freeze({
  goals: 'Goals',
  activities: 'Activities',
  areas: 'Life areas',
  plans: 'Goal time budgets',
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
  return `<section class="plan-module-block" data-module="${module.id}"><div class="card module-error"><div class="section-head"><div><h2>This section is temporarily unavailable</h2><p>${escapeHtml(message)}</p></div></div><p class="small muted">The rest of your Plan is still available.</p></div></section>`;
}

function normalized(module, item, index) {
  if (!item || typeof item !== 'object') return null;
  return {
    moduleId: module.id,
    id: String(item.id || `${module.id}.${index}`),
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : 100,
    label: item.label ?? '',
    value: item.value ?? '—',
    detail: item.detail ?? ''
  };
}

function collectContribution(output, module, value) {
  const list = Array.isArray(value) ? value : [value];
  list.forEach((item, index) => {
    const contribution = normalized(module, item, index);
    if (contribution) output.push(contribution);
  });
}

function planSummaryContributions(enabled, results) {
  const output = [];
  for (const module of enabled) {
    const result = results[module.id];
    if (result?.status !== 'ready' || typeof module.planSummary !== 'function') continue;
    try {
      collectContribution(output, module, module.planSummary({
        model: result.model,
        models: dependencyModelsFor(module, results),
        date: state.date,
        dependencies: dependenciesFor(module)
      }));
    } catch (error) {
      console.error(`Failed planSummary for module ${module.id}`, error);
    }
  }
  return output.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function planWorkingContributions(enabled, results) {
  const output = [];
  for (const module of enabled) {
    const result = results[module.id];
    if (result?.status !== 'ready' || typeof module.planWorkingSummary !== 'function') continue;
    try {
      collectContribution(output, module, module.planWorkingSummary({
        model: result.model,
        models: dependencyModelsFor(module, results),
        date: state.date,
        dependencies: dependenciesFor(module)
      }));
    } catch (error) {
      console.error(`Failed planWorkingSummary for module ${module.id}`, error);
    }
  }
  return output.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function planOverview(enabled, results) {
  const cards = planSummaryContributions(enabled, results).map((item) => `
    <div class="gc-plan-stat">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </div>`).join('');

  return `<section class="gc-plan-rebuild" aria-labelledby="planCurrentTitle">
    <header class="gc-plan-header">
      <div><h2 id="planCurrentTitle">Plan</h2><p>Choose what deserves attention, then fit it to the time you actually have.</p></div>
      <button type="button" class="gc-primary-action" id="planActivityButton">＋ Plan activity</button>
    </header>
    <section class="gc-week-fit">
      <div class="gc-week-fit-head"><div><span>This week</span><h3>Time fit</h3></div><button type="button" data-plan-scroll="capacityPanel">Adjust time</button></div>
      <div class="gc-plan-stats">${cards}</div>
    </section>
  </section>`;
}

function planWorkingSurface(enabled, results) {
  const items = planWorkingContributions(enabled, results);
  const rows = items.length
    ? items.map((item) => `<button type="button" class="gc-plan-goal-focus gc-live-tile" data-plan-scroll="plan-module-${escapeHtml(item.moduleId)}" data-working-id="${escapeHtml(item.id)}">
        <span class="gc-plan-goal-mark" aria-hidden="true">${escapeHtml(String(item.label || 'G')[0].toUpperCase())}</span>
        <span class="gc-plan-goal-copy"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml([item.value, item.detail].filter(Boolean).join(' · '))}</small></span>
        <b class="gc-live-tile-arrow" aria-hidden="true">›</b>
      </button>`).join('')
    : `<div class="gc-plan-working-empty"><strong>No active Goals yet.</strong><span>Add one direction that matters, then give it realistic time.</span><button type="button" data-plan-scroll="goalEditor">＋ Add goal</button></div>`;

  return `<section class="gc-plan-working" aria-labelledby="planDirectionTitle">
    <div class="gc-plan-working-head"><div><span>Direction</span><h3 id="planDirectionTitle">What deserves attention</h3></div><button type="button" data-plan-scroll="goalEditor">Manage goals</button></div>
    <div class="gc-plan-goal-focus-list">${rows}</div>
    <div class="gc-plan-working-actions">
      <button type="button" class="gc-live-tile" data-plan-scroll="plan-module-activities"><span><strong>Activities</strong><small>Reusable things you actually do</small></span><b aria-hidden="true">›</b></button>
      <button type="button" class="gc-live-tile" data-plan-scroll="commitmentEditor"><span><strong>Schedule</strong><small>Recurring commitments</small></span><b aria-hidden="true">›</b></button>
      <button type="button" class="gc-live-tile" data-plan-scroll="plan-module-plans"><span><strong>Time budgets</strong><small>Planned attention by Goal</small></span><b aria-hidden="true">›</b></button>
    </div>
  </section>`;
}

function planNavigation() {
  return `<nav class="gc-plan-sections" aria-label="Plan sections">
    <button class="gc-live-tile" type="button" data-plan-scroll="plan-module-goals"><span>Goals</span><small>What matters longer term</small><b aria-hidden="true">›</b></button>
    <button class="gc-live-tile" type="button" data-plan-scroll="plan-module-activities"><span>Activities</span><small>Reusable things you actually do</small><b aria-hidden="true">›</b></button>
    <button class="gc-live-tile" type="button" data-plan-scroll="commitmentEditor"><span>Schedule</span><small>Recurring commitments</small><b aria-hidden="true">›</b></button>
    <button class="gc-live-tile" type="button" data-plan-scroll="plan-module-plans"><span>Goal time budgets</span><small>How much attention you intend to give</small><b aria-hidden="true">›</b></button>
    <button class="gc-live-tile" type="button" data-plan-scroll="capacityPanel"><span>Time & capacity</span><small>What realistically fits</small><b aria-hidden="true">›</b></button>
    <button class="gc-live-tile" type="button" data-plan-scroll="compassSection"><span>Compass</span><small>Long-range direction</small><b aria-hidden="true">›</b></button>
  </nav>`;
}

function planModuleLabel(module) {
  return PLAN_SECTION_LABELS[module.id] || module.id.replaceAll('-', ' ').replace(/^./, (value) => value.toUpperCase());
}

function planModuleContext(module) {
  if (module.id === 'goals') return 'Direction';
  if (module.id === 'activities') return 'Reusable actions';
  if (module.id === 'areas') return 'Your own life structure';
  if (module.id === 'plans') return 'Planned attention';
  return 'Time reality';
}

export async function renderPlan({ reload, openLogger } = {}) {
  const root = $('#planView');
  if (!root) return;

  // A module save rerenders Plan. Preserve the user's current disclosure/editor
  // context so a successful action does not immediately hide its result.
  const openDisclosureIds = new Set(
    [...root.querySelectorAll('details[open][id]')].map((node) => node.id)
  );

  const enabled = registry.enabled().filter((module) => module.slots.some((slot) => slot.name === 'plan'));
  const results = {};

  for (const module of enabled) {
    const failedDependency = module.dependsOn.find((id) => results[id]?.status !== 'ready');
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

  const panels = [...enabled]
    .sort((a, b) => slotOrder(a, 'plan') - slotOrder(b, 'plan'))
    .map((module) => {
      const result = results[module.id];
      if (!result || result.status !== 'ready') {
        return moduleErrorHtml(module, result?.error || 'Section unavailable.');
      }
      try {
        const open = module.id === 'goals' ? 'open' : '';
        return `<details class="plan-module-block plan-module-disclosure" id="plan-module-${module.id}" data-module="${module.id}" ${open}>
          <summary class="plan-module-summary"><div><strong>${escapeHtml(planModuleLabel(module))}</strong><small>${escapeHtml(planModuleContext(module))}</small></div><span aria-hidden="true">⌄</span></summary>
          <div class="plan-module-content">${module.render({
            model: result.model,
            models: dependencyModelsFor(module, results),
            date: state.date,
            dependencies: dependenciesFor(module)
          })}</div>
        </details>`;
      } catch (error) {
        return moduleErrorHtml(module, error?.message || 'Could not display this section.');
      }
    }).join('');

  root.innerHTML = `${planOverview(enabled, results)}${planWorkingSurface(enabled, results)}${planNavigation()}<div class="plan-module-stack">${panels}</div><details id="compassSection" class="compass-section plan-module-disclosure"><summary class="plan-module-summary"><div><strong>Compass</strong><small>Long-range direction</small></div><span aria-hidden="true">⌄</span></summary><div class="plan-module-content"><div class="gc-sr-only">Long-term direction. Directional, editable, never contractual.</div>${legacyPlanHtml()}</div></details>`;

  for (const id of openDisclosureIds) {
    const disclosure = document.getElementById(id);
    if (disclosure?.matches('details')) disclosure.open = true;
  }

  $('#planActivityButton')?.addEventListener('click', () => void openLogger?.({ entryMode: 'planned', date: state.date }));

  root.querySelectorAll('[data-plan-scroll]').forEach((button) => button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.planScroll);
    if (target?.matches('details')) target.open = true;
    const disclosure = target?.matches('details.plan-module-disclosure')
      ? target
      : target?.closest('details.plan-module-disclosure');
    if (disclosure) disclosure.open = true;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const rerender = async () => renderPlan({ reload, openLogger });
  for (const module of enabled) {
    const result = results[module.id];
    if (result?.status === 'ready' && typeof module.bind === 'function') {
      try {
        module.bind({
          model: result.model,
          models: dependencyModelsFor(module, results),
          date: state.date,
          reload: rerender,
          dependencies: dependenciesFor(module)
        });
      } catch (error) {
        console.error(`Failed to bind module ${module.id}`, error);
      }
    }
  }

  bindLegacyPlan();
}
