import { $, $$, escapeHtml } from './core/dom.js';
import { state } from './core/state.js';
import { renderPlan } from './features/plan.js';
import { renderSettings } from './features/settings.js';
import { renderToday } from './features/today.js';
import { frontendModules } from './modules/catalog.js';
import { createActiveSessionController } from './modules/daily-plan/active-session.js';
import { createFrontendModuleRegistry } from './platform/module-registry.js';
import { createEventBus } from './platform/event-bus.js';

const PRIMARY_VIEWS = new Set(['today', 'plan', 'progress', 'insights', 'wellness-boost']);
const viewTitles = {
  today: 'Today',
  plan: 'Plan',
  progress: 'Progress',
  insights: 'Insights',
  'wellness-boost': 'Wellness',
  journal: 'Journal',
  settings: 'Settings'
};

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
let viewTransitionToken = 0;

function reducedMotionPreferred() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

function fallbackEnter(root) {
  if (!root || reducedMotionPreferred()) return;
  root.classList.remove('gc-motion-enter');
  void root.offsetWidth;
  root.classList.add('gc-motion-enter');
  window.setTimeout(() => root.classList.remove('gc-motion-enter'), 380);
}

function commitWithMotion(update, fallbackRoot = null) {
  if (reducedMotionPreferred() || typeof document.startViewTransition !== 'function') {
    update();
    fallbackEnter(fallbackRoot);
    return null;
  }

  try {
    return document.startViewTransition(() => update());
  } catch {
    update();
    fallbackEnter(fallbackRoot);
    return null;
  }
}

async function load() {
  await renderCurrentView(state.view);
  await activeSession.refresh();
}

const logger = loggerCapability?.create({ onSaved: load, activities }) || Object.freeze({
  open() {},
  close() {}
});

const activeSession = createActiveSessionController({
  dailyPlan,
  openLogger: logger.open,
  onChanged: load
});

function dailyPlanUnavailable(error) {
  return `<section class="os-section daily-plan-section"><div class="daily-plan-empty"><strong>Your day is temporarily unavailable.</strong><span>${escapeHtml(error?.message || 'Other parts of Today still work.')}</span></div></section>`;
}

async function renderTodayView() {
  let dailyPlanModel = null;
  let dailyPlanPanel = '';
  let journalPreviewModel = null;
  let journalPreview = '';

  const [dailyPlanResult, journalPreviewResult] = await Promise.allSettled([
    dailyPlan ? dailyPlan.load({ date: state.date }) : null,
    journal ? journal.loadPreview({ date: state.date }) : null
  ]);

  if (dailyPlan) {
    if (dailyPlanResult.status === 'fulfilled') {
      dailyPlanModel = dailyPlanResult.value;
      if (dailyPlanModel) {
        try {
          dailyPlanPanel = dailyPlan.render({
            model: dailyPlanModel,
            date: state.date,
            variant: 'today-product'
          });
        } catch (error) {
          dailyPlanPanel = dailyPlanUnavailable(error);
        }
      }
    } else {
      dailyPlanPanel = dailyPlanUnavailable(dailyPlanResult.reason);
    }
  }

  if (journal && journalPreviewResult.status === 'fulfilled') {
    journalPreviewModel = journalPreviewResult.value;
    if (journalPreviewModel) journalPreview = journal.renderPreview({ model: journalPreviewModel });
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

  if (overrides) journalFilters = { ...journalFilters, ...overrides };
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
    root.innerHTML = `<section class="os-section"><div class="empty">${escapeHtml(error?.message || 'Could not load journal.')}</div></section>`;
  }
}

function renderWellnessBoostView({ animate = false } = {}) {
  const root = $('#wellness-boostView');
  if (!root) return;

  const commit = () => {
    root.innerHTML = wellnessBoost?.renderView?.() || '<section class="os-section"><div class="empty">Wellness is unavailable.</div></section>';
    wellnessBoost?.bindView?.({
      root,
      rerender: () => renderWellnessBoostView({ animate: true })
    });
  };

  if (animate) commitWithMotion(commit, root);
  else commit();
}

async function renderCurrentView(viewName = state.view) {
  const root = $(`#${viewName}View`);
  root?.setAttribute('aria-busy', 'true');
  try {
    if (viewName === 'today') await renderTodayView();
    if (viewName === 'plan') await renderPlan({ reload: load, openLogger: logger.open });
    if (viewName === 'progress') {
      if (progress) {
        const summary = today ? await today.loadSummary({ date: state.date }) : null;
        await progress.render({ reload: load, weeklyDirection: summary?.weeklyDirection || [] });
      } else if (root) {
        root.innerHTML = '<div class="empty">Progress is unavailable.</div>';
      }
    }
    if (viewName === 'insights') {
      if (insights) await insights.render();
      else if (root) root.innerHTML = '<div class="empty">Insights are unavailable.</div>';
    }
    if (viewName === 'wellness-boost') renderWellnessBoostView();
    if (viewName === 'journal') await renderJournalView();
    if (viewName === 'settings') renderSettings({ reload: load });
  } finally {
    root?.removeAttribute('aria-busy');
  }
}

function closeTopMore() {
  $('#topMore')?.removeAttribute('open');
}

function updateNavigation(name) {
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
}

function revealView(name) {
  $$('.view').forEach((view) => {
    const isCurrent = view.id === `${name}View`;
    view.classList.toggle('active', isCurrent);
    view.hidden = !isCurrent;
  });
  updateNavigation(name);
  $('#pageTitle').textContent = viewTitles[name];
  document.title = `${viewTitles[name]} — Growth Compass`;
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function showView(name) {
  if (!viewTitles[name]) return;

  const previous = state.view;
  const token = ++viewTransitionToken;
  closeTopMore();

  if (state.view === 'wellness-boost' && name !== 'wellness-boost') {
    wellnessBoost?.deactivate?.();
  }

  state.view = name;
  if (PRIMARY_VIEWS.has(name)) lastPrimaryView = name;

  // Keep the currently rendered page visible while the destination loads.
  // The destination is revealed only after its async render finishes.
  const destination = $(`#${name}View`);
  const alreadyVisible = Boolean(destination && !destination.hidden && destination.classList.contains('active'));
  if (!alreadyVisible && destination) {
    destination.hidden = true;
    destination.classList.remove('active');
  }

  try {
    await renderCurrentView(name);
  } catch (error) {
    console.error(`Failed to render ${name}`, error);
    if (token === viewTransitionToken && state.view === name) {
      state.view = previous;
      revealView(previous);
    }
    return;
  }

  if (token !== viewTransitionToken || state.view !== name) return;
  commitWithMotion(() => {
    if (token === viewTransitionToken && state.view === name) revealView(name);
  }, destination);
}

eventBus.subscribe('daily-plan.completion-selected', async (input) => {
  await logger.open(input);
});
eventBus.subscribe('daily-plan.capture-selected', async (input) => {
  await logger.open(input);
});
eventBus.subscribe('journal.preview-selected', async () => {
  await showView('journal');
});

$$('.nav-btn[data-view], .rail-nav-btn[data-view]').forEach((button) => {
  button.addEventListener('click', () => void showView(button.dataset.view));
});
$$('[data-open-logger]').forEach((button) => {
  button.addEventListener('click', () => void logger.open({ entryMode: 'done', date: state.date }));
});

function toggleSettings() {
  void showView(state.view === 'settings' ? lastPrimaryView : 'settings');
}

$('#settingsBtn')?.addEventListener('click', toggleSettings);
$('#settingsRailBtn')?.addEventListener('click', toggleSettings);
$('#journalBtn')?.addEventListener('click', () => void showView('journal'));
$('#journalRailBtn')?.addEventListener('click', () => void showView('journal'));
$('#insightsBtn')?.addEventListener('click', () => void showView('insights'));

document.addEventListener('click', (event) => {
  const more = $('#topMore');
  if (more?.open && !more.contains(event.target)) more.removeAttribute('open');
});

void load();