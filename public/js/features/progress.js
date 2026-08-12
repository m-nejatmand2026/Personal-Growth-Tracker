import { api } from '../core/api.js';
import { $, $$, escapeHtml } from '../core/dom.js';
import { formatMinutes } from '../core/format.js';
import { state } from '../core/state.js';
import { toast } from '../core/toast.js';

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
  const minimumReached = items.filter((item) => Number(item.actual_minutes || 0) >= Number(item.minimum_minutes || 0)).length;
  const allMinimums = items.length > 0 && minimumReached === items.length;
  const status = allMinimums && targetProgress >= 90
    ? 'Strong week'
    : allMinimums
      ? 'Good-enough week'
      : 'Below minimum — no catch-up required';
  return { items, targetTotal, minimumTotal, actualTotal, targetProgress, minimumReached, status };
}

function goalRows(items) {
  if (!items.length) return '<div class="empty">No weekly progress yet.</div>';
  return items.map((item) => {
    const actual = Math.max(0, Number(item.actual_minutes) || 0);
    const minimum = Math.max(0, Number(item.minimum_minutes) || 0);
    const target = Math.max(1, Number(item.target_minutes) || 0);
    const pct = Math.min(100, Math.round((actual / target) * 100));
    const minimumPct = Math.min(100, Math.round((minimum / target) * 100));
    const status = actual >= target ? 'Target reached' : actual >= minimum ? 'Good-enough' : 'Building';
    return `<div class="amt-row">
      <div class="amt-name"><strong>${escapeHtml(item.name)}</strong><span class="amt-status ${actual >= minimum ? 'good' : ''}">${status}</span></div>
      <div class="amt-values">
        <div><span>Actual</span><strong>${formatMinutes(actual)}</strong></div>
        <div><span>Minimum</span><strong>${formatMinutes(minimum)}</strong></div>
        <div><span>Target</span><strong>${formatMinutes(target)}</strong></div>
      </div>
      <div class="amt-track" aria-label="${escapeHtml(item.name)} ${pct}% of target"><span style="width:${pct}%"></span><i style="left:${minimumPct}%" title="Minimum"></i></div>
    </div>`;
  }).join('');
}

function recentRows(items) {
  if (!items.length) return '<div class="empty">Nothing logged yet.</div>';
  return items.slice(0, 20).map((item) => `<div class="progress-history-row">
    <span class="history-date">${escapeHtml(item.occurred_on)}</span>
    <div><strong>${escapeHtml(item.activity_name || item.activity_key)}</strong>${item.subtype ? `<small>${escapeHtml(item.subtype)}</small>` : ''}</div>
    <span>${formatMinutes(item.minutes)}</span>
    <button type="button" class="history-delete" data-delete-session="${item.id}" aria-label="Delete ${escapeHtml(item.activity_name || item.activity_key)}">Delete</button>
  </div>`).join('');
}

export async function renderProgress({ reload } = {}) {
  const root = $('#progressView');
  if (!root) return;

  const week = weeklySummary();
  let history = { energy: [], sessions: [] };
  try {
    history = await api(`/api/history?from=${addDays(state.date, -29)}&to=${state.date}`);
  } catch {
    history = { energy: [], sessions: state.data.sessions || [] };
  }

  root.innerHTML = `
    <section class="progress-dashboard">
      <div class="progress-dashboard-head">
        <div><p class="eyebrow">Progress</p><h2>Actual, minimum, target</h2><p>Enough counts. Targets guide direction; they do not create debt.</p></div>
        <span class="week-status">${escapeHtml(week.status)}</span>
      </div>
      <div class="progress-stat-grid">
        <div><span>Overall target progress</span><strong>${week.targetProgress}%</strong></div>
        <div><span>Minimums reached</span><strong>${week.minimumReached}/${week.items.length || 0}</strong></div>
        <div><span>Actual time</span><strong>${formatMinutes(week.actualTotal)}</strong></div>
        <div><span>Target time</span><strong>${formatMinutes(week.targetTotal)}</strong></div>
      </div>
    </section>

    <section class="os-section progress-goals-section">
      <div class="os-section-head">
        <div><span class="section-kicker">This week</span><h2>Goal progress</h2></div>
        <small>Minimum marker shown on each bar</small>
      </div>
      <div class="amt-list">${goalRows(week.items)}</div>
    </section>

    <section class="os-section">
      <div class="os-section-head"><div><span class="section-kicker">History</span><h2>Recent activity</h2></div><small>Delete is explicit and confirmed</small></div>
      <div class="progress-history-list">${recentRows(history.sessions || [])}</div>
    </section>

    <details class="energy-drawer progress-energy-history">
      <summary><span><strong>Energy history</strong><small>Daily observations</small></span><span>Open</span></summary>
      <div class="energy-drawer-body">
        ${(history.energy || []).length
          ? history.energy.slice(0, 30).map((item) => `<div class="progress-history-row"><span class="history-date">${escapeHtml(item.occurred_on)}</span><strong>${escapeHtml(item.label)}</strong><span>E ${item.energy_score > 0 ? '+' : ''}${item.energy_score}</span></div>`).join('')
          : '<div class="empty">No saved energy check-ins yet.</div>'}
      </div>
    </details>
  `;

  $$('[data-delete-session]').forEach((button) => button.addEventListener('click', async () => {
    const id = Number(button.dataset.deleteSession || 0);
    if (!id || !window.confirm('Delete this progress record?')) return;
    try {
      await api(`/api/session?id=${id}`, { method: 'DELETE' });
      toast('Progress record deleted');
      await reload?.();
    } catch (error) {
      toast(error.message || 'Could not delete progress record');
    }
  }));
}
