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
  return `<section class="insights-hero gc-page-header"><div><h2>Evidence is unavailable</h2><p>No summaries were generated. Try again later.</p></div></section>`;
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
    <section class="insights-hero gc-page-header gc-page-header--aside">
      <div><h2>${escapeHtml(stage.label)}</h2><p class="gc-sr-only">${escapeHtml(stage.detail)} Association never means cause.</p></div>
      <div class="insight-readiness-ring" role="img" style="--readiness:${readinessPct}" aria-label="${trackedDays} tracked days so far; ${readinessPct}% toward 21 tracked days"><strong>${trackedDays}</strong><span>tracked days</span></div>
    </section>
    <div class="insight-summary-grid">
      <article class="insight-summary-card"><span>Evidence</span><strong>${escapeHtml(stage.label)}</strong><small class="gc-sr-only">${escapeHtml(stage.detail)}</small></article>
      <article class="insight-summary-card"><span>Energy</span><strong>${energy.length}</strong><small class="gc-sr-only">${energy.length} check-ins. ${energyAverage == null ? 'No average yet.' : `Average recorded energy ${energyAverage.toFixed(1)}.`}</small></article>
      <article class="insight-summary-card"><span>Active days</span><strong>${activityDays}</strong><small class="gc-sr-only">${progress.length} completed progress records.</small></article>
    </div>
    <section class="association-waiting">
      <div class="association-icon" aria-hidden="true">↔</div>
      <div><h2>No matched patterns yet</h2><p>Keep logging. Patterns appear only when matching observations are strong enough.</p><p class="gc-sr-only">Not enough matching wellbeing data yet.</p></div>
    </section>
    <details class="insight-method-disclosure os-section">
      <summary><strong>How insights work</strong><span>${trackedDays} days</span></summary>
      <div class="insight-method-content">
        <p>Only observations that can be meaningfully matched are compared. Any future pattern must say how many observations support it and describe what is associated with an outcome. More history can strengthen an association; it does not prove cause.</p>
        <div class="insight-stage-grid">${thresholdHtml(trackedDays)}</div>
      </div>
    </details>`;
}
