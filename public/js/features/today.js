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

function planLoadLabel(summary) {
  if (!summary) return 'Not available';
  if (summary.impossible_by_minutes) return 'Over capacity';
  const load = Number(summary.plan_load || 0);
  if (load <= 0.5) return 'Spacious';
  if (load <= 0.7) return 'Balanced';
  if (load <= 0.85) return 'Full';
  if (load <= 1) return 'Very full';
  return 'Over capacity';
}

function loadPercent(summary) {
  if (!summary || summary.plan_load == null) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(summary.plan_load) * 100)));
}

function todayGoalItems(day) {
  const week = state.data.week || [];
  const plannedKeys = new Set((TASKS[day] || []).map(([key]) => key));
  const planned = week.filter((item) => plannedKeys.has(item.key));
  return (planned.length ? planned : week).slice(0, 4);
}

function suggestedMinutes(key, day) {
  const row = (TASKS[day] || []).find(([activityKey]) => activityKey === key);
  return Number(row?.[1] || 30);
}

function goalCard(item, day) {
  const target = Math.max(1, Number(item.target_minutes) || 0);
  const minimum = Math.max(0, Number(item.minimum_minutes) || 0);
  const actual = Math.max(0, Number(item.actual_minutes) || 0);
  const pct = Math.min(100, Math.round((actual / target) * 100));
  const minimumReached = actual >= minimum;
  return `<article class="today-goal-card">
    <div class="goal-card-top">
      <div><span class="goal-dot" aria-hidden="true"></span><strong>${escapeHtml(item.name)}</strong></div>
      <button type="button" data-log-goal="${escapeHtml(item.key)}" data-log-minutes="${suggestedMinutes(item.key, day)}">Log</button>
    </div>
    <div class="goal-progress-copy"><span>${formatMinutes(actual)} actual</span><span>${formatMinutes(minimum)} minimum</span><span>${formatMinutes(target)} target</span></div>
    <div class="goal-track" aria-label="${escapeHtml(item.name)} ${pct}% of target"><span style="width:${pct}%"></span><i style="left:${Math.min(100, Math.round((minimum / target) * 100))}%"></i></div>
    <small>${minimumReached ? 'Minimum reached this week' : `${formatMinutes(Math.max(0, minimum - actual))} to good-enough minimum`}</small>
  </article>`;
}

function dailyStateHtml(selected) {
  return `<section class="daily-state-grid" aria-label="Daily state">
    <button class="state-card energy-state" type="button" id="openEnergyCheckin">
      <span class="state-icon" aria-hidden="true">✦</span>
      <div><span>Energy</span><strong>${selected ? escapeHtml(selected.label) : 'Check in'}</strong><small>${selected ? 'Tap to update' : 'How do you feel?'}</small></div>
    </button>
    <div class="state-card">
      <span class="state-icon sleep-icon" aria-hidden="true">◐</span>
      <div><span>Sleep actual</span><strong>Not logged</strong><small>Sleep logging is the next wellbeing slice</small></div>
    </div>
    <div class="state-card">
      <span class="state-icon context-icon" aria-hidden="true">◇</span>
      <div><span>Day context</span><strong>Not logged</strong><small>Travel, social, recovery and more</small></div>
    </div>
  </section>`;
}

function capacityHtml(capacity) {
  if (!capacity) {
    return `<section class="time-reality-card"><div><span class="section-kicker">Time reality</span><h3>Capacity is temporarily unavailable</h3><p>Your goals and logging still work.</p></div></section>`;
  }
  const pct = loadPercent(capacity);
  return `<section class="time-reality-card">
    <div class="time-reality-head">
      <div><span class="section-kicker">Time reality today</span><h3>${planLoadLabel(capacity)}</h3><p>Goals use ${pct}% of currently flexible time.</p></div>
      <div class="capacity-ring" style="--capacity-pct:${pct}" aria-label="Plan load ${pct}%"><strong>${pct}%</strong><span>plan load</span></div>
    </div>
    <div class="time-reality-stats">
      <div><span>Total</span><strong>${formatMinutes(capacity.total_minutes)}</strong></div>
      <div><span>Committed</span><strong>${formatMinutes(capacity.committed_minutes)}</strong></div>
      <div><span>Flexible</span><strong>${formatMinutes(capacity.flexible_minutes)}</strong></div>
      <div><span>Goals</span><strong>${formatMinutes(capacity.planned_goal_minutes)}</strong></div>
    </div>
  </section>`;
}

function recentActivityHtml(items) {
  if (!items.length) return '<div class="empty activity-empty">Nothing logged yet today.</div>';
  return items.slice(0, 6).map((item, index) => `<div class="activity-feed-row">
    <span class="activity-symbol" aria-hidden="true">✓</span>
    <div><strong>${escapeHtml(item.activity_name || item.activity_key)}</strong>${item.subtype ? `<small>${escapeHtml(item.subtype)}</small>` : '<small>Progress record</small>'}</div>
    <span class="activity-duration">${formatMinutes(item.minutes)}</span>
    <button type="button" data-repeat-today="${index}">Repeat</button>
  </div>`).join('');
}

export function openEnergyEditor() {
  const details = $('#energyDetails');
  if (details) details.open = true;
  details?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function focusTodayActivities() {
  $('#todayGoals')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export async function renderToday({ reload, openLogger, intentionPanel = '' }) {
  const root = $('#todayView');
  if (!root) return;
  const day = new Date(`${state.date}T12:00:00`).getDay();
  const selected = state.selectedEnergy;
  const goals = todayGoalItems(day);
  const todaySessions = state.data.sessions || [];

  let capacity = null;
  try {
    capacity = await api(`/api/v1/capacity?date=${state.date}&period=day`);
  } catch {
    capacity = null;
  }

  root.innerHTML = `
    <section class="today-command">
      <div>
        <p class="eyebrow">${formatDateLabel(state.date)}</p>
        <h2>Your daily command center</h2>
        <p>See your state, your time and the few things that matter. Record what actually happens.</p>
      </div>
      <button type="button" class="command-log-btn" id="todayLogButton"><span>＋</span> Log progress</button>
    </section>

    ${dailyStateHtml(selected)}
    ${capacityHtml(capacity)}
    ${intentionPanel}

    <section class="os-section" id="todayGoals">
      <div class="os-section-head">
        <div><span class="section-kicker">Goals</span><h2>Your weekly direction</h2></div>
        <small>Actual · Minimum · Target</small>
      </div>
      <div class="today-goal-grid">${goals.length ? goals.map((item) => goalCard(item, day)).join('') : '<div class="empty">No active goal data yet.</div>'}</div>
    </section>

    <section class="os-section recent-section">
      <div class="os-section-head"><div><span class="section-kicker">Activity feed</span><h2>Recent today</h2></div></div>
      <div class="activity-feed">${recentActivityHtml(todaySessions)}</div>
    </section>

    <details class="energy-drawer" id="energyDetails">
      <summary>
        <span><strong>Energy check-in</strong><small>${selected ? `Current: ${escapeHtml(selected.label)}` : 'Optional daily observation'}</small></span>
        <span>Open map</span>
      </summary>
      <div class="energy-drawer-body">
        <p class="muted energy-help">Choose the state that best matches how you feel. Energy and valence are observations, not performance scores.</p>
        ${energyMap()}
        <div class="energy-result">${selected?`<div><span class="small muted">Selected</span><br><strong>${escapeHtml(selected.label)}</strong></div>`:`<span class="muted">Choose one state from the map.</span>`}</div>
        <div class="actions"><input id="energyNote" class="note-input" maxlength="500" placeholder="Optional note" value="${escapeHtml(selected?.note||'')}"/><button id="saveEnergy" class="btn primary" ${selected?'':'disabled'}>Save check-in</button></div>
      </div>
    </details>
  `;

  $('#todayLogButton')?.addEventListener('click', () => { void openLogger?.(); });
  $('#openEnergyCheckin')?.addEventListener('click', openEnergyEditor);

  $$('[data-log-goal]').forEach((button) => button.addEventListener('click', () => {
    void openLogger?.({ activityKey: button.dataset.logGoal, minutes: Number(button.dataset.logMinutes || 30) });
  }));

  $$('[data-repeat-today]').forEach((button) => button.addEventListener('click', () => {
    const item = todaySessions[Number(button.dataset.repeatToday)];
    if (!item) return;
    void openLogger?.({
      activity_key: item.activity_key,
      activity_name: item.activity_name,
      subtype: item.subtype || '',
      minutes: Number(item.minutes) || 25,
      date: state.date
    });
  }));

  $$('[data-energy-r]').forEach((button) => button.addEventListener('click', async () => {
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
    await renderToday({ reload, openLogger, intentionPanel });
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
    await renderToday({ reload, openLogger, intentionPanel });
  });
}
