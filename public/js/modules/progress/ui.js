import { api } from '../../core/api.js';
import { $, $$, escapeHtml } from '../../core/dom.js';
import { formatMinutes } from '../../core/format.js';
import { state } from '../../core/state.js';
import { toast } from '../../core/toast.js';
import { renderThresholdTrack } from '../../platform/charts.js';

function addDays(dateText, amount) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function weeklySummary(items = []) {
  const targetTotal = items.reduce((sum, item) => sum + Math.max(0, Number(item.target_minutes) || 0), 0);
  const actualTotal = items.reduce((sum, item) => sum + Math.max(0, Number(item.actual_minutes) || 0), 0);
  const measurableItems = items.filter((item) => Number(item.minimum_minutes || 0) > 0 || Number(item.target_minutes || 0) > 0);
  const minimumReached = measurableItems.filter((item) => Number(item.minimum_minutes || 0) > 0 && Number(item.actual_minutes || 0) >= Number(item.minimum_minutes || 0)).length;
  const itemsWithMinimum = measurableItems.filter((item) => Number(item.minimum_minutes || 0) > 0).length;
  return { items, targetTotal, actualTotal, minimumReached, minimumCount: itemsWithMinimum };
}

function goalRows(items) {
  if (!items.length) return '<div class="empty">No progress recorded for this week yet.</div>';
  return items.map((item) => {
    const actual = Math.max(0, Number(item.actual_minutes) || 0);
    const minimum = Math.max(0, Number(item.minimum_minutes) || 0);
    const target = Math.max(0, Number(item.target_minutes) || 0);
    const name = item.name || item.key;
    const status = target > 0 && actual >= target ? 'Target reached' : minimum > 0 && actual >= minimum ? 'Good-enough minimum reached' : actual > 0 ? 'Progress recorded' : 'No factual progress yet';
    const track = minimum || target ? renderThresholdTrack({ label: name, actual, minimum, target, actualText: formatMinutes(actual), minimumText: minimum ? formatMinutes(minimum) : 'Not set', targetText: target ? formatMinutes(target) : 'Not set' }) : '';
    return `<article class="gc-progress-goal-row"><div class="gc-progress-goal-head"><div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(status)}</small></div><b>${formatMinutes(actual)}</b></div><div class="gc-progress-guidance"><span>Minimum <strong>${minimum ? formatMinutes(minimum) : '—'}</strong></span><span>Target <strong>${target ? formatMinutes(target) : '—'}</strong></span></div>${track}</article>`;
  }).join('');
}

function factValue(item) {
  if (item.minutes != null) return formatMinutes(item.minutes);
  if (item.quantity != null) return String(item.quantity);
  if (item.boolean_value != null) return item.boolean_value ? 'Yes' : 'No';
  return 'Recorded';
}

function factType(item) {
  if (item.minutes != null) return 'Time';
  if (item.quantity != null) return 'Quantity';
  if (item.boolean_value != null) return 'Yes / No';
  return 'Progress';
}

function recentRows(items) {
  if (!items.length) return '<div class="gc-progress-empty"><span class="gc-progress-empty-mark" aria-hidden="true">✓</span><div><strong>No completed activity yet</strong><p>Use Add → Done when something actually happens. Your first factual record will appear here.</p></div></div>';
  return items.slice(0, 20).map((item) => {
    const canonical = item.record_kind === 'progress';
    const name = item.activity_name || item.activity_key || 'Activity';
    return `<article class="gc-progress-fact"><span class="gc-progress-fact-mark" aria-hidden="true">${escapeHtml(name.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(item.occurred_on)} · ${escapeHtml(item.subtype || factType(item))}</small></div><b>${escapeHtml(factValue(item))}</b>${canonical ? `<button type="button" data-delete-progress="${item.id}" aria-label="Delete ${escapeHtml(name)} progress record">•••</button>` : '<small class="history-legacy">Earlier Beta</small>'}</article>`;
  }).join('');
}

function activeDayCount(items) {
  return new Set(items.map((item) => item.occurred_on).filter(Boolean)).size;
}

export async function renderProgress({ reload, weeklyDirection = [] } = {}) {
  const root = $('#progressView');
  if (!root) return;
  const week = weeklySummary(weeklyDirection);
  const from = addDays(state.date, -29);
  let history = [];
  try {
    const response = await api(`/api/v1/progress?from=${from}&to=${state.date}&limit=100`);
    history = response.items || [];
  } catch {
    history = [];
  }

  const weekFrom = addDays(state.date, -6);
  const weekHistory = history.filter((item) => item.occurred_on >= weekFrom && item.occurred_on <= state.date);
  const records = weekHistory.length;
  const activeDays = activeDayCount(weekHistory);
  const minimumValue = week.minimumCount ? `${week.minimumReached} / ${week.minimumCount}` : '—';

  root.innerHTML = `<section class="gc-progress-rebuild" aria-labelledby="progressCurrentTitle">
    <header class="gc-product-page-header"><div><h2 id="progressCurrentTitle">Progress</h2><p>What actually happened. Plans never appear here until you explicitly record them as done.</p></div></header>
    <section class="gc-progress-history" aria-labelledby="progressHistoryTitle"><div class="gc-section-title"><div><span>Facts</span><h3 id="progressHistoryTitle">Recent activity</h3></div><small>Last 30 days</small></div><div class="gc-progress-fact-list">${recentRows(history)}</div></section>
    <section class="gc-progress-week" aria-labelledby="progressWeekTitle"><div class="gc-section-title"><div><span>Summary</span><h3 id="progressWeekTitle">This week</h3></div></div><div class="gc-progress-stats"><article><span>Actual time</span><strong>${escapeHtml(formatMinutes(week.actualTotal))}</strong><small>Recorded facts</small></article><article><span>Records</span><strong>${records}</strong><small>${activeDays} active ${activeDays === 1 ? 'day' : 'days'}</small></article><article><span>Minimums</span><strong>${escapeHtml(minimumValue)}</strong><small>${week.minimumCount ? 'Good-enough minimums met' : 'No minimums set'}</small></article></div></section>
    <details class="gc-progress-by-goal"><summary><span><strong>By goal</strong><small>Actual vs optional guidance</small></span><b aria-hidden="true">›</b></summary><div class="gc-progress-goal-list">${goalRows(week.items)}</div><p class="gc-progress-boundary">Evidence only here. Interpretation belongs in Insights.</p></details>
  </section>`;

  $$('[data-delete-progress]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.deleteProgress || 0);
      if (!id || !window.confirm('Delete this progress record?')) return;
      try {
        await api(`/api/v1/progress/${id}`, { method: 'DELETE' });
        toast('Progress record deleted');
        await reload?.();
      } catch (error) {
        toast(error.message || 'Could not delete progress record');
      }
    });
  });
}