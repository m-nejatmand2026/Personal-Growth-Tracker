import { api } from '../core/api.js';
import { $, escapeHtml } from '../core/dom.js';
import { formatMinutes } from '../core/format.js';
import { state } from '../core/state.js';

function weeklySummary() {
  const items = state.data.week || [];
  const average = items.length
    ? Math.round(items.reduce((total, item) => total + Math.min(1, item.progress || 0), 0) / items.length * 100)
    : 0;
  return { items, average };
}

function weeklyRows(items) {
  if (!items.length) return '<div class="empty">No weekly progress yet.</div>';
  return items.map((item) => {
    const pct = Math.max(0, Math.min(100, Math.round((item.progress || 0) * 100)));
    return `<div class="progress-row">
      <div class="progress-top"><strong>${escapeHtml(item.name)}</strong><span>${formatMinutes(item.actual_minutes)} / ${formatMinutes(item.target_minutes)}</span></div>
      <div class="bar" aria-label="${escapeHtml(item.name)} ${pct}%"><span style="width:${pct}%"></span></div>
      <div class="small muted">Minimum: ${formatMinutes(item.minimum_minutes)} · ${pct}% of target</div>
    </div>`;
  }).join('');
}

function recentRows(items) {
  if (!items.length) return '<div class="empty">Nothing logged yet.</div>';
  return items.slice(0, 12).map((item) => `<div class="history-item">
    <span class="small muted">${escapeHtml(item.occurred_on)}</span>
    <div><strong>${escapeHtml(item.activity_name)}</strong>${item.subtype ? `<div class="small muted">${escapeHtml(item.subtype)}</div>` : ''}</div>
    <span>${formatMinutes(item.minutes)}</span>
  </div>`).join('');
}

export async function renderProgress() {
  const root = $('#progressView');
  if (!root) return;

  const week = weeklySummary();
  let history = { energy: [], sessions: [] };
  try {
    history = await api(`/api/history?from=2026-08-10&to=${state.date}`);
  } catch {
    // Keep the page useful with weekly bootstrap data if history is temporarily unavailable.
  }

  root.innerHTML = `
    <div class="page-lead">
      <p class="eyebrow">Progress</p>
      <h2>See what is moving</h2>
      <p>Targets give direction. Minimums still count, and there is no catch-up debt.</p>
    </div>

    <div class="metric-grid progress-metrics">
      <div class="metric"><span class="small muted">This week</span><strong>${week.average}%</strong><span class="small muted">overall target progress</span></div>
      <div class="metric"><span class="small muted">Approach</span><strong class="metric-copy">Minimum still counts</strong><span class="small muted">consistency over perfection</span></div>
    </div>

    <section class="card section-card">
      <div class="section-head"><div><h2>This week</h2><p>Actual progress against your current plan.</p></div></div>
      ${weeklyRows(week.items)}
    </section>

    <section class="card section-card">
      <div class="section-head"><div><h2>Recent activity</h2><p>Your latest saved sessions.</p></div></div>
      ${recentRows(history.sessions || [])}
    </section>

    <details class="card quiet-details">
      <summary>Energy history</summary>
      <div class="quiet-details-body">
        ${(history.energy || []).length
          ? history.energy.slice(0, 20).map((item) => `<div class="history-item"><span class="small muted">${escapeHtml(item.occurred_on)}</span><strong>${escapeHtml(item.label)}</strong><span class="small">E ${item.energy_score > 0 ? '+' : ''}${item.energy_score}</span></div>`).join('')
          : '<div class="empty">No saved energy check-ins yet.</div>'}
      </div>
    </details>
  `;
}
