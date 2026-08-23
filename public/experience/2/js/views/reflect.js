import { journalCapability } from '../capabilities/journal.js';
import { loadProgress } from './progress.js';
import { loadInsights } from './insights.js';

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function todayKey(){const now=new Date();const offset=now.getTimezoneOffset()*60000;return new Date(now.getTime()-offset).toISOString().slice(0,10);}
function addDays(dateText,amount){const date=new Date(`${dateText}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
function minutesLabel(value){const minutes=Math.max(0,Math.round(Number(value)||0));const hours=Math.floor(minutes/60),rest=minutes%60;if(!hours)return`${rest}m`;if(!rest)return`${hours}h`;return`${hours}h ${rest}m`;}
function tagsOf(item){try{return Array.isArray(item.tags)?item.tags:JSON.parse(item.tags_json||'[]');}catch{return[];}}

export async function loadReflect(){
  const [journal,progress,insights]=await Promise.all([
    journalCapability.list({limit:20}),
    loadProgress(),
    loadInsights()
  ]);
  return {journal:journal.items||[],progress,insights};
}

function recentEntry(item){return `<button type="button" class="reflect-entry" data-reflect-open-journal><span>${escapeHtml(item.occurred_on)}</span><strong>${escapeHtml(item.title||'Untitled reflection')}</strong><p>${escapeHtml(String(item.body||'').slice(0,150))}${String(item.body||'').length>150?'…':''}</p></button>`;}
function weekFacts(model){const today=todayKey(),from=addDays(today,-6);const items=(model.progress?.items||[]).filter(item=>item.occurred_on>=from&&item.occurred_on<=today);const minutes=items.reduce((sum,item)=>sum+Math.max(0,Number(item.minutes)||0),0);const activeDays=new Set(items.map(item=>item.occurred_on)).size;const energy=(model.insights?.energy||[]).filter(item=>item.occurred_on>=from&&item.occurred_on<=today);return {today,from,items,minutes,activeDays,energy};}
function monthlyFacts(model){const today=todayKey(),from=addDays(today,-29);const items=(model.progress?.items||[]).filter(item=>item.occurred_on>=from&&item.occurred_on<=today);const minutes=items.reduce((sum,item)=>sum+Math.max(0,Number(item.minutes)||0),0);const energy=(model.insights?.energy||[]).filter(item=>item.occurred_on>=from&&item.occurred_on<=today);return {today,from,items,minutes,energy};}

function weekVisual(facts){
  const cells=[];
  for(let offset=0;offset<7;offset+=1){const date=addDays(facts.from,offset);const count=facts.items.filter(item=>item.occurred_on===date).length;const checkins=facts.energy.filter(item=>item.occurred_on===date).length;const strength=Math.min(28,(count*7)+(checkins*5));const label=new Intl.DateTimeFormat(undefined,{weekday:'short',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));cells.push(`<span class="reflect-period-day${count||checkins?' has-record':''}" style="--period-strength:${strength}" title="${escapeHtml(`${label}: ${count} progress records, ${checkins} check-ins`)}"></span>`);}return `<div class="reflect-period-visual" aria-label="Seven-day activity strip">${cells.join('')}</div>`;
}
function monthVisual(facts){
  const cells=[];for(let offset=0;offset<30;offset+=1){const date=addDays(facts.from,offset);const count=facts.items.filter(item=>item.occurred_on===date).length;const checkins=facts.energy.filter(item=>item.occurred_on===date).length;const strength=Math.min(70,(count*16)+(checkins*10));cells.push(`<span class="reflect-month-day${count||checkins?' has-record':''}" style="--period-strength:${strength}" title="${escapeHtml(`${date}: ${count} progress records, ${checkins} check-ins`)}"></span>`);}return `<div class="reflect-month-grid" aria-label="Thirty-day activity map">${cells.join('')}</div>`;
}
function periodStats(records,minutes,checkins){return `<dl class="reflect-period-stats"><div><dt>Records</dt><dd>${records}</dd></div><div><dt>Time</dt><dd>${minutesLabel(minutes)}</dd></div><div><dt>Check-ins</dt><dd>${checkins}</dd></div></dl>`;}

export function renderReflect(model){
  const weekly=weekFacts(model),monthly=monthlyFacts(model);
  const reviews=model.journal.filter(item=>tagsOf(item).some(tag=>tag==='weekly-review'||tag==='monthly-review'));
  const ordinary=model.journal.filter(item=>!tagsOf(item).some(tag=>tag==='weekly-review'||tag==='monthly-review'));
  return `<div class="composition-view reflect-view">
    <header class="composition-header reflect-header">
      <div><p class="eyebrow">Reflect</p><h2 class="editorial-statement">What have you learned?</h2><p>Look back, then choose forward.</p></div>
      <button type="button" class="primary-button" data-reflect-open-journal>Write</button>
    </header>
    <div class="reflect-review-grid">
      <section class="reflect-review-card">
        <p class="eyebrow">7 days</p><h3>Review this week.</h3>
        ${weekVisual(weekly)}
        ${periodStats(weekly.items.length,weekly.minutes,weekly.energy.length)}
        <button type="button" class="secondary-button" data-reflect-review="weekly">Weekly review</button>
      </section>
      <section class="reflect-review-card">
        <p class="eyebrow">30 days</p><h3>Review this month.</h3>
        ${monthVisual(monthly)}
        ${periodStats(monthly.items.length,monthly.minutes,monthly.energy.length)}
        <button type="button" class="secondary-button" data-reflect-review="monthly">Monthly review</button>
      </section>
    </div>
    <section class="composition-panel reflect-loop" aria-label="Reflection loop">
      <ol><li><span>01</span><strong>See</strong><p>Facts first.</p></li><li><span>02</span><strong>Name</strong><p>Your meaning.</p></li><li><span>03</span><strong>Adjust</strong><p>One choice.</p></li></ol>
    </section>
    <section class="reflect-history">
      <div class="composition-section-heading"><div><p class="eyebrow">Recent</p><h3>Your own words</h3></div><button type="button" class="ghost-button" data-reflect-open-journal>Journal</button></div>
      ${ordinary.length?`<div class="reflect-entry-list">${ordinary.slice(0,4).map(recentEntry).join('')}</div>`:'<div class="reflect-empty"><strong>Nothing to write yet.</strong></div>'}
      ${reviews.length?`<p class="reflect-review-count">${reviews.length} saved ${reviews.length===1?'review':'reviews'}.</p>`:''}
    </section>
  </div>`;
}

function modal(content,initialFocus){
  const host=document.querySelector('#overlayHost');if(!host)return null;const opener=document.activeElement;host.innerHTML=`<div class="reflect-backdrop" data-reflect-close></div>${content}`;document.body.classList.add('reflect-modal-open');
  const close=()=>{host.onkeydown=null;host.innerHTML='';document.body.classList.remove('reflect-modal-open');opener?.focus?.({preventScroll:true});};
  host.querySelectorAll('[data-reflect-close]').forEach(node=>node.addEventListener('click',event=>{if(event.target===node||node.matches('button'))close();}));
  host.querySelector('[data-reflect-dialog]')?.addEventListener('click',event=>event.stopPropagation());
  host.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;const nodes=[...host.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.offsetParent!==null);if(nodes.length<2)return;const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};
  requestAnimationFrame(()=>host.querySelector(initialFocus||'textarea,button')?.focus());return {host,close};
}
function toast(message){const host=document.querySelector('#toastHost');if(!host)return;host.innerHTML=`<div class="reflect-toast static-surface">${escapeHtml(message)}</div>`;setTimeout(()=>{if(host.textContent===message)host.innerHTML='';},2600);}
function field(name,label,placeholder){return `<label><span>${label}</span><textarea name="${name}" maxlength="2400" rows="3" placeholder="${escapeHtml(placeholder)}"></textarea></label>`;}

function reviewCopy(kind,model){
  if(kind==='monthly'){
    const facts=monthlyFacts(model);return {title:'Monthly review',eyebrow:'30 days',summary:`${facts.items.length} records · ${minutesLabel(facts.minutes)} · ${facts.energy.length} check-ins`,tag:'monthly-review',fields:[['time','Where did your time actually go?','What stands out from the month?'],['feel','How did you feel across the month?','Use your own words.'],['support','Did your routines support what mattered?','What fit? What kept colliding with real life?'],['change','What should change next month?','Choose one or two deliberate changes.']]};
  }
  const facts=weekFacts(model);return {title:'Weekly review',eyebrow:'7 days',summary:`${facts.items.length} records · ${minutesLabel(facts.minutes)} · ${facts.energy.length} check-ins`,tag:'weekly-review',fields:[['changed','What changed this week?','What was different from the plan?'],['worked','What worked?','An observation is enough.'],['learned','What did you learn?','One sentence is enough.'],['change','What should change next week?','Choose one adjustment.'],['time','What deserves time next week?','Name the thing to protect.']]};
}

export function openReviewDialog(kind,model,{reload}={}){
  const copy=reviewCopy(kind,model);const instance=modal(`<section class="reflect-dialog static-surface" role="dialog" aria-modal="true" aria-labelledby="reflectDialogTitle" data-reflect-dialog><header><div><p class="eyebrow">${escapeHtml(copy.eyebrow)}</p><h2 id="reflectDialogTitle">${escapeHtml(copy.title)}</h2><p>${escapeHtml(copy.summary)}</p></div><button type="button" class="reflect-close" data-reflect-close aria-label="Close">×</button></header><form id="reflectReviewForm">${copy.fields.map(([name,label,placeholder])=>field(name,label,placeholder)).join('')}<p class="composition-boundary">Your interpretation stays yours. Growth Compass supplies only factual context.</p><div class="reflect-dialog-actions"><button type="button" class="ghost-button" data-reflect-close>Cancel</button><button type="submit" class="primary-button">Save review</button></div><p class="reflect-form-error" role="alert"></p></form></section>`,'textarea');if(!instance)return;
  instance.host.querySelector('#reflectReviewForm')?.addEventListener('submit',async event=>{event.preventDefault();const form=new FormData(event.currentTarget);const sections=copy.fields.map(([name,label])=>{const value=String(form.get(name)||'').trim();return value?`${label}\n${value}`:'';}).filter(Boolean);if(!sections.length){const error=instance.host.querySelector('.reflect-form-error');if(error)error.textContent='Write at least one reflection before saving.';return;}try{await journalCapability.create({occurred_on:todayKey(),title:`${copy.title} — ${todayKey()}`,body:sections.join('\n\n'),entry_type:'reflection',tags:[copy.tag]});instance.close();toast(`${copy.title} saved`);await reload?.();}catch(error){const target=instance.host.querySelector('.reflect-form-error');if(target)target.textContent=error.message||'Could not save review';}});
}

export function openAdjustmentDialog(model,{reload}={}){
  const instance=modal(`<section class="reflect-dialog reflect-adjustment-dialog static-surface" role="dialog" aria-modal="true" aria-labelledby="adjustTitle" data-reflect-dialog><header><div><p class="eyebrow">Small experiment</p><h2 id="adjustTitle">Try one adjustment.</h2><p>One change. One thing to observe.</p></div><button type="button" class="reflect-close" data-reflect-close aria-label="Close">×</button></header><form id="adjustmentForm"><label><span>What will you change?</span><textarea name="change" maxlength="1000" rows="4" required placeholder="e.g. Protect the first hour after breakfast for focused work for one week"></textarea></label><label><span>What will you watch? <small>optional</small></span><textarea name="observe" maxlength="1000" rows="3" placeholder="e.g. Whether starting feels easier and how my energy feels afterward"></textarea></label><div class="reflect-dialog-actions"><button type="button" class="ghost-button" data-reflect-close>Cancel</button><button type="submit" class="primary-button">Save adjustment</button></div><p class="reflect-form-error" role="alert"></p></form></section>`,'textarea[name="change"]');if(!instance)return;
  instance.host.querySelector('#adjustmentForm')?.addEventListener('submit',async event=>{event.preventDefault();const form=new FormData(event.currentTarget);const change=String(form.get('change')||'').trim(),observe=String(form.get('observe')||'').trim();if(!change)return;try{await journalCapability.create({occurred_on:todayKey(),title:`Adjustment to try — ${todayKey()}`,body:`What I will change\n${change}${observe?`\n\nWhat I will pay attention to\n${observe}`:''}`,entry_type:'reflection',tags:['adjustment']});instance.close();toast('Adjustment saved');await reload?.();}catch(error){const target=instance.host.querySelector('.reflect-form-error');if(target)target.textContent=error.message||'Could not save adjustment';}});
}

export function bindReflect(model,{navigate,reload}={}){
  document.querySelectorAll('[data-reflect-open-journal]').forEach(button=>button.addEventListener('click',()=>navigate?.('journal')));
  document.querySelectorAll('[data-reflect-review]').forEach(button=>button.addEventListener('click',()=>openReviewDialog(button.dataset.reflectReview,model,{reload})));
}
