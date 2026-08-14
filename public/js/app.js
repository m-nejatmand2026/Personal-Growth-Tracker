import { $, $$ } from './core/dom.js';
import { state } from './core/state.js';
import { renderPlan } from './features/plan.js';
import { renderSettings } from './features/settings.js';
import { renderToday } from './features/today.js';
import { frontendModules } from './modules/catalog.js';
import { createFrontendModuleRegistry } from './platform/module-registry.js';
import { createEventBus } from './platform/event-bus.js';

const PRIMARY_VIEWS = new Set(['today', 'plan', 'progress', 'insights', 'wellness-boost']);
const viewTitles = { today: 'Today', plan: 'Plan', progress: 'Progress', insights: 'Insights', 'wellness-boost': 'Wellness Boost', journal: 'Journal', settings: 'Settings' };

const moduleRegistry = createFrontendModuleRegistry(frontendModules);
const eventBus = createEventBus();
const activities = moduleRegistry.get('activities');
const dailyPlan = moduleRegistry.get('daily-plan');
const insights = moduleRegistry.get('insights');
const journal = moduleRegistry.get('journal');
const loggerCapability = moduleRegistry.get('logger');
const progress = moduleRegistry.get('progress');
const today = moduleRegistry.get('today');
const wellnessBoost = moduleRegistry.get('wellness-boost');
let lastPrimaryView = 'today';
let journalFilters = { query: '', filterDate: '' };

async function load() {
  await renderCurrentView();
}

const logger = loggerCapability?.create({ onSaved: load, activities }) || Object.freeze({ open() {}, close() {} });

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
    } catch { journalPreview = ''; }
  }

  await renderToday({ reload: load, openLogger: logger.open, dailyPlanPanel, journalPreview });
  if (dailyPlan && dailyPlanModel) dailyPlan.bind({ model: dailyPlanModel, events: eventBus, reload: load });
  if (journal && journalPreviewModel) journal.bindPreview({ model: journalPreviewModel, events: eventBus, reload: load });
}

async function renderJournalView(overrides = null) {
  const root = $('#journalView');
  if (!root) return;
  if (!journal) { root.innerHTML = '<div class="empty">Journal is unavailable.</div>'; return; }
  if (overrides) journalFilters = { ...journalFilters, ...overrides };

  try {
    const model = await journal.loadView({ date: state.date, query: journalFilters.query, filterDate: journalFilters.filterDate });
    root.innerHTML = journal.renderView({ model });
    journal.bindView({ model, rerender: async (next) => { if (next) journalFilters = { ...journalFilters, ...next }; await renderJournalView(); } });
  } catch (error) {
    root.innerHTML = `<section class="os-section"><div class="empty">${error?.message || 'Could not load journal.'}</div></section>`;
  }
}

function renderWellnessBoostView() {
  const root = $('#wellness-boostView');
  if (!root) return;
  root.innerHTML = wellnessBoost?.renderView?.() || '<section class="os-section"><div class="empty">Wellness Boost is unavailable.</div></section>';
  wellnessBoost?.bindView?.({ root, rerender: renderWellnessBoostView });
}

async function renderCurrentView() {
  if (state.view === 'today') await renderTodayView();
  if (state.view === 'plan') await renderPlan({ reload: load });
  if (state.view === 'progress') {
    if (progress) {
      const summary = today
        ? await today.loadSummary({ date: state.date })
        : null;
      await progress.render({
        reload: load,
        weeklyDirection: summary?.weeklyDirection || []
      });
    }
    else { const root = $('#progressView'); if (root) root.innerHTML = '<div class="empty">Progress is unavailable.</div>'; }
  }
  if (state.view === 'insights') {
    if (insights) await insights.render();
    else { const root = $('#insightsView'); if (root) root.innerHTML = '<div class="empty">Insights are unavailable.</div>'; }
  }
  if (state.view === 'wellness-boost') renderWellnessBoostView();
  if (state.view === 'journal') await renderJournalView();
  if (state.view === 'settings') renderSettings({ reload: load });
}

async function showView(name) {
  if (!viewTitles[name]) return;
  if (state.view === 'wellness-boost' && name !== 'wellness-boost') wellnessBoost?.deactivate?.();
  state.view = name;
  if (PRIMARY_VIEWS.has(name)) lastPrimaryView = name;
  $$('.view').forEach((view) => view.classList.remove('active'));
  $(`#${name}View`)?.classList.add('active');
  $$('.nav-btn[data-view], .rail-nav-btn[data-view]').forEach((button) => {
    const isCurrent = button.dataset.view === name;
    button.classList.toggle('active', isCurrent);
    if (isCurrent) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  $('#journalBtn')?.classList.toggle('active', name === 'journal');
  $('#journalRailBtn')?.classList.toggle('active', name === 'journal');
  const insightsButton = $('#insightsBtn');
  insightsButton?.classList.toggle('active', name === 'insights');
  if (name === 'insights') insightsButton?.setAttribute('aria-current', 'page');
  else insightsButton?.removeAttribute('aria-current');
  $('#pageTitle').textContent = viewTitles[name];
  await renderCurrentView();
}

eventBus.subscribe('daily-plan.completion-selected', async (input) => { await logger.open(input); });
eventBus.subscribe('journal.preview-selected', async () => { await showView('journal'); });

$$('.nav-btn[data-view], .rail-nav-btn[data-view]').forEach((button) => button.addEventListener('click', () => void showView(button.dataset.view)));
$$('[data-open-logger]').forEach((button) => button.addEventListener('click', () => void logger.open()));
function toggleSettings() { void showView(state.view === 'settings' ? lastPrimaryView : 'settings'); }
$('#settingsBtn')?.addEventListener('click', toggleSettings);
$('#settingsRailBtn')?.addEventListener('click', toggleSettings);
$('#journalBtn')?.addEventListener('click', () => void showView('journal'));
$('#journalRailBtn')?.addEventListener('click', () => void showView('journal'));
$('#insightsBtn')?.addEventListener('click', () => void showView('insights'));

void load();
