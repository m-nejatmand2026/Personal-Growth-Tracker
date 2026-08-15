import { $, escapeHtml } from '../core/dom.js';
import { formatDateLabel, formatMinutes } from '../core/format.js';
import { state } from '../core/state.js';
import { frontendModules } from '../modules/catalog.js';
import { createFrontendModuleRegistry } from '../platform/module-registry.js';
import { renderThresholdTrack } from '../platform/charts.js';

const todayRegistry = createFrontendModuleRegistry(frontendModules);
const capacity = todayRegistry.get('capacity');
const progress = todayRegistry.get('progress');
const today = todayRegistry.get('today');
const wellbeing = todayRegistry.get('wellbeing');
let directionPeriod = 'week';

function metricHtml(metric) {
  const value = metric.minutes == null ? escapeHtml(metric.value ?? '—') : formatMinutes(metric.minutes);
  return `<div class="today-metric"><span>${escapeHtml(metric.label || '')}</span><strong>${value}</strong></div>`;
}

function thresholdHtml(card) {
  if (!card?.threshold) return '';
  const actual = Math.max(0, Number(card.threshold.actual) || 0);
  const minimum = Math.max(0, Number(card.threshold.minimum) || 0);
  const target = Math.max(0, Number(card.threshold.target) || 0);
  if (!minimum && !target) return '';
  return renderThresholdTrack({
    label: card.title || 'Progress direction',
    actual,
    minimum,
    target,
    actualText: formatMinutes(actual),
    minimumText: minimum ? formatMinutes(minimum) : 'Not set',
    targetText: target ? formatMinutes(target) : 'Not set'
  });
}

function periodSwitcher(model) {
  if (!model?.periods?.length) return '';
  const labels = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' };
  return `<div class="today-period-switch" role="group" aria-label="Progress direction period">${model.periods.map((period) => `<button type="button" data-direction-period="${escapeHtml(period)}" aria-pressed="${period === model.period ? 'true' : 'false'}">${escapeHtml(labels[period] || period)}</button>`).join('')}</div>`;
}

function summaryWidget(model) {
  if (!model) return '';
  return `<section class="time-reality-card" data-today-widget="${escapeHtml(model.id || '')}">
    <header class="time-reality-head"><div><span class="section-kicker">${escapeHtml(model.title || '')}</span><h2>${escapeHtml(model.status || '')}</h2>${model.description ? `<p class="gc-sr-only">${escapeHtml(model.description)}</p>` : ''}</div></header>
    ${model.metrics?.length ? `<div class="time-reality-stats">${model.metrics.map(metricHtml).join('')}</div>` : ''}
  </section>`;
}

function cardsWidget(model) {
  if (!model) return '';
  const cards = model.cards || [];
  return `<section class="os-section today-direction-section" data-today-widget="${escapeHtml(model.id || '')}">
    <div class="os-section-head today-direction-head"><div><span class="section-kicker">${escapeHtml(model.kicker || '')}</span><h2>${escapeHtml(model.title || '')}</h2>${model.detail ? `<small class="gc-sr-only">${escapeHtml(model.detail)}</small>` : ''}</div>${periodSwitcher(model)}</div>
    <div class="today-goal-grid">${cards.length ? cards.map((card) => `<article class="today-goal-card"><div class="goal-card-top"><div><span class="goal-dot" aria-hidden="true"></span><strong>${escapeHtml(card.title || '')}</strong></div><span class="today-goal-status">${escapeHtml(card.status || '')}</span></div><div class="goal-progress-copy">${(card.metrics || []).map(metricHtml).join('')}</div>${thresholdHtml(card)}</article>`).join('') : `<div class="empty">${escapeHtml(model.empty || 'Nothing to show yet.')}</div>`}</div>
  </section>`;
}

function rowsWidget(model) {
  if (!model) return '';
  const rows = model.rows || [];
  return `<section class="os-section recent-section" data-today-widget="${escapeHtml(model.id || '')}">
    <div class="os-section-head"><div><span class="section-kicker">${escapeHtml(model.kicker || '')}</span><h2>${escapeHtml(model.title || '')}</h2></div></div>
    <div class="activity-feed">${rows.length ? rows.map((row) => `<article class="activity-feed-row"><span class="activity-symbol" aria-hidden="true">✓</span><div><strong>${escapeHtml(row.title || '')}</strong><small>${escapeHtml(row.subtitle || '')}</small></div>${row.minutes == null ? '' : `<span class="activity-duration">${formatMinutes(row.minutes)}</span>`}</article>`).join('') : `<div class="empty activity-empty">${escapeHtml(model.empty || 'Nothing to show yet.')}</div>`}</div>
  </section>`;
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
  let todayModel = null;
  let wellbeingModel = null;
  let wellbeingState = '';
  let wellbeingDetails = '';

  const [capacityResult, todayResult, wellbeingResult] = await Promise.allSettled([
    capacity ? capacity.loadToday({ date }) : null,
    today ? today.loadSummary({ date, period: directionPeriod }) : null,
    wellbeing ? wellbeing.getDay(date) : null
  ]);
  if (capacityResult.status === 'fulfilled') capacityModel = capacityResult.value;
  if (todayResult.status === 'fulfilled') todayModel = todayResult.value;
  if (wellbeingResult.status === 'fulfilled') wellbeingModel = wellbeingResult.value;
  if (wellbeing && wellbeingModel) {
    state.selectedEnergy = wellbeingModel.energy || null;
    wellbeingState = wellbeing.renderTodayState({ model: wellbeingModel });
    wellbeingDetails = wellbeing.renderTodayDetails({ model: wellbeingModel, date });
  }

  const directionModel = progress?.todayDirection({
    items: todayModel?.direction || todayModel?.weeklyDirection || [],
    period: todayModel?.directionPeriod || directionPeriod
  }) || null;
  const recentModel = progress?.todayRecent({
    items: todayModel?.progress || []
  }) || null;
  const energyLabel = wellbeingModel?.energy?.label || '';
  const energyMessage = energyLabel
    ? `Your energy feels ${energyLabel.toLowerCase()} today. Let’s build momentum.`
    : 'Set your rhythm gently. Let’s build momentum.';

  root.innerHTML = `<div class="today-layout gc-page-flow">
    <!-- <h2 id="todaySanctuaryTitle">Today</h2><p>${formatDateLabel(date)}</p> -->
    <section class="today-sanctuary-heading living-page-heading" aria-labelledby="todaySanctuaryTitle"><span>${formatDateLabel(date)}</span><h2 id="todaySanctuaryTitle">Good morning.</h2><p>${escapeHtml(energyMessage)}</p></section>
    <div class="today-primary-flow">
      ${dailyPlanPanel}
    </div>
    <details class="today-context-disclosure" hidden><summary><span><strong>Daily context</strong><small>Wellbeing, capacity, progress and reflection</small></span><span class="today-context-chevron" aria-hidden="true">⌄</span></summary><div class="today-context-body">
      ${wellbeingState}
      ${renderModel(capacityModel)}
      ${renderModel(directionModel)}
      ${renderModel(recentModel)}
      ${journalPreview}
      ${wellbeingDetails}
    </div></details>
  </div>`;

  root.querySelectorAll('[data-direction-period]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.directionPeriod;
      if (!['day', 'week', 'month', 'year'].includes(next) || next === directionPeriod) return;
      directionPeriod = next;
      void reload?.();
    });
  });
  if (wellbeing && wellbeingModel) wellbeing.bindToday({ model: wellbeingModel, date, reload });
}
