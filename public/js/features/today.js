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

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}

function periodSwitcher(model) {
  if (!model?.periods?.length) return '';
  const labels = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' };
  return `<div class="gc-period-switch" role="group" aria-label="Progress period">${model.periods.map((period) => `<button type="button" data-direction-period="${escapeHtml(period)}" aria-pressed="${period === model.period ? 'true' : 'false'}">${escapeHtml(labels[period] || period)}</button>`).join('')}</div>`;
}

function metricValue(metrics, label) {
  const item = (metrics || []).find((metric) => String(metric.label || '').toLowerCase() === label.toLowerCase());
  return item?.minutes == null ? null : Math.max(0, Number(item.minutes) || 0);
}

function capacityCard(model) {
  if (!model) return `<section class="gc-capacity-compact" aria-label="Today's time"><div><span>Today’s time</span><strong>Time fit unavailable</strong></div></section>`;
  const planned = metricValue(model.metrics, 'Planned');
  const flexible = metricValue(model.metrics, 'Still flexible');
  const available = metricValue(model.metrics, 'Available');
  const overBy = metricValue(model.metrics, 'Over by');
  const used = available > 0 && planned != null ? Math.min(100, Math.round((planned / available) * 100)) : 0;
  const status = overBy ? `${formatMinutes(overBy)} over available` : flexible == null ? 'Flexible time unavailable' : `${formatMinutes(flexible)} flexible`;
  return `<section class="gc-capacity-compact" aria-label="Today's time">
    <div class="gc-capacity-copy"><span>Today’s time</span><strong>${planned == null ? '—' : `${formatMinutes(planned)} planned`}</strong><small>${escapeHtml(status)}</small></div>
    <div class="gc-capacity-track" role="img" aria-label="${used}% of available time planned"><i style="width:${used}%"></i></div>
  </section>`;
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

function directionSection(model) {
  if (!model) return '';
  const cards = model.cards || [];
  return `<section class="gc-today-secondary-section" aria-labelledby="todayDirectionTitle">
    <div class="gc-secondary-head"><div><span>Progress</span><h3 id="todayDirectionTitle">Direction</h3></div>${periodSwitcher(model)}</div>
    <div class="gc-direction-list">${cards.length ? cards.map((card) => `<article class="gc-direction-item"><div><strong>${escapeHtml(card.title || '')}</strong><small>${escapeHtml(card.status || '')}</small></div><div class="gc-direction-metrics">${(card.metrics || []).map((metric) => `<span><b>${escapeHtml(metric.label || '')}</b>${metric.minutes == null ? escapeHtml(metric.value ?? '—') : formatMinutes(metric.minutes)}</span>`).join('')}</div>${thresholdHtml(card)}</article>`).join('') : `<div class="gc-simple-empty">${escapeHtml(model.empty || 'No recorded direction yet.')}</div>`}</div>
  </section>`;
}

function recentSection(model) {
  if (!model) return '';
  const rows = model.rows || [];
  return `<section class="gc-today-secondary-section" aria-labelledby="todayRecentTitle"><div class="gc-secondary-head"><div><span>Facts</span><h3 id="todayRecentTitle">Recently done</h3></div></div><div class="gc-recent-list">${rows.length ? rows.slice(0, 5).map((row) => `<article><span class="gc-recent-mark" aria-hidden="true">✓</span><div><strong>${escapeHtml(row.title || '')}</strong><small>${escapeHtml(row.subtitle || '')}</small></div>${row.minutes == null ? '' : `<b>${formatMinutes(row.minutes)}</b>`}</article>`).join('') : '<div class="gc-simple-empty">Nothing recorded yet.</div>'}</div></section>`;
}

function visibleContext({ directionModel, wellbeingState, journalPreview }) {
  return `<div class="gc-today-visible-context" aria-label="Today context">
    ${directionSection(directionModel)}
    ${wellbeingState}
    ${journalPreview}
  </div>`;
}

export function focusTodayActivities() {
  document.querySelector('.gc-your-day-head')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const recentModel = progress?.todayRecent({ items: todayModel?.progress || [] }) || null;

  root.innerHTML = `<div class="gc-today-rebuild">
    <header class="gc-today-header"><div><h2>Today</h2><time datetime="${escapeHtml(date)}">${escapeHtml(formatDateLabel(date))}</time></div><p><strong>${escapeHtml(greeting())}</strong><span>One clear step at a time.</span></p></header>
    <div class="gc-today-primary">
      ${dailyPlanPanel}
      ${capacityCard(capacityModel)}
    </div>
    ${visibleContext({ directionModel, wellbeingState, journalPreview })}
    <details class="gc-today-more"><summary><span><strong>More detail</strong><small>Recent facts and deeper wellbeing</small></span><span aria-hidden="true">›</span></summary><div class="gc-today-more-body">
      ${recentSection(recentModel)}
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
