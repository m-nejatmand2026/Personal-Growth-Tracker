import { api } from './core/api.js';
import { $, $$ } from './core/dom.js';
import { createFallback } from './core/fallback.js';
import { state } from './core/state.js';
import { renderInsights } from './features/insights.js';
import { createLogger } from './features/logger.js';
import { renderPlan } from './features/plan.js';
import { renderSettings } from './features/settings.js';
import { focusTodayActivities, renderToday } from './features/today.js';
import { frontendModules } from './modules/catalog.js';
import { createFrontendModuleRegistry } from './platform/module-registry.js';
import { createEventBus } from './platform/event-bus.js';

const PRIMARY_VIEWS = new Set(['today', 'plan', 'progress', 'insights']);
const viewTitles = {
  today: 'Today',
  plan: 'Plan',
  progress: 'Progress',
  insights: 'Insights',
  journal: 'Journal',
  settings: 'Settings'
};

const moduleRegistry = createFrontendModuleRegistry(frontendModules);
const eventBus = createEventBus();
const dailyPlan = moduleRegistry.get('daily-plan');
const journal = moduleRegistry.get('journal');
const progress = moduleRegistry.get('progress');
let lastPrimaryView = 'today';
let journalFilters = { query: '', filterDate: '' };

async function load() {
  try {
    state.data = await api(`/api/bootstrap?date=${state.date}`);
  } catch {
    state.data = createFallback(state.date);
  }

  state.selectedEnergy = state.data.energy;
  await renderCurrentView();
}

async function renderTodayView() {
  let dailyPlanModel = null;
  let dailyPlanPanel = '';
  let journalPreviewModel = null;
  let journalPreview = '';

  if (dailyPlan) {
    try {
      dailyPlanModel = await dailyPlan.load({ date: state.date });
      dailyPlanPanel = dailyPlan.render({ model: dailyPlanModel, date: state.date });
    } catch (error) {
      dailyPlanPanel = `<section class="os-section daily-plan-section"><div class="daily-plan-empty"><strong>Short-term planning is temporarily unavailable.</strong><span>${error?.message || 'Other parts of Today still work.'}</span></div></section>`;
    }
  }

  if (journal) {
    try {
      journalPreviewModel = await journal.loadPreview({ date: state.date });
      journalPreview = journal.renderPreview({ model: journalPreviewModel });
    } catch {
      journalPreview = '';
    }
  }

  await renderToday({
    reload: load,
    openLogger: logger.open,
    dailyPlanPanel,
    journalPreview
  });

  if (dailyPlan && dailyPlanModel) {
    dailyPlan.bind({ model: dailyPlanModel, events: eventBus, reload: load });
  }

  if (journal && journalPreviewModel) {
    journal.bindPreview({ model: journalPreviewModel, events: eventBus, reload: load });
  }
}

async function renderJournalView(overrides = null) {
  const root = $('#journalView');
  if (!root) return;

  if (!journal) {
    root.innerHTML = '<div class="empty">Journal is unavailable.</div>';
    return;
  }

  if (overrides) {
    journalFilters = { ...journalFilters, ...overrides };
  }

  try {
    const model = await journal.loadView({
      date: state.date,
      query: journalFilters.query,
      filterDate: journalFilters.filterDate
    });

    root.innerHTML = journal.renderView({ model });

    journal.bindView({
      model,
      rerender: async (next) => {
        if (next) journalFilters = { ...journalFilters, ...next };
        await renderJournalView();
      }
    });
  } catch (error) {
    root.innerHTML = `<section class="os-section"><div class="empty">${error?.message || 'Could not load journal.'}</div></section>`;
  }
}

async function renderCurrentView() {
  if (state.view === 'today') await renderTodayView();
  if (state.view === 'plan') await renderPlan({ reload: load });

  if (state.view === 'progress') {
    if (progress) {
      await progress.render({ reload: load });
    } else {
      const root = $('#progressView');
      if (root) root.innerHTML = '<div class="empty">Progress is unavailable.</div>';
    }
  }

  if (state.view === 'insights') await renderInsights();
  if (state.view === 'journal') await renderJournalView();
  if (state.view === 'settings') renderSettings({ reload: load });
}

async function showView(name) {
  if (!viewTitles[name]) return;

  state.view = name;
  if (PRIMARY_VIEWS.has(name)) lastPrimaryView = name;

  $$('.view').forEach((view) => view.classList.remove('active'));
  $(`#${name}View`)?.classList.add('active');

  $$('.nav-btn[data-view], .rail-nav-btn[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === name);
  });

  $('#journalBtn')?.classList.toggle('active', name === 'journal');
  $('#journalRailBtn')?.classList.toggle('active', name === 'journal');
  $('#pageTitle').textContent = viewTitles[name];

  await renderCurrentView();
}

const logger = createLogger({
  onIntent: async (input) => {
    if (!dailyPlan) throw new Error('Daily planning is unavailable.');
    await dailyPlan.create(input);
    await load();
  },

  onSaved: async ({ dailyPlanId } = {}) => {
    if (dailyPlanId && dailyPlan) {
      try {
        await dailyPlan.setStatus(Number(dailyPlanId), 'completed');
      } catch (error) {
        console.error(
          'Progress saved, but the daily-plan item could not be completed.',
          error
        );
      }
    }

    await load();
  }
});

eventBus.subscribe(
  'daily-plan.completion-requested',
  async (input) => {
    await logger.open(input);
  }
);

eventBus.subscribe(
  'journal.view-requested',
  async () => {
    await showView('journal');
  }
);

$$('.nav-btn[data-view], .rail-nav-btn[data-view]').forEach((button) => {
  button.addEventListener('click', () => void showView(button.dataset.view));
});

$$('[data-open-logger]').forEach((button) => {
  button.addEventListener('click', () => void logger.open());
});

function toggleSettings() {
  void showView(state.view === 'settings' ? lastPrimaryView : 'settings');
}

$('#settingsBtn')?.addEventListener('click', toggleSettings);
$('#settingsRailBtn')?.addEventListener('click', toggleSettings);
$('#journalBtn')?.addEventListener('click', () => void showView('journal'));
$('#journalRailBtn')?.addEventListener('click', () => void showView('journal'));

window.addEventListener(
  'growth-compass:open-logger',
  (event) => void logger.open(event.detail || {})
);

window.addEventListener(
  'growth-compass:open-journal',
  () => void showView('journal')
);

window.addEventListener(
  'growth-compass:focus-today',
  async () => {
    await showView('today');
    requestAnimationFrame(focusTodayActivities);
  }
);

void load();
