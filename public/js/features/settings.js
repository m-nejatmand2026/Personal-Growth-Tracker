import { api } from '../core/api.js';
import { $, escapeHtml } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast } from '../core/toast.js';

export function renderSettings({ reload }) {
  const targets = state.data.targets?.length ? state.data.targets : state.data.week;
  $('#settingsView').innerHTML = `<div class="card"><div class="section-head"><div><h2>Weekly targets</h2><p>Edit the plan without altering historical records.</p></div></div><div id="targetRows">${targets.map((item)=>`<div class="form-row"><strong>${escapeHtml(item.name)}</strong><input type="number" min="0" step="5" value="${item.target_minutes}" data-target="${item.key}" aria-label="${escapeHtml(item.name)} target minutes"><input type="number" min="0" step="5" value="${item.minimum_minutes}" data-minimum="${item.key}" aria-label="${escapeHtml(item.name)} minimum minutes"></div>`).join('')}</div><div class="small muted">Columns: target minutes / good-enough minimum minutes.</div><div class="actions"><button id="saveTargets" class="btn primary">Save targets</button></div></div>
  <div class="card"><div class="section-head"><div><h2>Data ownership</h2><p>Export all records as JSON at any time.</p></div></div><div class="actions"><a class="btn soft" href="/api/export" target="_blank" rel="noopener">Export everything</a></div></div>`;

  $('#saveTargets')?.addEventListener('click', async () => {
    const items = targets.map((item) => ({
      key: item.key,
      target_minutes: Number($(`[data-target="${item.key}"]`).value),
      minimum_minutes: Number($(`[data-minimum="${item.key}"]`).value)
    }));
    try {
      await api('/api/targets', { method: 'PUT', body: JSON.stringify({ items }) });
      toast('Targets updated');
      await reload();
    } catch {
      toast('Preview mode: database not connected');
    }
  });
}
