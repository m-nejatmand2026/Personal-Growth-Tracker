import { api } from '../../core/api.js';
import { $, escapeHtml } from '../../core/dom.js';
import { state } from '../../core/state.js';

function addDays(dateText, amount) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function stageFor(count) {
  if (count <= 6) return { label: 'Still learning', detail: 'There is not enough history for useful patterns yet.', next: 'Keep recording a few ordinary days.' };
  if (count <= 20) return { label: 'Basic summaries', detail: 'Simple descriptive summaries can start to be useful.', next: 'More paired observations are needed before showing associations.' };
  if (count <= 41) return { label: 'Early patterns', detail: 'Possible associations need matching observations from the same days.', next: 'Treat any pattern as a hypothesis, not a conclusion.' };
  return { label: 'Stronger evidence', detail: 'More history can strengthen an association, but it still does not prove cause.', next: 'Look for repeatable associations with visible sample sizes.' };
}

function averageEnergy(items) {
  if (!items.length) return null;
  return items.reduce((sum, item) => sum + Number(item.energy_score || 0), 0) / items.length;
}

function thresholdHtml(count) {
  const rows = [
    { min: 0, max: 6, title: '0–6 days', text: 'Collecting' },
    { min: 7, max: 20, title: '7–20 days', text: 'Summaries' },
    { min: 21, max: 41, title: '21–41 days', text: 'Early associations' },
    { min: 42, max: Infinity, title: '42+ days', text: 'Stronger associations' }
  ];
  return rows.map((row) => {
    const current = count >= row.min && count <= row.max;
    return `<div class="gc-insight-stage ${current ? 'current' : ''}"${current ? ' aria-current="step"' : ''}><strong>${row.title}</strong><span>${row.text}</span></div>`;
  }).join('');
}

function unavailableHtml() {
  return `<section class="gc-insights-rebuild"><header class="gc-product-page-header"><div><h2>Insights</h2><p>Patterns only when the evidence earns them.</p></div></header><div class="gc-state-message"><h3>Evidence is unavailable</h3><p>No summaries were generated. Try again later.</p></div></section>`;
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

  root.innerHTML = `<section class="gc-insights-rebuild" aria-labelledby="insightsCurrentTitle">
    <header class="gc-product-page-header"><div><h2 id="insightsCurrentTitle">Insights</h2><p>What the evidence may support. Association is never presented as cause.</p></div></header>
    <section class="gc-insight-readiness" aria-labelledby="insightsReadinessTitle"><span class="gc-kicker">Evidence readiness</span><div class="gc-insight-readiness-main"><div><h3 id="insightsReadinessTitle">${escapeHtml(stage.label)}</h3><p>${escapeHtml(stage.detail)}</p></div><strong>${trackedDays}<small>tracked ${trackedDays === 1 ? 'day' : 'days'}</small></strong></div><p class="gc-insight-next">${escapeHtml(stage.next)}</p></section>
    <section class="gc-insight-evidence" aria-labelledby="insightsEvidenceTitle"><div class="gc-section-title"><div><span>Available evidence</span><h3 id="insightsEvidenceTitle">What is actually recorded</h3></div></div><div class="gc-insight-facts"><article><strong>${progress.length}</strong><span>progress records</span><small>${activityDays} active ${activityDays === 1 ? 'day' : 'days'}</small></article><article><strong>${energy.length}</strong><span>energy check-ins</span><small>${energyAverage == null ? 'No average yet' : `Average ${energyAverage.toFixed(1)}`}</small></article></div></section>
    <section class="gc-insight-empty-pattern"><span class="gc-kicker">Patterns</span><h3>No defensible matched pattern yet</h3><p>This space stays quiet until enough same-day evidence exists. Growth Compass will not invent an insight just to fill the page.</p></section>
    <details class="gc-insight-method"><summary><span><strong>How Insights decides what to show</strong><small>Evidence thresholds and limits</small></span><b aria-hidden="true">›</b></summary><div><p>Matched observations can support summaries and then associations. Every future association must show how much evidence supports it, and it still cannot establish cause.</p><div class="gc-insight-stage-grid">${thresholdHtml(trackedDays)}</div></div></details>
  </section>`;
}