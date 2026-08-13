import { api } from './core/api.js';
import { $, $$ } from './core/dom.js';
import { createFallback } from './core/fallback.js';
import { state } from './core/state.js';
import { renderInsights } from './features/insights.js';
import { createLogger } from './features/logger.js';
import { renderPlan } from './features/plan.js';
import { renderProgress } from './features/progress.js';
import { renderSettings } from './features/settings.js';
import { focusTodayActivities, renderToday } from './features/today.js';
import { frontendModules } from './modules/catalog.js';
import { createFrontendModuleRegistry } from './platform/module-registry.js';

const PRIMARY_VIEWS = new Set(['today','plan','progress','insights']);
const viewTitles = {
  today: 'Today',
  plan: 'Plan',
  progress: 'Progress',
  insights: 'Insights',
  settings: 'Settings'
};

const moduleRegistry = createFrontendModuleRegistry(frontendModules);
const todayIntentions = moduleRegistry.get('today-intentions');
let lastPrimaryView = 'today';

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
  let intentionModel = { items: [] };
  let intentionPanel = '';

  if (todayIntentions) {
    try {
      intentionModel = await todayIntentions.load({ date: state.date });
      intentionPanel = todayIntentions.render({ model: intentionModel, date: state.date });
    } catch (error) {
      intentionPanel = `<section class="os-section today-plan-section"><div class="today-plan-empty"><strong>Today&apos;s plan is temporarily unavailable.</strong><span>${error?.message || 'Other parts of Today still work.'}</span></div></section>`;
    }
  }

  await renderToday({ reload: load, openLogger: logger.open, intentionPanel });

  if (todayIntentions && intentionPanel && typeof todayIntentions.bind === 'function') {
    todayIntentions.bind({
      model: intentionModel,
      openLogger: logger.open,
      reload: load
    });
  }
}

async function renderCurrentView() {
  if (state.view === 'today') await renderTodayView();
  if (state.view === 'plan') await renderPlan({ reload: load });
  if (state.view === 'progress') await renderProgress({ reload: load });
  if (state.view === 'insights') await renderInsights();
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
  $('#pageTitle').textContent = viewTitles[name];
  await renderCurrentView();
}

const logger = createLogger({
  onIntent: async (input) => {
    if (!todayIntentions) throw new Error('Today planning is unavailable.');
    await todayIntentions.create(input);
    await load();
  },
  onSaved: async ({ intentionId } = {}) => {
    if (intentionId && todayIntentions) {
      try {
        await todayIntentions.setStatus(Number(intentionId), 'completed');
      } catch (error) {
        console.error('Progress saved, but Today item could not be completed.', error);
      }
    }
    await load();
  }
});

$$('.nav-btn[data-view], .rail-nav-btn[data-view]').forEach((button) => {
  button.addEventListener('click', () => { void showView(button.dataset.view); });
});

$$('[data-open-logger]').forEach((button) => {
  button.addEventListener('click', () => { void logger.open(); });
});

function toggleSettings() {
  void showView(state.view === 'settings' ? lastPrimaryView : 'settings');
}

$('#settingsBtn')?.addEventListener('click', toggleSettings);
$('#settingsRailBtn')?.addEventListener('click', toggleSettings);

window.addEventListener('growth-compass:open-logger', (event) => {
  void logger.open(event.detail || {});
});

window.addEventListener('growth-compass:focus-today', async () => {
  await showView('today');
  requestAnimationFrame(focusTodayActivities);
});

void load();
