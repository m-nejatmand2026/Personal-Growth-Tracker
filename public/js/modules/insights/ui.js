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
    { min: 0, max: 6, title: '0–6 days', text: 'Collecting enough history' },
    { min: 7, max: 20, title: '7–20 days', text: 'Basic summaries' },
    { min: 21, max: 41, title: '21–41 days', text: 'Early associations' },
    { min: 42, max: Infinity, title: '42+ days', text: 'Stronger associations' }
  ];
  return rows.map((row) => {
    const current = count >= row.min && count <= row.max;
    return `<div class="insight-stage ${current ? 'current' : ''}"${current ? ' aria-current="step"' : ''}><strong>${row.title}</strong><span>${row.text}</span></div>`;
  }).join('');
}

function unavailableHtml() {
  return `
    <section class="insights-hero">
      <div>
        <p class="eyebrow">Insights</p>
        <h2>Evidence is temporarily unavailable</h2>
        <p>Growth Compass could not read both Progress and Wellbeing evidence, so no summaries or relationships were generated. Please try again.</p>
      </div>
    </section>`;
}

export async function renderInsights() {
  const root = $('#insightsView');
  if (!root) return;

  const from = addDays(state.date, -59);
  let energy = [];
  let progress = [];
  let evidenceAvailable = true;

  try {
    const [energyResponse, progressResponse] = await Promise.all([
      api(`/api/v1/wellbeing/energy?from=${from}&to=${state.date}&limit=300`),
      api(`/api/v1/progress?from=${from}&to=${state.date}&limit=300`)
    ]);
    energy = energyResponse.items || [];
    progress = progressResponse.items || [];
  } catch {
    evidenceAvailable = false;
  }

  if (!evidenceAvailable) {
    root.innerHTML = unavailableHtml();
    return;
  }

  const trackedDays = new Set([
    ...energy.map((item) => item.occurred_on),
    ...progress.map((item) => item.occurred_on)
  ]).size;
  const activityDays = new Set(progress.map((item) => item.occurred_on)).size;
  const stage = stageFor(trackedDays);
  const energyAverage = averageEnergy(energy);
  const readinessPct = Math.min(100, Math.round((trackedDays / 21) * 100));

  root.innerHTML = `
    <section class="insights-hero">
      <div>
        <p class="eyebrow">Insights</p>
        <h2>See patterns only when there is enough evidence</h2>
        <p>Growth Compass shows how much history supports an insight and uses association language rather than claiming cause.</p>
      </div>
      <div class="insight-readiness-ring" role="img" style="--readiness:${readinessPct}" aria-label="${readinessPct}% toward 21 tracked days"><strong>${trackedDays}</strong><span>tracked days</span></div>
    </section>
    <div class="insight-summary-grid">
      <article class="insight-summary-card"><span>What we can say now</span><strong>${escapeHtml(stage.label)}</strong><small>${escapeHtml(stage.detail)}</small></article>
      <article class="insight-summary-card"><span>Energy check-ins</span><strong>${energy.length}</strong><small>${energyAverage == null ? 'No average yet' : `Average recorded energy ${energyAverage.toFixed(1)} · ${energy.length} check-ins`}</small></article>
      <article class="insight-summary-card"><span>Days with activity</span><strong>${activityDays}</strong><small>${progress.length} completed progress records</small></article>
    </div>
    <section class="os-section insight-readiness-section">
      <div class="os-section-head"><div><span class="section-kicker">Evidence level</span><h2>What becomes useful with more history</h2></div><small>${trackedDays} tracked days so far</small></div>
      <div class="insight-stage-grid">${thresholdHtml(trackedDays)}</div>
    </section>
    <section class="association-waiting">
      <div class="association-icon" aria-hidden="true">↔</div>
      <div>
        <span class="section-kicker">Patterns</span>
        <h2>Not enough matching wellbeing data yet</h2>
        <p>Growth Compass only compares observations that can be meaningfully matched. Sleep and day-context records are not connected to pattern cards yet, so the app will not invent a relationship. When matching observations exist, each pattern will show how many observations support it and use language such as “associated with” or “tends to coincide with”.</p>
      </div>
    </section>`;
}
