import { api } from '../../core/api.js';
import { $, escapeHtml } from '../../core/dom.js';
import { state } from '../../core/state.js';

function addDays(dateText, amount) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function stageFor(count) {
  if (count <= 6) return { label: 'Still learning', detail: 'There is not enough history for useful patterns yet.' };
  if (count <= 20) return { label: 'Basic summaries', detail: 'Simple averages and distributions can start to be useful.' };
  if (count <= 41) return { label: 'Early patterns', detail: 'Possible associations need matching observations from the same days.' };
  return { label: 'Stronger patterns', detail: 'More history can strengthen an association, but it still does not prove cause.' };
}

function averageEnergy(items) {
  if (!items.length) return null;
  return items.reduce((sum, item) => sum + Number(item.energy_score || 0), 0) / items.length;
}

function thresholdHtml(count) {
  const rows = [
    { min: 0, max: 6, title: '0–6', text: 'Collecting' },
    { min: 7, max: 20, title: '7–20', text: 'Summaries' },
    { min: 21, max: 41, title: '21–41', text: 'Early associations' },
    { min: 42, max: Infinity, title: '42+', text: 'Stronger associations' }
  ];
  return rows.map((row) => {
    const current = count >= row.min && count <= row.max;
    return `<div class="insight-stage ${current ? 'current' : ''}"${current ? ' aria-current="step"' : ''}><strong>${row.title}</strong><span>${row.text}</span></div>`;
  }).join('');
}

function unavailableHtml() {
  return `<section class="insights-current"><header class="insights-current-header"><h2>Insights</h2><p>Patterns only when the evidence is strong enough. Association never proves cause.</p></header><div class="gc-state-message"><h3>Evidence is unavailable</h3><p>No summaries were generated. Try again later.</p></div></section>`;
}

export async function renderInsights() {
  const root = $('#insightsView');
  if (!root) return;

  const from = addDays(state.date, -59);
  let energy = [];
  let progress = [];
  try {
    const [energyResponse, progressResponse] = await Promise.all([
      api(`/api/v1/wellbeing/energy?from=${from}&to=${state.date}&limit=300`),
      api(`/api/v1/progress?from=${from}&to=${state.date}&limit=300`)
    ]);
    energy = energyResponse.items || [];
    progress = progressResponse.items || [];
  } catch {
    root.innerHTML = unavailableHtml();
    return;
  }

  const trackedDays = new Set([...energy.map((item) => item.occurred_on), ...progress.map((item) => item.occurred_on)]).size;
  const activityDays = new Set(progress.map((item) => item.occurred_on)).size;
  const stage = stageFor(trackedDays);
  const energyAverage = averageEnergy(energy);
  const matchedPatterns = 0;

  root.innerHTML = `<section class="insights-current" aria-labelledby="insightsCurrentTitle">
    <header class="insights-current-header"><div><h2 id="insightsCurrentTitle">Insights</h2><p>Patterns only when the evidence is strong enough. Association never proves cause.</p></div><button type="button" class="insights-more" aria-label="More insight options">•••</button></header>
    <section class="insights-readiness" aria-labelledby="insightsReadinessTitle"><span>EVIDENCE READINESS</span><h3 id="insightsReadinessTitle">${escapeHtml(stage.label)}</h3><strong>${trackedDays} tracked ${trackedDays === 1 ? 'day' : 'days'}</strong><p>${escapeHtml(stage.detail)}</p></section>
    <section class="insights-evidence" aria-labelledby="insightsEvidenceTitle"><h3 id="insightsEvidenceTitle">What the evidence says</h3><div class="insight-summary-grid">
      <article class="insight-summary-card"><span>Energy check-ins</span><div><strong>${energy.length}</strong><small>${energyAverage == null ? 'No average recorded yet' : `Average recorded energy ${energyAverage.toFixed(1)}`}</small></div></article>
      <article class="insight-summary-card"><span>Active days</span><div><strong>${activityDays}</strong><small>${progress.length} progress ${progress.length === 1 ? 'record' : 'records'}</small></div></article>
      <article class="insight-summary-card"><span>Matched patterns</span><div><strong>${matchedPatterns}</strong><small>Not enough matching observations yet</small></div></article>
    </div></section>
    <section class="association-waiting"><h3>No matched patterns yet</h3><p>Keep logging. Patterns appear only when matching observations are strong enough.</p><strong>More history can strengthen an association; it still does not prove cause.</strong></section>
    <details class="insight-method-disclosure os-section"><summary><strong>How insights work</strong><span>${trackedDays} days</span></summary><div class="insight-method-content"><p>Matched observations → summaries → early associations → stronger associations. Every future pattern must show supporting observation counts.</p><div class="insight-stage-grid">${thresholdHtml(trackedDays)}</div></div></details>
  </section>`;
}
