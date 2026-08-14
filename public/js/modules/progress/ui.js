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

function weeklySummary() {
  const items = state.data.week || [];
  const targetTotal = items.reduce((sum, item) => sum + Math.max(0, Number(item.target_minutes) || 0), 0);
  const minimumTotal = items.reduce((sum, item) => sum + Math.max(0, Number(item.minimum_minutes) || 0), 0);
  const actualTotal = items.reduce((sum, item) => sum + Math.max(0, Number(item.actual_minutes) || 0), 0);
  const cappedActual = items.reduce((sum, item) => sum + Math.min(Math.max(0, Number(item.actual_minutes) || 0), Math.max(0, Number(item.target_minutes) || 0)), 0);
  const targetProgress = targetTotal ? Math.round((cappedActual / targetTotal) * 100) : 0;
  const measurableItems = items.filter((item) => Number(item.minimum_minutes || 0) > 0 || Number(item.target_minutes || 0) > 0);
  const minimumReached = measurableItems.filter((item) => Number(item.actual_minutes || 0) >= Number(item.minimum_minutes || 0)).length;
  const allMinimums = measurableItems.length > 0 && minimumReached === measurableItems.length;
  const status = allMinimums && targetProgress >= 90
    ? 'Strong week'
    : allMinimums
      ? 'Good-enough week'
      : measurableItems.length
        ? 'Below minimum — no catch-up required'
        : 'Facts recorded — targets are optional';

  return { items, targetTotal, minimumTotal, actualTotal, targetProgress, minimumReached, measurableCount: measurableItems.length, status };
}

function goalRows(items) {
  if (!items.length) return '<div class="empty">No weekly progress yet.</div>';

  return items.map((item) => {
    const actual = Math.max(0, Number(item.actual_minutes) || 0);
    const minimum = Math.max(0, Number(item.minimum_minutes) || 0);
    const target = Math.max(0, Number(item.target_minutes) || 0);
    const name = item.name || item.key;

    if (!target && !minimum) {
      return `<div class="amt-row"><div class="amt-name"><strong>${escapeHtml(name)}</strong><span class="amt-status good">Recorded</span></div><div class="amt-values"><div><span>Actual</span><strong>${formatMinutes(actual)}</strong></div><div><span>Minimum</span><strong>Not set</strong></div><div><span>Target</span><strong>Not set</strong></div></div></div>`;
    }

    const status = actual >= target && target > 0 ? 'Target reached' : actual >= minimum ? 'Good-enough' : 'Building';
    const track = renderThresholdTrack({
      label: name,
      actual,
      minimum,
      target,
      actualText: formatMinutes(actual),
      minimumText: minimum ? formatMinutes(minimum) : 'Not set',
      targetText: target ? formatMinutes(target) : 'Not set'
    });

    return `<div class="amt-row"><div class="amt-name"><strong>${escapeHtml(name)}</strong><span class="amt-status ${minimum > 0 && actual >= minimum ? 'good' : ''}">${status}</span></div><div class="amt-values"><div><span>Actual</span><strong>${formatMinutes(actual)}</strong></div><div><span>Minimum</span><strong>${minimum ? formatMinutes(minimum) : 'Not set'}</strong></div><div><span>Target</span><strong>${target ? formatMinutes(target) : 'Not set'}</strong></div></div>${track}</div>`;
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
  return 'Fact';
}

function recentRows(items) {
  if (!items.length) return '<div class="empty">Nothing logged yet.</div>';

  return items.slice(0, 20).map((item) => {
    const canonical = item.record_kind === 'progress';
    return `<div class="progress-history-row"><span class="history-date">${escapeHtml(item.occurred_on)}</span><div><strong>${escapeHtml(item.activity_name || item.activity_key || 'Activity')}</strong><small>${escapeHtml(item.subtype || factType(item))}</small></div><span class="history-value">${escapeHtml(factValue(item))}</span>${canonical ? `<button type="button" class="history-delete" data-delete-progress="${item.id}" aria-label="Delete ${escapeHtml(item.activity_name || item.activity_key || 'progress record')}">Delete</button>` : '<small class="history-legacy">Beta history</small>'}</div>`;
  }).join('');
}

export async function renderProgress({ reload } = {}) {
  const root = $('#progressView');
  if (!root) return;

  const week = weeklySummary();
  const from = addDays(state.date, -29);
  let history = [];
  let energy = [];

  try {
    const response = await api(`/api/v1/progress?from=${from}&to=${state.date}&limit=100`);
    history = response.items || [];
  } catch {
    history = state.data.sessions || [];
  }

  try {
    const legacyHistory = await api(`/api/history?from=${from}&to=${state.date}`);
    energy = legacyHistory.energy || [];
  } catch {
    energy = [];
  }

  root.innerHTML = `<section class="progress-dashboard"><div class="progress-dashboard-head"><div><p class="eyebrow">Progress</p><h2>Actual, minimum, target</h2><p>Enough counts. Targets guide direction; they do not create debt.</p></div><span class="week-status">${escapeHtml(week.status)}</span></div><div class="progress-stat-grid"><div><span>Target coverage</span><strong>${week.targetTotal ? `${week.targetProgress}%` : 'Not set'}</strong><small>capped at each target</small></div><div><span>Minimums reached</span><strong>${week.measurableCount ? `${week.minimumReached}/${week.measurableCount}` : 'Not set'}</strong><small>only goals with guidance</small></div><div><span>Actual time</span><strong>${formatMinutes(week.actualTotal)}</strong><small>facts recorded this week</small></div><div><span>Target time</span><strong>${week.targetTotal ? formatMinutes(week.targetTotal) : 'Not set'}</strong><small>time-allocation goals only</small></div></div></section><section class="os-section progress-goals-section"><div class="os-section-head"><div><span class="section-kicker">This week</span><h2>Goal progress</h2></div><small>Minimum and target are guidance, not debt</small></div><div class="amt-list">${goalRows(week.items)}</div></section><section class="os-section progress-history-section"><div class="os-section-head"><div><span class="section-kicker">History</span><h2>Recent factual records</h2></div><small>Time, quantity and yes/no facts stay distinct</small></div><div class="progress-history-list">${recentRows(history)}</div></section><details class="energy-drawer progress-energy-history"><summary><span><strong>Energy history</strong><small>Daily observations</small></span><span>Open</span></summary><div class="energy-drawer-body">${energy.length ? energy.slice(0, 30).map((item) => `<div class="progress-history-row"><span class="history-date">${escapeHtml(item.occurred_on)}</span><strong>${escapeHtml(item.label)}</strong><span>E ${item.energy_score > 0 ? '+' : ''}${item.energy_score}</span></div>`).join('') : '<div class="empty">No saved energy check-ins yet.</div>'}</div></details>`;

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
