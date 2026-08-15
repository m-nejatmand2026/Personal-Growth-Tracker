import { $, escapeHtml } from '../core/dom.js';
import { formatMinutes } from '../core/format.js';
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

const PERIOD_LABELS = Object.freeze({ day: 'Today', week: 'This week', month: 'This month', year: 'This year' });

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
    <div class="os-section-head today-direction-head"><div><span class="section-kicker">${escapeHtml(model.kicker || '')}</span><h2>${escapeHtml(model.title || '')}</h2>${model.detail ? `<small class="gc-sr-only">${escapeHtml(model.detail)}</small>` : ''}</div></div>
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

function directionActualMinutes(model) {
  return (model?.cards || []).reduce((sum, card) => {
    const direct = Number(card?.threshold?.actual);
    if (Number.isFinite(direct)) return sum + Math.max(0, direct);
    const metric = (card?.metrics || []).find((item) => String(item.label).toLowerCase() === 'actual');
    return sum + Math.max(0, Number(metric?.minutes) || 0);
  }, 0);
}

function capacityWeek(model) {
  if (!capacity || !model || typeof capacity.planSummary !== 'function') return null;
  const items = capacity.planSummary({ model }) || [];
  const planned = items.find((item) => item.id === 'capacity.planned-week');
  const flexible = items.find((item) => item.id === 'capacity.time-fit-week');
  return { planned: planned?.value || '—', detail: flexible ? `${flexible.value} ${String(flexible.label || '').toLowerCase()}` : 'Time fit unavailable' };
}

function currentOverview(directionModel, capacityModel) {
  const actual = directionActualMinutes(directionModel);
  const hasGuidance = (directionModel?.cards || []).some((card) => Boolean(card.threshold));
  const capacitySummary = capacityWeek(capacityModel);
  return `<section class="today-current-overview" aria-labelledby="todayPeriodHeading">
    ${periodSwitcher(directionModel)}
    <h3 id="todayPeriodHeading">${escapeHtml(PERIOD_LABELS[directionModel?.period] || 'This week')}</h3>
    <div class="today-current-metrics">
      <article class="today-current-metric"><span>Actual progress</span><strong>${escapeHtml(formatMinutes(actual))}</strong><small>${hasGuidance ? 'Recorded factual progress' : 'No target set for this period'}</small></article>
      <article class="today-current-metric"><span>Capacity</span><strong>${escapeHtml(capacitySummary?.planned ? `${capacitySummary.planned} planned` : '—')}</strong><small>${escapeHtml(capacitySummary?.detail || 'Time fit unavailable')}</small></article>
    </div>
  </section>`;
}

export function focusTodayActivities() {
  document.querySelector('.today-primary-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export async function renderToday({ reload, dailyPlanPanel = '', journalPreview = '' } = {}) {
  const root = $('#todayView');
  if (!root) return;
  const date = state.date;
  let capacityModel = null;
  let todayModel = null;
  let wellbeingModel = null;
  let wellbeingState = '';
  let wellbeingDetails = '';

  const [capacityResult, todayResult, wellbeingResult] = await Promise.allSettled([
    capacity ? capacity.load({ date }) : null,
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
  const recentModel = progress?.todayRecent({ items: todayModel?.progress || [] }) || null;

  root.innerHTML = `<div class="today-layout gc-page-flow">
    <section class="today-sanctuary-heading living-page-heading" aria-labelledby="todaySanctuaryTitle"><h2 id="todaySanctuaryTitle">Today</h2><strong class="today-greeting">Good morning.</strong><p>Keep the next useful step visible. Change the period to change the view—not the facts.</p></section>
    <div class="today-primary-column">
      ${currentOverview(directionModel, capacityModel)}
      <div class="today-primary-flow">${dailyPlanPanel}</div>
    </div>
    <aside class="today-context-column" aria-label="Today context">
      <section class="today-reflection-card"><span>REFLECTION</span><h3>What is one small friction point you can remove today?</h3><p>Capture it in Journal when useful.</p></section>
      ${wellbeingState}
    </aside>
    <details class="today-context-disclosure"><summary><span><strong>More today context</strong><small>Progress, reflection and wellbeing details</small></span></summary><div class="today-context-body">
      ${renderModel(directionModel)}${renderModel(recentModel)}${journalPreview}${wellbeingDetails}
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
