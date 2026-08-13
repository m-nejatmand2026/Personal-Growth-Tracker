import { $, escapeHtml } from '../core/dom.js';
import { formatDateLabel, formatMinutes } from '../core/format.js';
import { state } from '../core/state.js';
import { frontendModules } from '../modules/catalog.js';
import { createFrontendModuleRegistry } from '../platform/module-registry.js';

const todayRegistry = createFrontendModuleRegistry(frontendModules);
const capacity = todayRegistry.get('capacity');
const progress = todayRegistry.get('progress');
const wellbeing = todayRegistry.get('wellbeing');

function metricHtml(metric) {
  const value = metric.minutes == null ? escapeHtml(metric.value ?? '—') : formatMinutes(metric.minutes);
  return `<div><span>${escapeHtml(metric.label || '')}</span><strong>${value}</strong></div>`;
}

function summaryWidget(model) {
  if (!model) return '';
  return `<section class="time-reality-card" data-today-widget="${escapeHtml(model.id || '')}"><div class="time-reality-head"><div><span class="section-kicker">${escapeHtml(model.title || '')}</span><h3>${escapeHtml(model.status || '')}</h3>${model.description ? `<p>${escapeHtml(model.description)}</p>` : ''}</div></div>${model.metrics?.length ? `<div class="time-reality-stats">${model.metrics.map(metricHtml).join('')}</div>` : ''}</section>`;
}

function cardsWidget(model) {
  if (!model) return '';
  const cards = model.cards || [];
  return `<section class="os-section" data-today-widget="${escapeHtml(model.id || '')}"><div class="os-section-head"><div><span class="section-kicker">${escapeHtml(model.kicker || '')}</span><h2>${escapeHtml(model.title || '')}</h2></div>${model.detail ? `<small>${escapeHtml(model.detail)}</small>` : ''}</div><div class="today-goal-grid">${cards.length ? cards.map((card) => `<article class="today-goal-card"><div class="goal-card-top"><div><span class="goal-dot" aria-hidden="true"></span><strong>${escapeHtml(card.title || '')}</strong></div></div><div class="goal-progress-copy">${(card.metrics || []).map(metricHtml).join('')}</div>${card.status ? `<small>${escapeHtml(card.status)}</small>` : ''}</article>`).join('') : `<div class="empty">${escapeHtml(model.empty || 'Nothing to show yet.')}</div>`}</div></section>`;
}

function rowsWidget(model) {
  if (!model) return '';
  const rows = model.rows || [];
  return `<section class="os-section recent-section" data-today-widget="${escapeHtml(model.id || '')}"><div class="os-section-head"><div><span class="section-kicker">${escapeHtml(model.kicker || '')}</span><h2>${escapeHtml(model.title || '')}</h2></div></div><div class="activity-feed">${rows.length ? rows.map((row) => `<div class="activity-feed-row"><span class="activity-symbol" aria-hidden="true">✓</span><div><strong>${escapeHtml(row.title || '')}</strong><small>${escapeHtml(row.subtitle || '')}</small></div>${row.minutes == null ? '' : `<span class="activity-duration">${formatMinutes(row.minutes)}</span>`}</div>`).join('') : `<div class="empty activity-empty">${escapeHtml(model.empty || 'Nothing to show yet.')}</div>`}</div></section>`;
}

function renderModel(model) {
  if (!model) return '';
  if (model.kind === 'cards') return cardsWidget(model);
  if (model.kind === 'rows') return rowsWidget(model);
  return summaryWidget(model);
}

export function focusTodayActivities() {
  document.querySelector('[data-today-widget="progress.direction"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export async function renderToday({ reload, openLogger, dailyPlanPanel = '', journalPreview = '' } = {}) {
  const root = $('#todayView');
  if (!root) return;
  const date = state.date;
  let capacityModel = null;
  let wellbeingModel = null;
  let wellbeingState = '';
  let wellbeingDetails = '';

  if (capacity) { try { capacityModel = await capacity.loadToday({ date }); } catch { capacityModel = null; } }
  if (wellbeing) {
    try {
      wellbeingModel = await wellbeing.getDay(date);
      state.selectedEnergy = wellbeingModel.energy || null;
      wellbeingState = wellbeing.renderTodayState({ model: wellbeingModel });
      wellbeingDetails = wellbeing.renderTodayDetails({ model: wellbeingModel, date });
    } catch { wellbeingModel = null; }
  }

  const directionModel = progress?.todayDirection({ items: state.data.week || [] }) || null;
  const recentModel = progress?.todayRecent({ items: state.data.sessions || [] }) || null;
  root.innerHTML = `<section class="today-command"><div><p class="eyebrow">${formatDateLabel(date)}</p><h2>Your daily command center</h2><p>See your state, your time and what you intend to do. Record what actually happens.</p></div><button type="button" class="command-log-btn" id="todayLogButton"><span>＋</span> Log or plan</button></section>${wellbeingState}${renderModel(capacityModel)}${dailyPlanPanel}${renderModel(directionModel)}${renderModel(recentModel)}${journalPreview}${wellbeingDetails}`;
  $('#todayLogButton')?.addEventListener('click', () => void openLogger?.());
  if (wellbeing && wellbeingModel) wellbeing.bindToday({ model: wellbeingModel, date, reload });
}
