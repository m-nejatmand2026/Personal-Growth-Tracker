export function legacyPlanHtml() {
  return `<div class="card nested-card compass-empty">
    <div class="section-head">
      <div>
        <h2>Compass</h2>
        <p>Long-term direction, not a contract.</p>
      </div>
    </div>
    <p>Your current Areas and Goals are the source of truth for direction in Version 1 Beta. Dedicated long-range Compass editing will build on those generic records rather than a fixed personal roadmap.</p>
  </div>`;
}

export function bindLegacyPlan() {
  // Compatibility no-op while the Plan composition surface keeps this adapter.
}
