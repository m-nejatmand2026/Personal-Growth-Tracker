import { api } from '../core/api.js';
import { $, $$, escapeHtml } from '../core/dom.js';
import { formatDateLabel, formatMinutes } from '../core/format.js';
import { state } from '../core/state.js';
import { toast } from '../core/toast.js';
import { ENERGY, energyClass, energyScore, valenceScore } from '../config/energy.js';
import { TASKS } from '../config/schedule.js';

function energyMap() {
  return `<div class="energy-axis high">↑ High Energy</div><div class="valence"><span>← Negative Feeling</span><span>Positive Feeling →</span></div><div class="energy-grid">${ENERGY.flatMap((row,r)=>row.map((label,c)=>`<button class="energy-cell ${energyClass(r,c)} ${state.selectedEnergy?.row_idx===r&&state.selectedEnergy?.col_idx===c?'selected':''}" data-energy-r="${r}" data-energy-c="${c}">${label}</button>`)).join('')}</div><div class="energy-axis low">↓ Low Energy</div>`;
}

function taskActual(key) {
  return (state.data.sessions || [])
    .filter((session) => session.activity_key === key)
    .reduce((total, session) => total + Number(session.minutes), 0);
}

export function renderToday({ reload }) {
  const day = new Date(`${state.date}T12:00:00`).getDay();
  const tasks = TASKS[day] || [];
  const selected = state.selectedEnergy;

  $('#todayView').innerHTML = `
    <div class="card"><div class="section-head"><div><h2>${formatDateLabel(state.date)}</h2><p>Start with how you actually feel. One check-in per day.</p></div>${selected?`<span class="badge">${escapeHtml(selected.label)}</span>`:''}</div>
    ${energyMap()}
    <div class="energy-result">${selected?`<div><span class="small muted">Selected</span><br><strong>${escapeHtml(selected.label)}</strong></div>`:`<span class="muted">Choose one state from the map.</span>`}</div>
    <div class="actions"><input id="energyNote" class="note-input" placeholder="Optional note" value="${escapeHtml(selected?.note||'')}"/><button id="saveEnergy" class="btn primary" ${selected?'':'disabled'}>Save check-in</button></div></div>
    <div class="card"><div class="section-head"><div><h2>Today</h2><p>${day===5?'Friday evening stays free. ':''}Log what you actually do; no catch-up debt.</p></div></div>
    <div>${tasks.map(([key,min,desc])=>`<div class="today-task"><div><div class="task-title">${key==='sport'?'Sport / Calisthenics':key[0].toUpperCase()+key.slice(1)}</div><div class="task-meta">${desc} · suggested ${formatMinutes(min)} · today ${formatMinutes(taskActual(key))}</div></div><div class="quick"><button data-log="${key}" data-min="${min}">+ ${formatMinutes(min)}</button></div></div>`).join('')}</div></div>`;

  $$('[data-energy-r]').forEach((button) => button.addEventListener('click', () => {
    const row = Number(button.dataset.energyR);
    const column = Number(button.dataset.energyC);
    state.selectedEnergy = {
      occurred_on: state.date,
      label: ENERGY[row][column],
      row_idx: row,
      col_idx: column,
      energy_score: energyScore(row),
      valence_score: valenceScore(column),
      note: state.selectedEnergy?.note || ''
    };
    renderToday({ reload });
  }));

  $('#saveEnergy')?.addEventListener('click', async () => {
    state.selectedEnergy.note = $('#energyNote').value;
    try {
      await api('/api/energy', { method: 'POST', body: JSON.stringify(state.selectedEnergy) });
      toast('Energy check-in saved');
    } catch {
      toast('Preview mode: not saved to database');
    }
    renderToday({ reload });
  });

  $$('[data-log]').forEach((button) => button.addEventListener('click', async () => {
    try {
      await api('/api/session', {
        method: 'POST',
        body: JSON.stringify({
          occurred_on: state.date,
          activity_key: button.dataset.log,
          minutes: Number(button.dataset.min)
        })
      });
      toast('Session logged');
      await reload();
    } catch {
      toast('Preview mode: database not connected');
    }
  }));
}
