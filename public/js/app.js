import { api } from './core/api.js';
import { $, $$ } from './core/dom.js';
import { createFallback } from './core/fallback.js';
import { state } from './core/state.js';
import { renderInsights } from './features/insights.js';
import { renderPlan } from './features/plan.js';
import { renderProgress } from './features/progress.js';
import { createQuickAdd } from './features/quick-add.js';
import { renderSettings } from './features/settings.js';
import { focusTodayActivities, openEnergyEditor, renderToday } from './features/today.js';

const PRIMARY_VIEWS = new Set(['today','plan','progress','insights']);
const viewTitles = {
  today: 'Today',
  plan: 'Plan',
  progress: 'Progress',
  insights: 'Insights',
  settings: 'Settings'
};

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

function renderAlwaysAvailable() {
  renderToday({ reload: load });
  renderInsights();
  renderSettings({ reload: load });
}

async function renderCurrentView() {
  renderAlwaysAvailable();
  if (state.view === 'plan') await renderPlan({ reload: load });
  if (state.view === 'progress') await renderProgress();
}

async function showView(name) {
  if (!viewTitles[name]) return;
  state.view = name;
  if (PRIMARY_VIEWS.has(name)) lastPrimaryView = name;

  $$('.view').forEach((view) => view.classList.remove('active'));
  $(`#${name}View`)?.classList.add('active');
  $$('.nav-btn[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  $('#pageTitle').textContent = viewTitles[name];

  if (name === 'plan') await renderPlan({ reload: load });
  if (name === 'progress') await renderProgress();
  if (name === 'insights') renderInsights();
  if (name === 'settings') renderSettings({ reload: load });
}

const quickAdd = createQuickAdd({
  onSelect: async (action) => {
    if (action === 'log-progress') {
      await showView('today');
      requestAnimationFrame(focusTodayActivities);
      return;
    }
    if (action === 'energy') {
      await showView('today');
      requestAnimationFrame(openEnergyEditor);
      return;
    }
    if (action === 'plan') await showView('plan');
  }
});

$$('.nav-btn[data-view]').forEach((button) => button.addEventListener('click', () => { void showView(button.dataset.view); }));
$('#quickAddBtn')?.addEventListener('click', () => quickAdd.open());
$('#settingsBtn')?.addEventListener('click', () => {
  void showView(state.view === 'settings' ? lastPrimaryView : 'settings');
});

void load();
