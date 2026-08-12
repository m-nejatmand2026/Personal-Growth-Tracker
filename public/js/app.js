import { api } from './core/api.js';
import { $, $$ } from './core/dom.js';
import { createFallback } from './core/fallback.js';
import { state } from './core/state.js';
import { renderHistory } from './features/history.js';
import { renderPlan } from './features/plan.js';
import { renderSettings } from './features/settings.js';
import { renderToday } from './features/today.js';
import { renderWeek } from './features/week.js';

const viewTitles = {
  today: 'Today',
  week: 'Week',
  plan: 'Plan',
  history: 'History',
  settings: 'Settings'
};

async function load() {
  try {
    state.data = await api(`/api/bootstrap?date=${state.date}`);
  } catch {
    state.data = createFallback(state.date);
  }
  state.selectedEnergy = state.data.energy;
  await renderAll();
}

async function renderAll() {
  renderToday({ reload: load });
  renderWeek();
  if (state.view === 'plan') await renderPlan({ reload: load });
  if (state.view === 'history') await renderHistory();
  renderSettings({ reload: load });
}

async function showView(name) {
  state.view = name;
  $$('.view').forEach((view) => view.classList.remove('active'));
  $(`#${name}View`).classList.add('active');
  $$('.nav-btn').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  $('#pageTitle').textContent = viewTitles[name];
  if (name === 'plan') await renderPlan({ reload: load });
  if (name === 'history') await renderHistory();
}

$$('.nav-btn').forEach((button) => button.addEventListener('click', () => { void showView(button.dataset.view); }));
$('#refreshBtn')?.addEventListener('click', () => { void load(); });

void load();
