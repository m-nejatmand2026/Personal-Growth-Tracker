import { $ } from '../core/dom.js';

export function renderSettings() {
  const root = $('#settingsView');
  if (!root) return;

  root.innerHTML = `
    <div class="card">
      <div class="section-head">
        <div>
          <h2>Planning</h2>
          <p>Goals, Minimums and Targets are managed in Plan so planning stays attached to the Goal model rather than a fixed activity list.</p>
        </div>
      </div>
      <div class="small muted">Historical Beta target rows remain preserved in exports, but they no longer drive the runtime experience.</div>
    </div>
    <div class="card">
      <div class="section-head">
        <div>
          <h2>Data ownership</h2>
          <p>Export all records as JSON at any time.</p>
        </div>
      </div>
      <div class="actions"><a class="btn soft" href="/api/export" target="_blank" rel="noopener">Export everything</a></div>
    </div>`;
}
