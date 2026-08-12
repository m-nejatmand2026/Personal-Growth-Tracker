import { $ } from '../core/dom.js';
import { state } from '../core/state.js';

export function renderInsights() {
  const root = $('#insightsView');
  if (!root) return;
  const weeklySessions = (state.data.sessions || []).length;
  const hasEnergy = Boolean(state.selectedEnergy);

  root.innerHTML = `
    <div class="page-lead">
      <p class="eyebrow">Insights</p>
      <h2>Patterns need enough data</h2>
      <p>Growth Compass will describe associations only when there is enough evidence. It will not invent conclusions from a few days.</p>
    </div>

    <div class="metric-grid progress-metrics">
      <div class="metric"><span class="small muted">Sessions available this week</span><strong>${weeklySessions}</strong></div>
      <div class="metric"><span class="small muted">Energy today</span><strong class="metric-copy">${hasEnergy ? 'Recorded' : 'Not recorded'}</strong></div>
    </div>

    <section class="card insight-empty">
      <div class="insight-symbol">✦</div>
      <h2>Collecting useful evidence</h2>
      <p class="muted">Early data is shown as data collection, not as a claim. Descriptive summaries and associations will appear only after the minimum observation thresholds are met.</p>
      <div class="insight-thresholds">
        <div><strong>0–6</strong><span>collecting data</span></div>
        <div><strong>7–20</strong><span>descriptive only</span></div>
        <div><strong>21–41</strong><span>early associations</span></div>
        <div><strong>42+</strong><span>stronger association summaries</span></div>
      </div>
    </section>
  `;
}
