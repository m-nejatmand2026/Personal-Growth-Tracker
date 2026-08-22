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
function weekFacts(model){const today=todayKey(),from=addDays(today,-6);const items=(model.progress?.items||[]).filter(item=>item.occurred_on>=from&&item.occurred_on<=today);const minutes=items.reduce((sum,item)=>sum+Math.max(0,Number(item.minutes)||0),0);const activeDays=new Set(items.map(item=>item.occurred_on)).size;const energy=(model.insights?.energy||[]).filter(item=>item.occurred_on>=from&&item.occurred_on<=today);return {items,minutes,activeDays,energy};}
function monthlyFacts(model){const today=todayKey(),from=addDays(today,-29);const items=(model.progress?.items||[]).filter(item=>item.occurred_on>=from&&item.occurred_on<=today);const minutes=items.reduce((sum,item)=>sum+Math.max(0,Number(item.minutes)||0),0);const energy=(model.insights?.energy||[]).filter(item=>item.occurred_on>=from&&item.occurred_on<=today);return {items,minutes,energy};}

export function renderReflect(model){
  const weekly=weekFacts(model),monthly=monthlyFacts(model);
  const reviews=model.journal.filter(item=>tagsOf(item).some(tag=>tag==='weekly-review'||tag==='monthly-review'));
  const ordinary=model.journal.filter(item=>!tagsOf(item).some(tag=>tag==='weekly-review'||tag==='monthly-review'));
  return `<div class="composition-view reflect-view">
    <header class="composition-header reflect-header">
      <div><p class="eyebrow">Reflect</p><h2 class="editorial-statement">What have you learned?</h2><p>Facts can show what happened. Reflection decides what it meant to you and what deserves to change.</p></div>
      <button type="button" class="primary-button" data-reflect-open-journal>Write freely</button>
    </header>
    <div class="reflect-review-grid">
      <section class="reflect-review-card">
        <p class="eyebrow">Weekly rhythm</p><h3>Review the week without grading yourself.</h3><p>${weekly.items.length} factual records · ${minutesLabel(weekly.minutes)} recorded · ${weekly.energy.length} wellbeing check-ins.</p>
        <button type="button" class="secondary-button" data-reflect-review="weekly">Start weekly review</button>
      </section>
      <section class="reflect-review-card">
        <p class="eyebrow">Monthly rhythm</p><h3>Look for what deserves an adjustment.</h3><p>${monthly.items.length} factual records · ${minutesLabel(monthly.minutes)} recorded · ${monthly.energy.length} wellbeing check-ins.</p>
        <button type="button" class="secondary-button" data-reflect-review="monthly">Start monthly review</button>
      </section>
    </div>
    <section class="composition-panel reflect-loop">
      <div class="composition-section-heading"><div><p class="eyebrow">The loop</p><h3>Evidence becomes useful when it changes a choice.</h3></div></div>
      <ol><li><span>1</span><strong>See what happened</strong><p>Progress and wellbeing stay factual.</p></li><li><span>2</span><strong>Name what changed</strong><p>Your context belongs to you, not an algorithm.</p></li><li><span>3</span><strong>Choose one adjustment</strong><p>Change the next plan, routine, or direction deliberately.</p></li></ol>
    </section>
    <section class="reflect-history">
      <div class="composition-section-heading"><div><p class="eyebrow">Recent reflection</p><h3>Your own words</h3></div><button type="button" class="ghost-button" data-reflect-open-journal>Open journal</button></div>
      ${ordinary.length?`<div class="reflect-entry-list">${ordinary.slice(0,4).map(recentEntry).join('')}</div>`:'<div class="reflect-empty"><strong>No reflection required.</strong><p>Write when it helps. There is no streak, score, or obligation.</p></div>'}
      ${reviews.length?`<p class="reflect-review-count">${reviews.length} saved ${reviews.length===1?'review':'reviews'} in your Journal.</p>`:''}
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
    const facts=monthlyFacts(model);return {title:'Monthly review',eyebrow:'Look back · choose forward',summary:`${facts.items.length} factual records · ${minutesLabel(facts.minutes)} recorded · ${facts.energy.length} wellbeing check-ins`,tag:'monthly-review',fields:[['time','Where did your time actually go?','What stands out from the month?'],['feel','How did you feel across the month?','Use your own words; the data is context, not a verdict.'],['support','Did your routines support what mattered?','What fit naturally? What kept colliding with real life?'],['change','What should change next month?','Choose one or two deliberate changes, not a complete life overhaul.']]};
  }
  const facts=weekFacts(model);return {title:'Weekly review',eyebrow:'Seven days · no score',summary:`${facts.items.length} factual records · ${minutesLabel(facts.minutes)} recorded · ${facts.energy.length} wellbeing check-ins`,tag:'weekly-review',fields:[['changed','What changed this week?','Real life rarely follows the original plan exactly.'],['worked','What seemed to work well?','An observation is enough; you do not need to prove why.'],['learned','What did you learn about yourself or your week?','One sentence is enough.'],['change','What should change next week?','Choose one adjustment you can actually try.'],['time','What deserves time next week?','Name the thing you want your next plan to protect.']]};
}

export function openReviewDialog(kind,model,{reload}={}){
  const copy=reviewCopy(kind,model);const instance=modal(`<section class="reflect-dialog static-surface" role="dialog" aria-modal="true" aria-labelledby="reflectDialogTitle" data-reflect-dialog><header><div><p class="eyebrow">${escapeHtml(copy.eyebrow)}</p><h2 id="reflectDialogTitle">${escapeHtml(copy.title)}</h2><p>${escapeHtml(copy.summary)}</p></div><button type="button" class="reflect-close" data-reflect-close aria-label="Close">×</button></header><form id="reflectReviewForm">${copy.fields.map(([name,label,placeholder])=>field(name,label,placeholder)).join('')}<p class="composition-boundary">Growth Compass supplies factual context. Your reflection is your interpretation and is saved privately in Journal.</p><div class="reflect-dialog-actions"><button type="button" class="ghost-button" data-reflect-close>Cancel</button><button type="submit" class="primary-button">Save review</button></div><p class="reflect-form-error" role="alert"></p></form></section>`,'textarea');if(!instance)return;
  instance.host.querySelector('#reflectReviewForm')?.addEventListener('submit',async event=>{event.preventDefault();const form=new FormData(event.currentTarget);const sections=copy.fields.map(([name,label])=>{const value=String(form.get(name)||'').trim();return value?`${label}\n${value}`:'';}).filter(Boolean);if(!sections.length){const error=instance.host.querySelector('.reflect-form-error');if(error)error.textContent='Write at least one reflection before saving.';return;}try{await journalCapability.create({occurred_on:todayKey(),title:`${copy.title} — ${todayKey()}`,body:sections.join('\n\n'),entry_type:'reflection',tags:[copy.tag]});instance.close();toast(`${copy.title} saved`);await reload?.();}catch(error){const target=instance.host.querySelector('.reflect-form-error');if(target)target.textContent=error.message||'Could not save review';}});
}

export function openAdjustmentDialog(model,{reload}={}){
  const instance=modal(`<section class="reflect-dialog reflect-adjustment-dialog static-surface" role="dialog" aria-modal="true" aria-labelledby="adjustTitle" data-reflect-dialog><header><div><p class="eyebrow">Small experiment</p><h2 id="adjustTitle">Try one adjustment.</h2><p>Choose something small enough to test. This records your intention; it does not claim the change will cause a particular result.</p></div><button type="button" class="reflect-close" data-reflect-close aria-label="Close">×</button></header><form id="adjustmentForm"><label><span>What will you change?</span><textarea name="change" maxlength="1000" rows="4" required placeholder="e.g. Protect the first hour after breakfast for focused work for one week"></textarea></label><label><span>What will you pay attention to? <small>optional</small></span><textarea name="observe" maxlength="1000" rows="3" placeholder="e.g. Whether starting feels easier and how my energy feels afterward"></textarea></label><div class="reflect-dialog-actions"><button type="button" class="ghost-button" data-reflect-close>Cancel</button><button type="submit" class="primary-button">Save adjustment</button></div><p class="reflect-form-error" role="alert"></p></form></section>`,'textarea[name="change"]');if(!instance)return;
  instance.host.querySelector('#adjustmentForm')?.addEventListener('submit',async event=>{event.preventDefault();const form=new FormData(event.currentTarget);const change=String(form.get('change')||'').trim(),observe=String(form.get('observe')||'').trim();if(!change)return;try{await journalCapability.create({occurred_on:todayKey(),title:`Adjustment to try — ${todayKey()}`,body:`What I will change\n${change}${observe?`\n\nWhat I will pay attention to\n${observe}`:''}`,entry_type:'reflection',tags:['adjustment']});instance.close();toast('Adjustment saved for reflection');await reload?.();}catch(error){const target=instance.host.querySelector('.reflect-form-error');if(target)target.textContent=error.message||'Could not save adjustment';}});
}

export function bindReflect(model,{navigate,reload}={}){
  document.querySelectorAll('[data-reflect-open-journal]').forEach(button=>button.addEventListener('click',()=>navigate?.('journal')));
  document.querySelectorAll('[data-reflect-review]').forEach(button=>button.addEventListener('click',()=>openReviewDialog(button.dataset.reflectReview,model,{reload})));
}
