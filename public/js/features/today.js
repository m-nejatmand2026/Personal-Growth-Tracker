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

function dailyStateHtml(selected) {
  return `<section class="daily-state-strip">
    <button class="daily-state-item" type="button" id="openEnergyCheckin">
      <span class="daily-state-label">Energy</span>
      <strong>${selected ? escapeHtml(selected.label) : 'Check in'}</strong>
      <small>${selected ? 'Tap to update' : 'How do you feel?'}</small>
    </button>
    <div class="daily-state-item passive">
      <span class="daily-state-label">Sleep</span>
      <strong>—</strong>
      <small>Actual sleep coming next</small>
    </div>
    <div class="daily-state-item passive">
      <span class="daily-state-label">Context</span>
      <strong>Normal</strong>
      <small>Day context coming next</small>
    </div>
  </section>`;
}

function taskRows(tasks) {
  if (!tasks.length) return '<div class="empty">Nothing is scheduled for today. You can still log anything you actually do.</div>';
  return tasks.map(([key,min,desc])=>{
    const title = key === 'sport' ? 'Sport / Calisthenics' : key[0].toUpperCase()+key.slice(1);
    const actual = taskActual(key);
    return `<div class="focus-row">
      <div class="focus-main">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(desc)}</span>
        <small>Suggested ${formatMinutes(min)} · logged this week ${formatMinutes(actual)}</small>
      </div>
      <button class="quick-log-btn" data-log="${key}" data-min="${min}" type="button">Quick log ${formatMinutes(min)}</button>
    </div>`;
  }).join('');
}

export function openEnergyEditor() {
  const details = $('#energyDetails');
  if (details) details.open = true;
  $('#energyDetails')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function focusTodayActivities() {
  $('#todayActivitiesCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function renderToday({ reload }) {
  const day = new Date(`${state.date}T12:00:00`).getDay();
  const tasks = TASKS[day] || [];
  const selected = state.selectedEnergy;

  $('#todayView').innerHTML = `
    <div class="page-lead today-lead">
      <p class="eyebrow">${formatDateLabel(state.date)}</p>
      <h2>What matters today?</h2>
      <p>Use the app lightly. Record what actually happens; there is no catch-up debt.</p>
    </div>

    ${dailyStateHtml(selected)}

    <section class="card section-card" id="todayActivitiesCard">
      <div class="section-head"><div><h2>Your focus</h2><p>${day===5?'Friday evening stays free. ':''}A short view of what is planned today.</p></div></div>
      <div class="focus-list">${taskRows(tasks)}</div>
    </section>

    <details class="card quiet-details energy-details" id="energyDetails">
      <summary>
        <span><strong>Energy check-in</strong><small>${selected ? `Current: ${escapeHtml(selected.label)}` : 'Optional daily observation'}</small></span>
        <span class="details-action">Open</span>
      </summary>
      <div class="quiet-details-body">
        <p class="muted energy-help">Choose the state that best matches how you feel. Energy and valence are observations, not scores of how well you are doing.</p>
        ${energyMap()}
        <div class="energy-result">${selected?`<div><span class="small muted">Selected</span><br><strong>${escapeHtml(selected.label)}</strong></div>`:`<span class="muted">Choose one state from the map.</span>`}</div>
        <div class="actions"><input id="energyNote" class="note-input" maxlength="500" placeholder="Optional note" value="${escapeHtml(selected?.note||'')}"/><button id="saveEnergy" class="btn primary" ${selected?'':'disabled'}>Save check-in</button></div>
      </div>
    </details>
  `;

  $('#openEnergyCheckin')?.addEventListener('click', openEnergyEditor);

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
    openEnergyEditor();
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
      toast('Progress logged');
      await reload();
    } catch {
      toast('Preview mode: database not connected');
    }
  }));
}
