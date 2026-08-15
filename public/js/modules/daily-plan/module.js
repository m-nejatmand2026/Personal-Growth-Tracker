import { api } from '../../core/api.js';
import { $, $$, escapeHtml } from '../../core/dom.js';
import { formatMinutes } from '../../core/format.js';
import { toast } from '../../core/toast.js';
import { activateModal } from '../../platform/modal.js';

function addDays(dateText, amount) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function itemMeta(item) {
  const parts = [];
  if (item.activity_label) parts.push(item.activity_label);
  if (item.subtype && item.subtype !== item.title) parts.push(item.subtype);
  if (item.planned_time) parts.push(item.planned_time);
  if (item.planned_minutes) parts.push(`${formatMinutes(item.planned_minutes)} planned`);
  return parts.join(' · ');
}

function itemHtml(item) {
  const status = item.status === 'in_progress' ? 'Doing now' : 'Planned';
  const meta = itemMeta(item);
  return `<article class="daily-plan-item ${item.status === 'in_progress' ? 'is-active' : ''}">
    <button type="button" class="daily-plan-check" data-plan-done="${item.id}" aria-label="Mark ${escapeHtml(item.title)} done">✓</button>
    <div class="daily-plan-main"><span class="daily-plan-status">${status}</span><strong>${escapeHtml(item.title)}</strong>${meta ? `<span>${escapeHtml(meta)}</span>` : ''}${item.note ? `<small>${escapeHtml(item.note)}</small>` : ''}</div>
    <div class="daily-plan-actions">${item.status === 'planned' ? `<button type="button" data-plan-start="${item.id}">Start</button>` : ''}<button type="button" data-plan-review="${item.id}">Plans changed?</button><button type="button" data-plan-edit="${item.id}">Edit</button></div>
  </article>`;
}

function sanctuaryTime(item) {
  if (!item.planned_time) return '';
  const [hours, minutes] = item.planned_time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return item.planned_time;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function sanctuaryItemHtml(item, index) {
  const active = item.status === 'in_progress';
  const meta = item.note || item.activity_label || (item.planned_minutes ? `${formatMinutes(item.planned_minutes)} planned` : '');
  return `<article class="sanctuary-agenda-item ${active ? 'is-active' : ''}" data-agenda-index="${index}">
    <button type="button" class="daily-plan-check sanctuary-agenda-check" data-plan-done="${item.id}" aria-label="Mark ${escapeHtml(item.title)} done"><span aria-hidden="true">${active ? '●' : ''}</span></button>
    <div class="sanctuary-agenda-copy"><div class="sanctuary-agenda-title"><strong>${escapeHtml(item.title)}</strong>${item.planned_time ? `<time datetime="${escapeHtml(item.planned_time)}">${escapeHtml(sanctuaryTime(item))}</time>` : ''}</div>${meta ? `<p>${escapeHtml(meta)}</p>` : ''}
      <div class="daily-plan-actions sanctuary-agenda-actions">${item.status === 'planned' ? `<button type="button" data-plan-start="${item.id}"><span aria-hidden="true">▷</span> Start</button>` : ''}<button type="button" data-plan-review="${item.id}">Plans changed?</button><button type="button" data-plan-edit="${item.id}" aria-label="Edit ${escapeHtml(item.title)}">Edit</button></div>
    </div>
  </article>`;
}

function sanctuaryPanelHtml(model) {
  const items = model.today || [];
  const focus = items.find((item) => item.status === 'in_progress') || items[0] || null;
  return `<section class="daily-plan-sanctuary" id="dailyPlanSection" aria-labelledby="agendaTitle">
    ${focus ? `<article class="sanctuary-focus-card"><div class="sanctuary-focus-copy"><p><span aria-hidden="true">⊙</span> Primary Focus</p><h3>${escapeHtml(focus.title)}</h3>${focus.note || focus.activity_label ? `<div>${escapeHtml(focus.note || focus.activity_label)}</div>` : ''}</div><button type="button" class="sanctuary-focus-action" data-plan-start="${focus.id}" ${focus.status === 'in_progress' ? 'disabled' : ''}><span aria-hidden="true">▷</span>${focus.status === 'in_progress' ? 'In Focus' : 'Start Focus'}</button></article>` : `<article class="sanctuary-focus-card is-empty"><div class="sanctuary-focus-copy"><p><span aria-hidden="true">⊙</span> Primary Focus</p><h3>Choose what matters most today</h3><div>Keep the day intentional and light.</div></div><button type="button" class="sanctuary-focus-action" data-plan-add="${model.date}"><span aria-hidden="true">＋</span>Add Focus</button></article>`}
    <header class="sanctuary-agenda-head"><h3 id="agendaTitle">Agenda</h3><span>${items.length} ${items.length === 1 ? 'Task' : 'Tasks'}</span></header>
    <div class="sanctuary-agenda-list">${items.length ? items.map(sanctuaryItemHtml).join('') : `<div class="daily-plan-empty sanctuary-agenda-empty"><strong>A clear day.</strong><span>Add only what genuinely matters.</span></div>`}</div>
  </section>`;
}

function panelHtml(items, date, label, hidden = false) {
  return `<div class="daily-plan-panel" data-plan-panel="${date}" ${hidden ? 'hidden' : ''}>
    ${items.length ? `<div class="daily-plan-list">${items.map(itemHtml).join('')}</div>` : `<div class="daily-plan-empty"><strong>No ${label.toLowerCase()} items yet.</strong><span>Add only what genuinely matters. Unfinished items do not become debt tomorrow.</span></div>`}
    <button type="button" class="daily-plan-add" data-plan-add="${date}">＋ Add to ${label}</button>
  </div>`;
}

function editorHtml(item, defaultDate, todayDate) {
  const tomorrow = addDays(todayDate, 1);
  const date = item?.planned_for || defaultDate || todayDate;
  return `<div class="module-modal-backdrop" data-daily-plan-close></div>
    <section class="module-sheet daily-plan-editor" role="dialog" aria-modal="true" aria-labelledby="dailyPlanEditorTitle" tabindex="-1">
      <header class="module-sheet-head"><div><span class="section-kicker">Daily plan</span><h2 id="dailyPlanEditorTitle">${item?.id ? 'Edit plan item' : 'Add a short-term plan'}</h2></div><button type="button" class="module-sheet-close" data-daily-plan-close aria-label="Close">×</button></header>
      <form id="dailyPlanForm" class="daily-plan-form">
        <label class="daily-plan-field"><span>What do you want to do?</span><input id="dailyPlanTitle" maxlength="160" required autocomplete="off" value="${escapeHtml(item?.title || '')}" placeholder="e.g. Evening walk, call a friend, prepare a presentation"></label>
        <fieldset class="day-choice-fieldset"><legend>When?</legend><div class="day-choice-grid"><button type="button" data-plan-date-preset="${todayDate}" class="${date === todayDate ? 'selected' : ''}">Today</button><button type="button" data-plan-date-preset="${tomorrow}" class="${date === tomorrow ? 'selected' : ''}">Tomorrow</button></div><input id="dailyPlanDate" type="date" value="${escapeHtml(date)}" required aria-label="Plan date"></fieldset>
        <details class="daily-plan-details" ${item && (item.planned_time || item.planned_minutes || item.note) ? 'open' : ''}><summary>Optional details</summary><div class="daily-plan-details-grid"><label class="daily-plan-field"><span>Time</span><input id="dailyPlanTime" type="time" value="${escapeHtml(item?.planned_time || '')}"></label><label class="daily-plan-field"><span>Expected duration</span><div class="inline-unit"><input id="dailyPlanMinutes" type="number" min="1" max="1440" inputmode="numeric" value="${item?.planned_minutes || ''}" placeholder="optional"><b>min</b></div></label><label class="daily-plan-field full"><span>Note</span><textarea id="dailyPlanNote" maxlength="500" placeholder="Optional context">${escapeHtml(item?.note || '')}</textarea></label></div></details>
        <p class="daily-plan-principle">This is a plan, not completed Progress. It will never roll into the next day automatically.</p>
        <button type="submit" class="daily-plan-save">${item?.id ? 'Save changes' : 'Add to plan'}</button>
        ${item?.id ? '<button type="button" class="daily-plan-dismiss" id="dailyPlanDismiss">Drop from plan</button>' : ''}
      </form>
    </section>`;
}

function recoveryHtml(item) {
  const nextDate = addDays(item.planned_for, 1);
  const plannedMinutes = Number(item.planned_minutes) || 0;
  const reduceMax = plannedMinutes > 1 ? plannedMinutes - 1 : 1440;
  return `<div class="module-modal-backdrop" data-daily-plan-recovery-close></div>
    <section class="module-sheet daily-plan-recovery" role="dialog" aria-modal="true" aria-labelledby="dailyPlanRecoveryTitle" tabindex="-1">
      <header class="module-sheet-head"><div><span class="section-kicker">Plans changed?</span><h2 id="dailyPlanRecoveryTitle">What should happen to “${escapeHtml(item.title)}”?</h2></div><button type="button" class="module-sheet-close" data-daily-plan-recovery-close aria-label="Close">×</button></header>
      <p class="daily-plan-recovery-copy">Nothing moves automatically and nothing becomes debt. Choose what fits now.</p>
      <div class="daily-plan-recovery-grid">
        <button type="button" class="daily-plan-recovery-choice" id="dailyPlanKeep"><strong>Keep</strong><span>Leave it exactly where it is.</span></button>
        <div class="daily-plan-recovery-choice recovery-choice-form"><div><strong>Move</strong><span>Choose a different day.</span></div><input id="dailyPlanMoveDate" type="date" value="${escapeHtml(nextDate)}" aria-label="Move plan item to date"><button type="button" id="dailyPlanMove">Move</button></div>
        <div class="daily-plan-recovery-choice recovery-choice-form"><div><strong>Reduce</strong><span>${plannedMinutes > 1 ? `Current plan: ${formatMinutes(plannedMinutes)}. Choose a smaller duration.` : 'Add a smaller expected duration that feels more realistic.'}</span></div><div class="inline-unit"><input id="dailyPlanReduceMinutes" type="number" min="1" max="${reduceMax}" inputmode="numeric" placeholder="minutes" aria-label="Reduced expected duration"><b>min</b></div><button type="button" id="dailyPlanReduce">Reduce</button></div>
        <button type="button" class="daily-plan-recovery-choice" id="dailyPlanComplete"><strong>Complete</strong><span>${item.activity_key ? 'Confirm what actually happened before recording Progress.' : 'Mark this generic plan item complete.'}</span></button>
        <button type="button" class="daily-plan-recovery-choice is-drop" id="dailyPlanDrop"><strong>Drop</strong><span>Remove it from the active plan without creating Progress.</span></button>
      </div>
    </section>`;
}

export const dailyPlanModule = Object.freeze({
  id: 'daily-plan',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  publishes: Object.freeze(['daily-plan.completion-selected']),
  subscribes: Object.freeze([]),
  slots: Object.freeze([{ name: 'today-after-capacity', order: 10 }]),

  async load({ date }) {
    const tomorrow = addDays(date, 1);
    const [a, b] = await Promise.all([
      api(`/api/v1/daily-plan?date=${date}`),
      api(`/api/v1/daily-plan?date=${tomorrow}`)
    ]);
    return { date, tomorrow, today: a.items || [], tomorrowItems: b.items || [] };
  },

  render({ model, variant = 'default' }) {
    if (variant === 'today-sanctuary') return sanctuaryPanelHtml(model);
    const total = model.today.length + model.tomorrowItems.length;
    return `<section class="os-section daily-plan-section" id="dailyPlanSection"><div class="os-section-head daily-plan-head"><div><span class="section-kicker">Short-term plan</span><h2>Today & tomorrow</h2></div><small>${total ? `${total} active` : 'Plan lightly'}</small></div><div class="daily-plan-tabs" role="tablist" aria-label="Daily plan date"><button type="button" class="active" role="tab" aria-selected="true" data-plan-tab="${model.date}">Today <b>${model.today.length}</b></button><button type="button" role="tab" aria-selected="false" data-plan-tab="${model.tomorrow}">Tomorrow <b>${model.tomorrowItems.length}</b></button></div>${panelHtml(model.today, model.date, 'Today')}${panelHtml(model.tomorrowItems, model.tomorrow, 'Tomorrow', true)}</section>`;
  },

  async create(input) {
    return (await api('/api/v1/daily-plan', { method: 'POST', body: JSON.stringify(input) })).item;
  },

  async update(id, input) {
    return (await api(`/api/v1/daily-plan/${id}`, { method: 'PUT', body: JSON.stringify(input) })).item;
  },

  async setStatus(id, status) {
    return this.update(id, { status });
  },

  bind({ model, events, reload }) {
    const host = $('#dailyPlanHost');
    const allItems = [...model.today, ...model.tomorrowItems];

    $$('[data-plan-tab]').forEach((button) => button.addEventListener('click', () => {
      const date = button.dataset.planTab;
      $$('[data-plan-tab]').forEach((tab) => {
        const on = tab === button;
        tab.classList.toggle('active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      $$('[data-plan-panel]').forEach((panel) => { panel.hidden = panel.dataset.planPanel !== date; });
    }));

    const completeItem = async (item) => {
      if (!item) return;
      if (item.activity_key) {
        void events?.publish('daily-plan.completion-selected', {
          activity_key: item.activity_key,
          activity_name: item.activity_label || item.activity_key,
          subtype: item.subtype || '',
          minutes: Number(item.planned_minutes) || 25,
          date: item.planned_for,
          note: item.note || '',
          entryMode: 'done',
          dailyPlanId: item.id
        });
        return;
      }
      try {
        await this.setStatus(item.id, 'completed');
        toast('Marked complete');
        await reload?.();
      } catch (error) {
        toast(error.message || 'Could not complete this item');
      }
    };

    const openEditor = (item = null, date = model.date) => {
      if (!host) return;
      host.innerHTML = editorHtml(item, date, model.date);
      document.body.classList.add('module-sheet-open');
      let closeModal = () => {};
      const close = () => closeModal();
      closeModal = activateModal(host, {
        initialFocus: () => $('#dailyPlanTitle'),
        onClose: () => {
          host.innerHTML = '';
          document.body.classList.remove('module-sheet-open');
        }
      });
      host.querySelectorAll('[data-daily-plan-close]').forEach((node) => node.addEventListener('click', close));
      host.querySelectorAll('[data-plan-date-preset]').forEach((button) => button.addEventListener('click', () => {
        $('#dailyPlanDate').value = button.dataset.planDatePreset;
        host.querySelectorAll('[data-plan-date-preset]').forEach((node) => node.classList.toggle('selected', node === button));
      }));
      $('#dailyPlanForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const minutes = $('#dailyPlanMinutes').value;
        const payload = {
          planned_for: $('#dailyPlanDate').value,
          title: $('#dailyPlanTitle').value.trim(),
          planned_time: $('#dailyPlanTime').value || null,
          planned_minutes: minutes ? Number(minutes) : null,
          note: $('#dailyPlanNote').value.trim() || null
        };
        if (!payload.title) return toast('Add a short title');
        try {
          item?.id
            ? await this.update(item.id, payload)
            : await this.create({ ...payload, status: 'planned', source: 'manual' });
          toast(item?.id ? 'Plan item updated' : 'Added to your plan');
          close();
          await reload?.();
        } catch (error) {
          toast(error.message || 'Could not save plan item');
        }
      });
      $('#dailyPlanDismiss')?.addEventListener('click', async () => {
        try {
          await this.setStatus(item.id, 'dismissed');
          toast('Dropped from active plan');
          close();
          await reload?.();
        } catch (error) {
          toast(error.message || 'Could not drop plan item');
        }
      });
    };

    const openRecovery = (item) => {
      if (!host || !item) return;
      host.innerHTML = recoveryHtml(item);
      document.body.classList.add('module-sheet-open');
      let closeModal = () => {};
      const close = () => closeModal();
      closeModal = activateModal(host, {
        initialFocus: () => $('#dailyPlanKeep'),
        onClose: () => {
          host.innerHTML = '';
          document.body.classList.remove('module-sheet-open');
        }
      });
      host.querySelectorAll('[data-daily-plan-recovery-close]').forEach((node) => node.addEventListener('click', close));
      $('#dailyPlanKeep')?.addEventListener('click', close);
      $('#dailyPlanMove')?.addEventListener('click', async () => {
        const plannedFor = $('#dailyPlanMoveDate')?.value || '';
        if (!plannedFor) return toast('Choose the day you want to move this to');
        try {
          await this.update(item.id, { planned_for: plannedFor });
          toast('Plan item moved');
          close();
          await reload?.();
        } catch (error) {
          toast(error.message || 'Could not move plan item');
        }
      });
      $('#dailyPlanReduce')?.addEventListener('click', async () => {
        const plannedMinutes = Number($('#dailyPlanReduceMinutes')?.value || 0);
        const currentMinutes = Number(item.planned_minutes) || 0;
        if (!Number.isInteger(plannedMinutes) || plannedMinutes < 1 || plannedMinutes > 1440) return toast('Choose a duration from 1–1440 minutes');
        if (currentMinutes > 1 && plannedMinutes >= currentMinutes) return toast('Choose a smaller duration to reduce this plan');
        try {
          await this.update(item.id, { planned_minutes: plannedMinutes });
          toast('Plan reduced');
          close();
          await reload?.();
        } catch (error) {
          toast(error.message || 'Could not reduce plan item');
        }
      });
      $('#dailyPlanComplete')?.addEventListener('click', async () => {
        close();
        await completeItem(item);
      });
      $('#dailyPlanDrop')?.addEventListener('click', async () => {
        try {
          await this.setStatus(item.id, 'dismissed');
          toast('Dropped from active plan');
          close();
          await reload?.();
        } catch (error) {
          toast(error.message || 'Could not drop plan item');
        }
      });
    };

    $$('[data-plan-add]').forEach((button) => button.addEventListener('click', () => openEditor(null, button.dataset.planAdd)));
    $$('[data-plan-edit]').forEach((button) => button.addEventListener('click', () => {
      const item = allItems.find((candidate) => Number(candidate.id) === Number(button.dataset.planEdit));
      if (item) openEditor(item, item.planned_for);
    }));
    $$('[data-plan-review]').forEach((button) => button.addEventListener('click', () => {
      const item = allItems.find((candidate) => Number(candidate.id) === Number(button.dataset.planReview));
      if (item) openRecovery(item);
    }));
    $$('[data-plan-start]').forEach((button) => button.addEventListener('click', async () => {
      try {
        await this.setStatus(Number(button.dataset.planStart), 'in_progress');
        toast('Marked as doing now');
        await reload?.();
      } catch (error) {
        toast(error.message || 'Could not start this item');
      }
    }));
    $$('[data-plan-done]').forEach((button) => button.addEventListener('click', async () => {
      const item = allItems.find((candidate) => Number(candidate.id) === Number(button.dataset.planDone));
      await completeItem(item);
    }));
  }
});
