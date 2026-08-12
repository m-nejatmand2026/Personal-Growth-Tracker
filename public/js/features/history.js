import { api } from '../core/api.js';
import { $, escapeHtml } from '../core/dom.js';
import { formatMinutes } from '../core/format.js';
import { state } from '../core/state.js';

export async function renderHistory() {
  let history = { energy: [], sessions: [] };
  try {
    history = await api(`/api/history?from=2026-08-10&to=${state.date}`);
  } catch {
    // Keep an empty history in preview/offline mode.
  }

  $('#historyView').innerHTML = `<div class="card"><div class="section-head"><div><h2>Energy history</h2><p>Your daily selections stay in the record.</p></div></div>${history.energy.length?history.energy.slice(0,30).map((item)=>`<div class="history-item"><span class="small muted">${item.occurred_on}</span><strong>${escapeHtml(item.label)}</strong><span class="small">E ${item.energy_score>0?'+':''}${item.energy_score} · V ${item.valence_score>0?'+':''}${item.valence_score}</span></div>`).join(''):'<div class="empty">No saved check-ins yet.</div>'}</div><div class="card"><div class="section-head"><div><h2>Recent activity</h2></div></div>${history.sessions.length?history.sessions.slice(0,50).map((item)=>`<div class="history-item"><span class="small muted">${item.occurred_on}</span><div><strong>${escapeHtml(item.activity_name)}</strong><div class="small muted">${escapeHtml(item.subtype||'')}</div></div><span>${formatMinutes(item.minutes)}</span></div>`).join(''):'<div class="empty">No sessions logged yet.</div>'}</div>`;
}
