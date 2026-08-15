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
  const cappedActual = items.reduce((sum, item) => sum + Math.min(Math.max(0, Number(item.actual_minutes) || 0), Math.max(0, Number(item.target_minutes) || 0)), 0);
  const targetProgress = targetTotal ? Math.round((cappedActual / targetTotal) * 100) : 0;
  const measurableItems = items.filter((item) => Number(item.minimum_minutes || 0) > 0 || Number(item.target_minutes || 0) > 0);
  const minimumReached = measurableItems.filter((item) => Number(item.minimum_minutes || 0) > 0 && Number(item.actual_minutes || 0) >= Number(item.minimum_minutes || 0)).length;
  const itemsWithMinimum = measurableItems.filter((item) => Number(item.minimum_minutes || 0) > 0).length;
  const allMinimums = itemsWithMinimum > 0 && minimumReached === itemsWithMinimum;
  const status = allMinimums && targetProgress >= 90
    ? 'Your set guidance is covered'
    : allMinimums
      ? 'Your good-enough minimums are met'
      : itemsWithMinimum
        ? 'Some minimums are still ahead — no catch-up needed'
        : targetTotal
          ? 'Progress recorded toward your targets'
          : 'Progress recorded — targets are optional';
  return { items, targetTotal, actualTotal, targetProgress, minimumReached, minimumCount: itemsWithMinimum, status };
}

function goalRows(items) {
  if (!items.length) return '<div class="empty">No progress recorded for this week yet.</div>';
  return items.map((item) => {
    const actual = Math.max(0, Number(item.actual_minutes) || 0);
    const minimum = Math.max(0, Number(item.minimum_minutes) || 0);
    const target = Math.max(0, Number(item.target_minutes) || 0);
    const name = item.name || item.key;
    if (!target && !minimum) {
      return `<article class="amt-row"><div class="amt-name"><strong>${escapeHtml(name)}</strong><span class="amt-status good">Progress recorded</span></div><div class="amt-values"><div><span>Actual</span><strong>${formatMinutes(actual)}</strong></div><div><span>Minimum</span><strong>Not set</strong></div><div><span>Target</span><strong>Not set</strong></div></div></article>`;
    }
    const status = actual >= target && target > 0 ? 'Target reached' : minimum > 0 && actual >= minimum ? 'Good-enough minimum reached' : 'In progress';
    const track = renderThresholdTrack({ label: name, actual, minimum, target, actualText: formatMinutes(actual), minimumText: minimum ? formatMinutes(minimum) : 'Not set', targetText: target ? formatMinutes(target) : 'Not set' });
    return `<article class="amt-row"><div class="amt-name"><strong>${escapeHtml(name)}</strong><span class="amt-status ${minimum > 0 && actual >= minimum ? 'good' : ''}">${status}</span></div><div class="amt-values"><div><span>Actual</span><strong>${formatMinutes(actual)}</strong></div><div><span>Minimum</span><strong>${minimum ? formatMinutes(minimum) : 'Not set'}</strong></div><div><span>Target</span><strong>${target ? formatMinutes(target) : 'Not set'}</strong></div></div>${track}</article>`;
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
  if (!items.length) return '<div class="empty">Nothing logged yet.</div>';
  return items.slice(0, 20).map((item) => {
    const canonical = item.record_kind === 'progress';
    return `<article class="progress-history-row"><span class="history-date">${escapeHtml(item.occurred_on)}</span><div><strong>${escapeHtml(item.activity_name || item.activity_key || 'Activity')}</strong><small>${escapeHtml(item.subtype || factType(item))}</small></div><span class="history-value">${escapeHtml(factValue(item))}</span>${canonical ? `<button type="button" class="history-delete" data-delete-progress="${item.id}" aria-label="Delete ${escapeHtml(item.activity_name || item.activity_key || 'progress record')}">Delete</button>` : '<small class="history-legacy" title="Read-only history from the earlier Beta version">Earlier Beta history</small>'}</article>`;
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
  const minimumDetail = week.minimumCount ? 'Good-enough minimums met' : 'No minimums set';

  root.innerHTML = `<section class="progress-current" aria-labelledby="progressCurrentTitle">
    <header class="progress-current-header"><h2 id="progressCurrentTitle">Progress</h2><p>What actually happened. Targets and minimums are guidance, not debt.</p></header>
    <section class="progress-current-week" aria-labelledby="progressWeekTitle"><h3 id="progressWeekTitle">This week</h3><div class="progress-current-metrics">
      <article class="progress-current-card"><span>Actual time</span><strong>${escapeHtml(formatMinutes(week.actualTotal))}</strong><small>Recorded this week</small></article>
      <article class="progress-current-card"><span>Records</span><strong>${records}</strong><small>Across ${activeDays} active ${activeDays === 1 ? 'day' : 'days'}</small></article>
      <article class="progress-current-card"><span>Minimums</span><strong>${escapeHtml(minimumValue)}</strong><small>${escapeHtml(minimumDetail)}</small></article>
    </div></section>
    <section class="progress-goals-section os-section" aria-labelledby="progressGoalsTitle"><div class="os-section-head"><div><h3 id="progressGoalsTitle">By goal</h3><p class="gc-sr-only">Your minimums and targets are guidance, not debt.</p></div></div><div class="amt-list">${goalRows(week.items)}</div></section>
    <section class="os-section progress-history-section" aria-labelledby="progressHistoryTitle"><div class="os-section-head"><div><h3 id="progressHistoryTitle">Recent activity</h3><p class="gc-sr-only">Time, quantity and yes/no progress remain separate factual measurements.</p></div></div><div class="progress-history-list">${recentRows(history)}</div><p class="progress-boundary-note">Evidence only here. Patterns live in Insights.</p></section>
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
