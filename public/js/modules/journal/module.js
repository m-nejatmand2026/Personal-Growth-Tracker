import { api } from '../../core/api.js';
import { $, $$, escapeHtml } from '../../core/dom.js';
import { toast } from '../../core/toast.js';
import { activateModal } from '../../platform/modal.js';
import { JOURNAL_TEMPLATES } from './prompts.js';

function addDays(dateText, amount) { const d = new Date(`${dateText}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + amount); return d.toISOString().slice(0,10); }
function formatPreviewBody(text, max=220) { const s=String(text||'').replace(/\s+/g,' ').trim(); return s.length>max?`${s.slice(0,max).trim()}…`:s; }
function tagText(tags) { return (tags||[]).join(', '); }
function templateButtons(selected) { return Object.entries(JOURNAL_TEMPLATES).map(([key,v])=>`<button type="button" class="${selected===key?'selected':''}" data-journal-template="${key}">${escapeHtml(v.label)}</button>`).join(''); }
function promptButtons(type) { return (JOURNAL_TEMPLATES[type]||JOURNAL_TEMPLATES.free).prompts.map(p=>`<button type="button" data-journal-prompt="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join(''); }
function entryHtml(entry) { const label=JOURNAL_TEMPLATES[entry.entry_type]?.label||'Journal'; return `<article class="journal-entry-card"><div class="journal-entry-meta"><span>${escapeHtml(entry.occurred_on)}</span><b>${escapeHtml(label)}</b></div><h3>${escapeHtml(entry.title||'Untitled reflection')}</h3><p>${escapeHtml(formatPreviewBody(entry.body))}</p>${(entry.tags||[]).length?`<div class="journal-tags">${entry.tags.map(t=>`<span>#${escapeHtml(t)}</span>`).join('')}</div>`:''}<div class="journal-entry-actions"><button type="button" data-journal-edit="${entry.id}">Edit</button><button type="button" data-journal-delete="${entry.id}">Delete</button></div></article>`; }
function reflectionStreak(items){const days=[...new Set((items||[]).map(item=>item.occurred_on))].sort().reverse();if(!days.length)return 0;let streak=1;for(let i=1;i<days.length;i+=1){const previous=new Date(`${days[i-1]}T12:00:00Z`);const current=new Date(`${days[i]}T12:00:00Z`);if((previous-current)===86400000)streak+=1;else break}return streak}
function editorHtml(entry,defaultDate){
  const type=entry?.entry_type||'free';
  return `<div class="module-modal-backdrop" data-journal-close></div>
  <section class="module-sheet journal-editor" role="dialog" aria-modal="true" aria-labelledby="journalEditorTitle" tabindex="-1">
    <header class="module-sheet-head"><div><h2 id="journalEditorTitle">${entry?.id?'Edit entry':'Write a journal entry'}</h2><p class="gc-sr-only">Write first. Prompts and details are optional.</p></div><button type="button" class="module-sheet-close" data-journal-close aria-label="Close journal editor">×</button></header>
    <form id="journalForm" class="journal-form">
      <label class="journal-field journal-body-field"><span class="gc-sr-only">Your entry</span><textarea id="journalBody" maxlength="20000" required placeholder="Write what’s on your mind…">${escapeHtml(entry?.body||'')}</textarea></label>
      <details class="journal-editor-disclosure journal-prompt-disclosure">
        <summary><strong>Need a prompt?</strong><span aria-hidden="true">⌄</span></summary>
        <div class="journal-disclosure-content">
          <fieldset class="journal-template-fieldset"><legend>Start however you want</legend><div class="journal-template-grid">${templateButtons(type)}</div></fieldset>
          <div class="journal-prompts" id="journalPrompts"><span>Optional prompts</span><div>${promptButtons(type)}</div></div>
        </div>
      </details>
      <details class="journal-editor-disclosure journal-meta-disclosure" ${entry?.id?'open':''}>
        <summary><strong>More details</strong><span aria-hidden="true">⌄</span></summary>
        <div class="journal-disclosure-content">
          <label class="journal-field"><span>Title <small>optional</small></span><input id="journalTitle" maxlength="120" value="${escapeHtml(entry?.title||'')}" placeholder="Title"></label>
          <div class="journal-meta-grid"><label class="journal-field"><span>Date</span><input id="journalDate" type="date" value="${escapeHtml(entry?.occurred_on||defaultDate)}" required></label><label class="journal-field"><span>Tags <small>optional</small></span><input id="journalTags" maxlength="250" value="${escapeHtml(tagText(entry?.tags))}" placeholder="work, travel, idea"></label></div>
        </div>
      </details>
      <details class="journal-editor-disclosure journal-privacy-disclosure">
        <summary><strong>Privacy</strong><span aria-hidden="true">⌄</span></summary>
        <div class="journal-disclosure-content"><p>Reflection stays separate. Journal text is not used by Progress, Insights or AI in this beta.</p></div>
      </details>
      <button type="submit" class="journal-save">${entry?.id?'Save changes':'Save entry'}</button>
    </form>
  </section>`;
}

export const journalModule=Object.freeze({
  id:'journal',contractVersion:1,dependsOn:[],defaultEnabled:true,
  publishes:Object.freeze(['journal.preview-selected']),subscribes:Object.freeze([]),
  slots:Object.freeze([{name:'today-reflection',order:90},{name:'journal-view',order:10}]),
  async list(filters={}){const p=new URLSearchParams();if(filters.from)p.set('from',filters.from);if(filters.to)p.set('to',filters.to);if(filters.q)p.set('q',filters.q);p.set('limit',String(filters.limit||50));return (await api(`/api/v1/journal?${p.toString()}`)).items||[]},
  async create(input){return (await api('/api/v1/journal',{method:'POST',body:JSON.stringify(input)})).item},
  async update(id,input){return (await api(`/api/v1/journal/${id}`,{method:'PUT',body:JSON.stringify(input)})).item},
  async remove(id){await api(`/api/v1/journal/${id}`,{method:'DELETE'})},
  async loadPreview({date}){return {date,items:await this.list({from:date,to:date,limit:3})}},
  renderPreview({model}){const latest=model.items[0];return `<section class="journal-preview os-section" id="journalPreview"><div class="journal-preview-icon" aria-hidden="true">✎</div><div class="journal-preview-copy"><h2>${latest?escapeHtml(latest.title||'Reflection saved today'):'Journal'}</h2><p>${latest?escapeHtml(formatPreviewBody(latest.body,110)):'Write if you want to remember something from today.'}</p></div><div class="journal-preview-actions"><button type="button" data-journal-write="${model.date}">${latest?'Write another':'Write'}</button><button type="button" data-open-journal-view>Open</button></div></section>`},
  async loadView({date,query='',filterDate=''}={}){const from=filterDate||addDays(date,-89);const to=filterDate||date;return {date,query,filterDate,items:await this.list({from,to,q:query||null,limit:100})}},
  renderView({model}){return `<section class="journal-hero journal-action-hero living-journal-hero" aria-labelledby="journalCurrentTitle"><div class="living-page-heading"><h2 id="journalCurrentTitle">Journal</h2><p>Write when there is something you want to remember.</p></div><div class="living-reflection-stats"><div><strong>${model.items.length}</strong><span>entries</span></div><div><strong>${reflectionStreak(model.items)}</strong><span>recent days</span></div></div><button type="button" class="journal-new" data-journal-write="${model.date}">＋ New reflection</button></section>
    <form id="journalSearchForm" class="journal-search"><label class="journal-search-main"><span aria-hidden="true">⌕</span><span class="gc-sr-only">Search</span><input id="journalSearch" value="${escapeHtml(model.query||'')}" aria-label="Search your writing" placeholder="Search your writing"></label><button type="submit">Search</button>${(model.query||model.filterDate)?'<button type="button" id="journalClearFilters">Clear</button>':''}<details class="journal-filter-disclosure" ${model.filterDate?'open':''}><summary>Filter</summary><label><span class="gc-sr-only">Date</span><input id="journalFilterDate" type="date" value="${escapeHtml(model.filterDate||'')}"></label></details></form>
    <details class="journal-trust-disclosure"><summary>Reflection stays separate</summary><div><span>Journal text is not used by Progress, Insights or AI in this beta. Missing a day is not a failure.</span></div></details>
    <section class="journal-list-section"><div class="os-section-head"><div><h2>${model.items.length?'Recent':'A quiet beginning'}</h2></div><small>${model.filterDate?escapeHtml(model.filterDate):'Recent 90 days'}</small></div><div class="journal-entry-list">${model.items.length?model.items.map(entryHtml).join(''):'<div class="journal-empty"><strong>Your reflections will gather here.</strong><span>Write when there is something you want to remember.</span></div>'}</div></section>`},
  bindPreview({model,events,reload}){$$('[data-journal-write]').forEach(b=>b.addEventListener('click',()=>this.openEditor({defaultDate:b.dataset.journalWrite||model.date,reload})));$$('[data-open-journal-view]').forEach(b=>b.addEventListener('click',()=>void events?.publish('journal.preview-selected',{view:'journal'})))},
  bindView({model,rerender}){$$('[data-journal-write]').forEach(b=>b.addEventListener('click',()=>this.openEditor({defaultDate:b.dataset.journalWrite||model.date,reload:rerender})));$$('[data-journal-edit]').forEach(b=>b.addEventListener('click',()=>{const e=model.items.find(x=>Number(x.id)===Number(b.dataset.journalEdit));if(e)this.openEditor({entry:e,defaultDate:e.occurred_on,reload:rerender})}));$$('[data-journal-delete]').forEach(b=>b.addEventListener('click',async()=>{const e=model.items.find(x=>Number(x.id)===Number(b.dataset.journalDelete));if(!e||!window.confirm('Delete this journal entry permanently?'))return;try{await this.remove(e.id);toast('Journal entry deleted');await rerender?.()}catch(error){toast(error.message||'Could not delete journal entry')}}));$('#journalSearchForm')?.addEventListener('submit',async event=>{event.preventDefault();await rerender?.({query:$('#journalSearch').value.trim(),filterDate:$('#journalFilterDate')?.value||''})});$('#journalClearFilters')?.addEventListener('click',async()=>rerender?.({query:'',filterDate:''}))},
  openEditor({entry=null,defaultDate,reload}={}){const host=$('#journalHost');if(!host)return;host.innerHTML=editorHtml(entry,defaultDate);document.body.classList.add('module-sheet-open');let selectedType=entry?.entry_type||'free';let closeModal=()=>{};const close=()=>closeModal();closeModal=activateModal(host,{initialFocus:()=>$('#journalBody'),onClose:()=>{host.innerHTML='';document.body.classList.remove('module-sheet-open')}});host.querySelectorAll('[data-journal-close]').forEach(b=>b.addEventListener('click',close));const renderPrompts=()=>{const h=$('#journalPrompts');if(!h)return;h.innerHTML=`<span>Optional prompts</span><div>${promptButtons(selectedType)}</div>`;h.querySelectorAll('[data-journal-prompt]').forEach(b=>b.addEventListener('click',()=>{const t=$('#journalBody'),p=b.dataset.journalPrompt,prefix=t.value.trim()?'\n\n':'';t.value+=`${prefix}${p}\n`;t.focus();t.setSelectionRange(t.value.length,t.value.length)}))};host.querySelectorAll('[data-journal-template]').forEach(b=>b.addEventListener('click',()=>{selectedType=b.dataset.journalTemplate;host.querySelectorAll('[data-journal-template]').forEach(x=>x.classList.toggle('selected',x===b));renderPrompts()}));renderPrompts();$('#journalForm')?.addEventListener('submit',async event=>{event.preventDefault();const payload={occurred_on:$('#journalDate')?.value||defaultDate,title:$('#journalTitle')?.value.trim()||null,body:$('#journalBody').value.trim(),entry_type:selectedType,tags:($('#journalTags')?.value||'').split(',').map(x=>x.trim()).filter(Boolean)};if(!payload.body)return toast('Write something before saving');try{entry?.id?await this.update(entry.id,payload):await this.create(payload);toast(entry?.id?'Journal entry updated':'Journal entry saved');close();await reload?.()}catch(error){toast(error.message||'Could not save journal entry')}})}
});
