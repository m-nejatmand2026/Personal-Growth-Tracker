import { $, escapeHtml } from '../core/dom.js';
import { formatMinutes } from '../core/format.js';
import { state } from '../core/state.js';

export function renderWeek() {
  const items = state.data.week || [];
  const average = items.length
    ? Math.round(items.reduce((total, item) => total + Math.min(1, item.progress || 0), 0) / items.length * 100)
    : 0;

  $('#weekView').innerHTML = `<div class="metric-grid"><div class="metric"><span class="small muted">Overall target progress</span><strong>${average}%</strong></div><div class="metric"><span class="small muted">Rule</span><strong style="font-size:16px">Minimum still counts</strong></div></div><div class="card" style="margin-top:14px"><div class="section-head"><div><h2>This week</h2><p>Progress, not streaks.</p></div></div>${items.map((item)=>`<div class="progress-row"><div class="progress-top"><strong>${escapeHtml(item.name)}</strong><span>${formatMinutes(item.actual_minutes)} / ${formatMinutes(item.target_minutes)}</span></div><div class="bar"><span style="width:${Math.round((item.progress||0)*100)}%"></span></div><div class="small muted">Good-enough minimum: ${formatMinutes(item.minimum_minutes)}</div></div>`).join('')}</div>`;
}
