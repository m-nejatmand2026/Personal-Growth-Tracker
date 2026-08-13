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
    <div class="daily-plan-actions">${item.status === 'planned' ? `<button type="button" data-plan-start="${item.id}">Start</button>` : ''}<button type="button" data-plan-edit="${item.id}">Edit</button></div>
  </article>`;
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
        <label class="daily-plan-field"><span>What do you want to do?</span><input id="dailyPlanTitle" maxlength="160" required autocomplete="off" value="${escapeHtml(item?.title || '')}" placeholder="e.g. Back workout, call Mum, prepare German lesson"></label>
        <fieldset class="day-choice-fieldset"><legend>When?</legend><div class="day-choice-grid"><button type="button" data-plan-date-preset="${todayDate}" class="${date === todayDate ? 'selected' : ''}">Today</button><button type="button" data-plan-date-preset="${tomorrow}" class="${date === tomorrow ? 'selected' : ''}">Tomorrow</button></div><input id="dailyPlanDate" type="date" value="${escapeHtml(date)}" required aria-label="Plan date"></fieldset>
        <details class="daily-plan-details" ${item && (item.planned_time || item.planned_minutes || item.note) ? 'open' : ''}><summary>Optional details</summary><div class="daily-plan-details-grid"><label class="daily-plan-field"><span>Time</span><input id="dailyPlanTime" type="time" value="${escapeHtml(item?.planned_time || '')}"></label><label class="daily-plan-field"><span>Expected duration</span><div class="inline-unit"><input id="dailyPlanMinutes" type="number" min="1" max="1440" inputmode="numeric" value="${item?.planned_minutes || ''}" placeholder="optional"><b>min</b></div></label><label class="daily-plan-field full"><span>Note</span><textarea id="dailyPlanNote" maxlength="500" placeholder="Optional context">${escapeHtml(item?.note || '')}</textarea></label></div></details>
        <p class="daily-plan-principle">This is a plan, not completed progress. It will never roll into the next day automatically.</p>
        <button type="submit" class="daily-plan-save">${item?.id ? 'Save changes' : 'Add to plan'}</button>
        ${item?.id ? '<button type="button" class="daily-plan-dismiss" id="dailyPlanDismiss">Remove from this day</button>' : ''}
      </form>
    </section>`;
}

export const dailyPlanModule = Object.freeze({
  id: 'daily-plan', contractVersion: 1, dependsOn: [], defaultEnabled: true,
  publishes: Object.freeze(['daily-plan.completion-selected']),
  subscribes: Object.freeze([]),
  slots: Object.freeze([{ name: 'today-after-capacity', order: 10 }]),

  async load({ date }) {
    const tomorrow = addDays(date, 1);
    const [a,b] = await Promise.all([api(`/api/v1/daily-plan?date=${date}`), api(`/api/v1/daily-plan?date=${tomorrow}`)]);
    return { date, tomorrow, today: a.items || [], tomorrowItems: b.items || [] };
  },
  render({ model }) {
    const total = model.today.length + model.tomorrowItems.length;
    return `<section class="os-section daily-plan-section" id="dailyPlanSection"><div class="os-section-head daily-plan-head"><div><span class="section-kicker">Short-term plan</span><h2>Today & tomorrow</h2></div><small>${total ? `${total} active` : 'Plan lightly'}</small></div><div class="daily-plan-tabs" role="tablist" aria-label="Daily plan date"><button type="button" class="active" role="tab" aria-selected="true" data-plan-tab="${model.date}">Today <b>${model.today.length}</b></button><button type="button" role="tab" aria-selected="false" data-plan-tab="${model.tomorrow}">Tomorrow <b>${model.tomorrowItems.length}</b></button></div>${panelHtml(model.today, model.date, 'Today')}${panelHtml(model.tomorrowItems, model.tomorrow, 'Tomorrow', true)}</section>`;
  },
  async create(input) { return (await api('/api/v1/daily-plan',{method:'POST',body:JSON.stringify(input)})).item; },
  async update(id,input) { return (await api(`/api/v1/daily-plan/${id}`,{method:'PUT',body:JSON.stringify(input)})).item; },
  async setStatus(id,status) { return this.update(id,{status}); },

  bind({ model, events, reload }) {
    const host = $('#dailyPlanHost');
    const allItems = [...model.today, ...model.tomorrowItems];
    $$('[data-plan-tab]').forEach(button => button.addEventListener('click', () => {
      const date = button.dataset.planTab;
      $$('[data-plan-tab]').forEach(tab => { const on = tab === button; tab.classList.toggle('active',on); tab.setAttribute('aria-selected',on?'true':'false'); });
      $$('[data-plan-panel]').forEach(panel => { panel.hidden = panel.dataset.planPanel !== date; });
    }));

    const openEditor = (item=null,date=model.date) => {
      if (!host) return;
      host.innerHTML = editorHtml(item,date,model.date); document.body.classList.add('module-sheet-open');
      let closeModal=()=>{}; const close=()=>closeModal();
      closeModal=activateModal(host,{initialFocus:()=>$('#dailyPlanTitle'),onClose:()=>{host.innerHTML='';document.body.classList.remove('module-sheet-open');}});
      host.querySelectorAll('[data-daily-plan-close]').forEach(x=>x.addEventListener('click',close));
      host.querySelectorAll('[data-plan-date-preset]').forEach(button=>button.addEventListener('click',()=>{$('#dailyPlanDate').value=button.dataset.planDatePreset;host.querySelectorAll('[data-plan-date-preset]').forEach(x=>x.classList.toggle('selected',x===button));}));
      $('#dailyPlanForm')?.addEventListener('submit',async event=>{event.preventDefault();const minutes=$('#dailyPlanMinutes').value;const payload={planned_for:$('#dailyPlanDate').value,title:$('#dailyPlanTitle').value.trim(),planned_time:$('#dailyPlanTime').value||null,planned_minutes:minutes?Number(minutes):null,note:$('#dailyPlanNote').value.trim()||null};if(!payload.title)return toast('Add a short title');try{item?.id?await this.update(item.id,payload):await this.create({...payload,status:'planned',source:'manual'});toast(item?.id?'Plan item updated':'Added to your plan');close();await reload?.();}catch(error){toast(error.message||'Could not save plan item');}});
      $('#dailyPlanDismiss')?.addEventListener('click',async()=>{try{await this.setStatus(item.id,'dismissed');toast('Removed from this day');close();await reload?.();}catch(error){toast(error.message||'Could not remove plan item');}});
    };

    $$('[data-plan-add]').forEach(button=>button.addEventListener('click',()=>openEditor(null,button.dataset.planAdd)));
    $$('[data-plan-edit]').forEach(button=>button.addEventListener('click',()=>{const item=allItems.find(x=>Number(x.id)===Number(button.dataset.planEdit));if(item)openEditor(item,item.planned_for);}));
    $$('[data-plan-start]').forEach(button=>button.addEventListener('click',async()=>{try{await this.setStatus(Number(button.dataset.planStart),'in_progress');toast('Marked as doing now');await reload?.();}catch(error){toast(error.message||'Could not start this item');}}));
    $$('[data-plan-done]').forEach(button=>button.addEventListener('click',async()=>{const item=allItems.find(x=>Number(x.id)===Number(button.dataset.planDone));if(!item)return;if(item.activity_key){void events?.publish('daily-plan.completion-selected',{activity_key:item.activity_key,activity_name:item.activity_label||item.activity_key,subtype:item.subtype||'',minutes:Number(item.planned_minutes)||25,date:item.planned_for,note:item.note||'',entryMode:'done',dailyPlanId:item.id});return;}try{await this.setStatus(item.id,'completed');toast('Marked done');await reload?.();}catch(error){toast(error.message||'Could not complete this item');}}));
  }
});
