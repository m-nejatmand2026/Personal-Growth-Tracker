import { api } from '../core/api.js';
import { $, escapeHtml } from '../core/dom.js';
import { state } from '../core/state.js';

function addDays(dateText, amount) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function stageFor(count) {
  if (count <= 6) return { key: 'collecting', label: 'Collecting data', detail: 'No trends or associations yet.' };
  if (count <= 20) return { key: 'descriptive', label: 'Descriptive stage', detail: 'Averages and distributions may be useful.' };
  if (count <= 41) return { key: 'early', label: 'Early association stage', detail: 'Associations require genuinely paired observations.' };
  return { key: 'stronger', label: 'Stronger evidence stage', detail: 'Still association, never causation.' };
}

function averageEnergy(items) {
  if (!items.length) return null;
  const sum = items.reduce((total, item) => total + Number(item.energy_score || 0), 0);
  return sum / items.length;
}

function thresholdHtml(count) {
  const rows = [
    { min: 0, max: 6, title: '0–6', text: 'Readiness only' },
    { min: 7, max: 20, title: '7–20', text: 'Descriptive summaries' },
    { min: 21, max: 41, title: '21–41', text: 'Early associations' },
    { min: 42, max: Infinity, title: '42+', text: 'Stronger associations' }
  ];
  return rows.map((row) => `<div class="insight-stage ${count >= row.min && count <= row.max ? 'current' : ''}"><strong>${row.title}</strong><span>${row.text}</span></div>`).join('');
}

export async function renderInsights() {
  const root = $('#insightsView');
  if (!root) return;

  let history = { energy: [], sessions: [] };
  try {
    history = await api(`/api/history?from=${addDays(state.date, -59)}&to=${state.date}`);
  } catch {
    history = { energy: state.selectedEnergy ? [state.selectedEnergy] : [], sessions: state.data.sessions || [] };
  }

  const energy = history.energy || [];
  const sessions = history.sessions || [];
  const trackedDays = new Set([...energy.map((item) => item.occurred_on), ...sessions.map((item) => item.occurred_on)]).size;
  const activityDays = new Set(sessions.map((item) => item.occurred_on)).size;
  const stage = stageFor(trackedDays);
  const energyAverage = averageEnergy(energy);
  const readinessPct = Math.min(100, Math.round((trackedDays / 21) * 100));

  root.innerHTML = `
    <section class="insights-hero">
      <div>
        <p class="eyebrow">Insights</p>
        <h2>Understand patterns without fake certainty</h2>
        <p>Growth Compass waits for enough evidence, shows sample size, and uses association-only language.</p>
      </div>
      <div class="insight-readiness-ring" style="--readiness:${readinessPct}" aria-label="${readinessPct}% toward 21 tracked days"><strong>${trackedDays}</strong><span>tracked days</span></div>
    </section>

    <div class="insight-summary-grid">
      <article class="insight-summary-card"><span>Current stage</span><strong>${escapeHtml(stage.label)}</strong><small>${escapeHtml(stage.detail)}</small></article>
      <article class="insight-summary-card"><span>Energy observations</span><strong>${energy.length}</strong><small>${energyAverage == null ? 'No average yet' : `Average score ${energyAverage.toFixed(1)} · N=${energy.length}`}</small></article>
      <article class="insight-summary-card"><span>Activity days</span><strong>${activityDays}</strong><small>${sessions.length} progress records available</small></article>
    </div>

    <section class="os-section insight-readiness-section">
      <div class="os-section-head"><div><span class="section-kicker">Evidence guardrail</span><h2>What the app may show</h2></div><small>Current tracked days: ${trackedDays}</small></div>
      <div class="insight-stage-grid">${thresholdHtml(trackedDays)}</div>
    </section>

    <section class="association-waiting">
      <div class="association-icon" aria-hidden="true">↔</div>
      <div>
        <span class="section-kicker">Associations</span>
        <h2>Waiting for paired wellbeing data</h2>
        <p>Sleep and day-context records are not connected to this beta experience yet, so Growth Compass will not manufacture relationship cards. When paired observations exist, every card will show N and use language such as “associated with” or “tends to coincide with”.</p>
      </div>
    </section>
  `;
}
