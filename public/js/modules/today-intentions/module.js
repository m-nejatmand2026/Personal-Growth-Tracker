import { api } from '../../core/api.js';
import { $$, escapeHtml } from '../../core/dom.js';
import { formatMinutes } from '../../core/format.js';
import { toast } from '../../core/toast.js';

function statusLabel(status) {
  return status === 'in_progress' ? 'In progress' : 'Planned';
}

function itemHtml(item) {
  return `<article class="today-intention ${item.status === 'in_progress' ? 'is-active' : ''}">
    <div class="today-intention-main">
      <span class="today-intention-status">${statusLabel(item.status)}</span>
      <strong>${escapeHtml(item.activity_name || item.activity_key)}</strong>
      ${item.subtype ? `<span>${escapeHtml(item.subtype)}</span>` : ''}
      <small>${formatMinutes(item.planned_minutes)} planned${item.note ? ` · ${escapeHtml(item.note)}` : ''}</small>
    </div>
    <div class="today-intention-actions">
      ${item.status === 'planned' ? `<button type="button" class="intent-start" data-intent-start="${item.id}">Start</button>` : ''}
      <button type="button" class="intent-done" data-intent-done="${item.id}">Done</button>
      <button type="button" class="intent-remove" data-intent-remove="${item.id}" aria-label="Remove ${escapeHtml(item.activity_name || item.activity_key)} from Today">×</button>
    </div>
  </article>`;
}

export const todayIntentionsModule = Object.freeze({
  id: 'today-intentions',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  slots: Object.freeze([{ name: 'today-after-capacity', order: 10 }]),

  async load({ date }) {
    const response = await api(`/api/v1/today-intentions?date=${date}`);
    return { items: response.items || [] };
  },

  render({ model }) {
    const items = model?.items || [];
    return `<section class="os-section today-plan-section" id="todayIntentions">
      <div class="os-section-head">
        <div><span class="section-kicker">Today&apos;s plan</span><h2>What you intend to do</h2></div>
        <small>${items.length ? `${items.length} active` : 'Nothing planned yet'}</small>
      </div>
      ${items.length
        ? `<div class="today-intention-list">${items.map(itemHtml).join('')}</div>`
        : `<div class="today-plan-empty"><strong>Build the day as you go.</strong><span>Open Log, choose an activity, then select Plan for today or Doing now.</span></div>`}
    </section>`;
  },

  async create(input) {
    const response = await api('/api/v1/today-intentions', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return response.item;
  },

  async setStatus(id, status) {
    const response = await api(`/api/v1/today-intentions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return response.item;
  },

  async remove(id) {
    await api(`/api/v1/today-intentions/${id}`, { method: 'DELETE' });
  },

  bind({ model, openLogger, reload }) {
    const items = model?.items || [];

    $$('[data-intent-start]').forEach((button) => button.addEventListener('click', async () => {
      try {
        await this.setStatus(Number(button.dataset.intentStart), 'in_progress');
        toast('Marked in progress');
        await reload?.();
      } catch (error) {
        toast(error.message || 'Could not start this item');
      }
    }));

    $$('[data-intent-done]').forEach((button) => button.addEventListener('click', () => {
      const item = items.find((entry) => Number(entry.id) === Number(button.dataset.intentDone));
      if (!item) return;
      void openLogger?.({
        activity_key: item.activity_key,
        activity_name: item.activity_name,
        subtype: item.subtype || '',
        minutes: Number(item.planned_minutes) || 25,
        date: item.occurred_on,
        note: item.note || '',
        entryMode: 'done',
        intentionId: item.id
      });
    }));

    $$('[data-intent-remove]').forEach((button) => button.addEventListener('click', async () => {
      const item = items.find((entry) => Number(entry.id) === Number(button.dataset.intentRemove));
      if (!item || !window.confirm(`Remove “${item.activity_name || item.activity_key}” from Today?`)) return;
      try {
        await this.remove(item.id);
        toast('Removed from Today');
        await reload?.();
      } catch (error) {
        toast(error.message || 'Could not remove this item');
      }
    }));
  }
});
