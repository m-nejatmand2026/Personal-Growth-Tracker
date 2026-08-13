import { api } from '../../core/api.js';
import { escapeHtml } from '../../core/dom.js';
import { formatMinutes } from '../../core/format.js';
import { toast } from '../../core/toast.js';

export const ENERGY = Object.freeze([
  Object.freeze(['Anger','Stress','Shock','Surprise','Aroused','Elated']),
  Object.freeze(['Agitated','Irritated','Restless','Energized','Optimistic','Happy']),
  Object.freeze(['Reactive','Worried','Displeased','Pleased','Hopeful','Grateful']),
  Object.freeze(['Hate','Bored','Numb','Comfortable','Satisfied','Neutral']),
  Object.freeze(['Pessimistic','Lonely','Tired','Relaxed','At Ease','Balanced']),
  Object.freeze(['Miserable','Devastated','Empty','Sleepy','Blissful','Composed'])
]);

export function energyScore(row) {
  return row < 3 ? 3 - row : -(row - 2);
}

export function valenceScore(column) {
  return column < 3 ? -(3 - column) : column - 2;
}

function energyClass(row, column) {
  return row < 3
    ? (column < 3 ? 'tl' : 'tr')
    : (column < 3 ? 'bl' : 'br');
}

function energyMap(selected) {
  return `<div class="energy-axis high">↑ High Energy</div>
    <div class="valence"><span>← Negative Feeling</span><span>Positive Feeling →</span></div>
    <div class="energy-grid">${ENERGY.flatMap((row, rowIndex) => row.map((label, columnIndex) => `
      <button type="button" class="energy-cell ${energyClass(rowIndex, columnIndex)} ${selected?.row_idx === rowIndex && selected?.col_idx === columnIndex ? 'selected' : ''}"
        data-wellbeing-energy-cell data-energy-r="${rowIndex}" data-energy-c="${columnIndex}">${escapeHtml(label)}</button>`)).join('')}</div>
    <div class="energy-axis low">↓ Low Energy</div>`;
}

function contextLabel(item) {
  if (!item?.context_key) return 'Not logged';
  return String(item.context_key).replaceAll('_', ' ').replace(/^./, (value) => value.toUpperCase());
}

export const wellbeingModule = Object.freeze({
  id: 'wellbeing',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  slots: Object.freeze([
    { name: 'today-state', order: 10 },
    { name: 'today-details', order: 80 }
  ]),

  async getDay(date) {
    return api(`/api/v1/wellbeing/day?date=${encodeURIComponent(date)}`);
  },

  async listEnergy({ from = null, to = null, limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (limit) params.set('limit', String(limit));
    const response = await api(`/api/v1/wellbeing/energy?${params.toString()}`);
    return response.items || [];
  },

  async recordEnergy(input) {
    const response = await api('/api/v1/wellbeing/energy', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return response.item;
  },

  renderTodayState({ model } = {}) {
    const energy = model?.energy || null;
    const sleep = model?.sleep || null;
    const context = model?.context || null;
    return `<section class="daily-state-grid" data-wellbeing-state aria-label="Daily state">
      <button class="state-card energy-state" type="button" data-open-wellbeing-energy>
        <span class="state-icon" aria-hidden="true">✦</span>
        <div><span>Energy</span><strong>${energy ? escapeHtml(energy.label) : 'Check in'}</strong><small>${energy ? 'Tap to update' : 'How do you feel?'}</small></div>
      </button>
      <div class="state-card"><span class="state-icon sleep-icon" aria-hidden="true">◐</span><div><span>Sleep actual</span><strong>${sleep ? formatMinutes(sleep.minutes) : 'Not logged'}</strong><small>${sleep?.quality ? `Quality ${Number(sleep.quality)}/5` : 'Optional wellbeing observation'}</small></div></div>
      <div class="state-card"><span class="state-icon context-icon" aria-hidden="true">◇</span><div><span>Day context</span><strong>${escapeHtml(contextLabel(context))}</strong><small>${context?.note ? escapeHtml(context.note) : 'Travel, social, recovery and more'}</small></div></div>
    </section>`;
  },

  renderTodayDetails({ model, date } = {}) {
    const selected = model?.energy || null;
    return `<details class="energy-drawer" data-wellbeing-details>
      <summary><span><strong>Energy check-in</strong><small>${selected ? `Current: ${escapeHtml(selected.label)}` : 'Optional daily observation'}</small></span><span>Open map</span></summary>
      <div class="energy-drawer-body">
        <p class="muted energy-help">Choose the state that best matches how you feel. Energy and valence are observations, not performance scores.</p>
        ${energyMap(selected)}
        <div class="energy-result" data-wellbeing-energy-result>${selected ? `<div><span class="small muted">Selected</span><br><strong>${escapeHtml(selected.label)}</strong></div>` : '<span class="muted">Choose one state from the map.</span>'}</div>
        <div class="actions"><input data-wellbeing-energy-note class="note-input" maxlength="500" placeholder="Optional note" value="${escapeHtml(selected?.note || '')}"><button data-wellbeing-energy-save class="btn primary" ${selected ? '' : 'disabled'}>Save check-in</button></div>
      </div>
      <input type="hidden" data-wellbeing-date value="${escapeHtml(date || model?.date || '')}">
    </details>`;
  },

  bindToday({ model, date, reload } = {}) {
    const details = document.querySelector('[data-wellbeing-details]');
    if (!details) return;

    let draft = model?.energy ? { ...model.energy } : null;
    const effectiveDate = date || model?.date || details.querySelector('[data-wellbeing-date]')?.value;
    const result = details.querySelector('[data-wellbeing-energy-result]');
    const note = details.querySelector('[data-wellbeing-energy-note]');
    const save = details.querySelector('[data-wellbeing-energy-save]');

    document.querySelector('[data-open-wellbeing-energy]')?.addEventListener('click', () => {
      details.open = true;
      details.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    details.querySelectorAll('[data-wellbeing-energy-cell]').forEach((button) => {
      button.addEventListener('click', () => {
        const row = Number(button.dataset.energyR);
        const column = Number(button.dataset.energyC);
        draft = {
          occurred_on: effectiveDate,
          label: ENERGY[row][column],
          row_idx: row,
          col_idx: column,
          energy_score: energyScore(row),
          valence_score: valenceScore(column),
          note: note?.value || ''
        };
        details.querySelectorAll('[data-wellbeing-energy-cell]').forEach((cell) => cell.classList.toggle('selected', cell === button));
        if (result) result.innerHTML = `<div><span class="small muted">Selected</span><br><strong>${escapeHtml(draft.label)}</strong></div>`;
        if (save) save.disabled = false;
      });
    });

    save?.addEventListener('click', async () => {
      if (!draft) return;
      draft.note = note?.value?.trim() || null;
      try {
        await this.recordEnergy(draft);
        toast('Energy check-in saved');
        await reload?.();
      } catch (error) {
        toast(error?.message || 'Could not save energy check-in');
      }
    });
  }
});
