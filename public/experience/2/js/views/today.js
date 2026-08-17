import { api } from '../core/api.js';

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,(character)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));}
function addDays(dateText,amount){const date=new Date(`${dateText}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
function todayKey(){const now=new Date();const offset=now.getTimezoneOffset()*60000;return new Date(now.getTime()-offset).toISOString().slice(0,10);}
function minutesLabel(value){const minutes=Math.max(0,Number(value)||0);if(!minutes)return 'No duration';const hours=Math.floor(minutes/60),rest=minutes%60;return hours&&rest?`${hours}h ${rest}m`:hours?`${hours}h`:`${rest}m`;}
function itemMeta(item){return [item.activity_label&&item.activity_label!==item.title?item.activity_label:null,item.subtype,item.planned_time,item.planned_minutes?`${minutesLabel(item.planned_minutes)} planned`:null].filter(Boolean).join(' · ');}
function glyph(item){return escapeHtml(String(item.activity_label||item.title||'A').trim().slice(0,1).toUpperCase()||'A');}

export async function loadToday(date=todayKey()){
  const tomorrow=addDays(date,1);
  const [todayPlan,tomorrowPlan,todaySummary]=await Promise.all([
    api.get(`/v1/daily-plan?date=${encodeURIComponent(date)}`),
    api.get(`/v1/daily-plan?date=${encodeURIComponent(tomorrow)}`),
    api.get(`/v1/today?date=${encodeURIComponent(date)}&period=week`)
  ]);
  return {date,tomorrow,today:todayPlan.items||[],tomorrowItems:tomorrowPlan.items||[],summary:todaySummary};
}

function directionHtml(direction=[]){
  if(!direction.length)return '<div class="today-empty compact"><strong>No weekly direction yet.</strong><span>Targets appear when real goal allocations exist.</span></div>';
  return direction.slice(0,5).map(row=>{const target=Math.max(0,Number(row.target_minutes)||0);const actual=Math.max(0,Number(row.actual_minutes)||0);const ratio=target?Math.min(1,actual/target):0;return `<div class="direction-row"><div><strong>${escapeHtml(row.name)}</strong><span>${minutesLabel(actual)} actual${target?` · ${minutesLabel(target)} target`:''}</span></div><div class="direction-track" aria-label="${escapeHtml(row.name)} ${Math.round(ratio*100)} percent of target"><i style="width:${Math.round(ratio*100)}%"></i></div></div>`;}).join('');
}

function itemHtml(item,{future=false}={}){
  const meta=itemMeta(item)|| (item.activity_key?'Activity':'One-off intention');
  return `<article class="today-plan-item${item.status==='in_progress'?' is-active':''}${future?' is-future':''}">
    <span class="today-plan-glyph" aria-hidden="true">${glyph(item)}</span>
    <div class="today-plan-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(meta)}</span></div>
    <div class="today-plan-actions">
      ${!future&&item.status==='planned'?`<button type="button" class="secondary-button compact" data-today-start="${item.id}">Start</button>`:''}
      ${!future?`<button type="button" class="primary-button compact" data-today-done="${item.id}">Done</button>`:''}
      <button type="button" class="ghost-button compact" data-today-change="${item.id}">${future?'Adjust':'Plans changed?'}</button>
    </div>
  </article>`;
}

function nowHtml(active){
  if(!active)return `<section class="living-surface today-now"><p class="eyebrow">Now</p><div class="today-now-empty"><div><h2>Nothing running</h2><p>Start only what you intend to do now. Progress is recorded separately when factual work is confirmed.</p></div><button type="button" class="secondary-button" data-today-jump-plan>Choose from today</button></div></section>`;
  return `<section class="living-surface today-now is-active"><p class="eyebrow">Now</p><div class="today-now-active"><span class="today-now-glyph" aria-hidden="true">${glyph(active)}</span><div><h2>${escapeHtml(active.title)}</h2><p>${escapeHtml(itemMeta(active)||'In focus now')}</p></div></div><div class="today-now-actions"><button type="button" class="primary-button" data-today-done="${active.id}">Done</button><button type="button" class="ghost-button" data-today-change="${active.id}">Plans changed?</button></div></section>`;
}

function progressHtml(progress=[]){
  const minutes=progress.reduce((sum,row)=>sum+Math.max(0,Number(row.minutes)||0),0);
  return `<article class="static-surface today-metric"><span class="metric-label">Factual progress today</span><strong class="metric-value">${minutesLabel(minutes)}</strong><p>${progress.length?`${progress.length} recorded ${progress.length===1?'entry':'entries'}`:'Nothing recorded yet'}</p></article>`;
}

export function renderToday(model){
  const active=model.today.find(item=>item.status==='in_progress')||null;
  const planned=model.today.filter(item=>item.status==='planned');
  const plannedMinutes=model.today.reduce((sum,item)=>sum+Math.max(0,Number(item.planned_minutes)||0),0);
  return `<div class="today-view">
    ${nowHtml(active)}
    <section class="today-grid">
      <div class="today-main-column">
        <section class="static-surface today-day" id="todayPlanList"><header class="today-section-head"><div><p class="eyebrow">Daily Plan · intention</p><h2>Your day</h2></div><span>${model.today.length} ${model.today.length===1?'item':'items'}${plannedMinutes?` · ${minutesLabel(plannedMinutes)}`:''}</span></header>
          <div class="today-plan-list">${planned.length?planned.map(item=>itemHtml(item)).join(''):'<div class="today-empty"><strong>No other plans yet.</strong><span>An open day is valid. Add only what is genuinely useful.</span></div>'}</div>
        </section>
        <details class="static-surface today-tomorrow"><summary><span><p class="eyebrow">Next</p><strong>Tomorrow</strong><small>${model.tomorrowItems.length?`${model.tomorrowItems.length} active ${model.tomorrowItems.length===1?'item':'items'}`:'Nothing planned yet'}</small></span><b aria-hidden="true">›</b></summary><div class="today-tomorrow-body">${model.tomorrowItems.length?model.tomorrowItems.map(item=>itemHtml(item,{future:true})).join(''):'<div class="today-empty compact"><strong>Tomorrow is open.</strong><span>Unfinished work never rolls forward automatically.</span></div>'}</div></details>
      </div>
      <aside class="today-side-column">
        ${progressHtml(model.summary.progress||[])}
        <section class="static-surface today-direction"><header><p class="eyebrow">Direction · this week</p><h2>Goal alignment</h2></header>${directionHtml(model.summary.direction||[])}</section>
        <article class="static-surface today-principle"><span class="metric-label">Contract</span><strong>Plan is intention. Progress is fact.</strong><p>Completing an Activity asks for the factual measurement before Progress is written.</p></article>
      </aside>
    </section>
  </div>`;
}

function overlay(content){const host=document.querySelector('#overlayHost');if(!host)return()=>{};host.innerHTML=`<div class="today-overlay-backdrop" data-today-close></div>${content}`;document.body.classList.add('today-overlay-open');const close=()=>{host.innerHTML='';document.body.classList.remove('today-overlay-open');};host.querySelectorAll('[data-today-close]').forEach(node=>node.addEventListener('click',close));return close;}
function toast(message){const host=document.querySelector('#toastHost');if(!host)return;host.innerHTML=`<div class="today-toast static-surface">${escapeHtml(message)}</div>`;setTimeout(()=>{if(host.textContent===message)host.innerHTML='';},2600);}

async function completeItem(item,reload){
  if(!item)return;
  if(!item.activity_key){await api.put(`/v1/daily-plan/${item.id}`,{status:'completed'});toast('One-off item completed');await reload();return;}
  const suggested=Math.max(1,Number(item.planned_minutes)||25);
  const close=overlay(`<section class="today-sheet static-surface" role="dialog" aria-modal="true" aria-labelledby="todayDoneTitle"><button type="button" class="today-sheet-close" data-today-close aria-label="Close">×</button><p class="eyebrow">Record factual Progress</p><h2 id="todayDoneTitle">What actually happened?</h2><p>“${escapeHtml(item.title)}” was planned. Confirm the factual time before it becomes Progress.</p><form id="todayDoneForm"><label>Minutes actually done<input id="todayDoneMinutes" type="number" min="0" max="1440" value="${suggested}" required></label><label>Note <textarea id="todayDoneNote" maxlength="500" placeholder="Optional factual context">${escapeHtml(item.note||'')}</textarea></label><button class="primary-button" type="submit">Record Progress & complete</button></form></section>`);
  document.querySelector('#todayDoneMinutes')?.focus();
  document.querySelector('#todayDoneForm')?.addEventListener('submit',async event=>{event.preventDefault();const minutes=Number(document.querySelector('#todayDoneMinutes')?.value);if(!Number.isInteger(minutes)||minutes<0||minutes>1440){toast('Minutes must be 0–1440');return;}try{await api.post('/v1/progress',{activity_key:item.activity_key,occurred_on:item.planned_for,minutes,subtype:item.subtype||null,note:document.querySelector('#todayDoneNote')?.value.trim()||null});await api.put(`/v1/daily-plan/${item.id}`,{status:'completed'});close();toast('Factual Progress recorded');await reload();}catch(error){toast(error.message||'Could not record Progress');}});
}

function changeItem(item,reload){
  if(!item)return;
  const next=addDays(item.planned_for,1);
  const close=overlay(`<section class="today-sheet static-surface" role="dialog" aria-modal="true" aria-labelledby="todayChangeTitle"><button type="button" class="today-sheet-close" data-today-close aria-label="Close">×</button><p class="eyebrow">Plans changed?</p><h2 id="todayChangeTitle">Adjust without creating debt</h2><p>Nothing moves automatically. Choose what fits now for “${escapeHtml(item.title)}”.</p><div class="today-change-grid"><button type="button" class="ghost-button" data-today-keep>Keep as is</button><label>Move to<input id="todayMoveDate" type="date" value="${next}"><button type="button" class="secondary-button" data-today-move>Move</button></label><label>Reduce duration<input id="todayReduceMinutes" type="number" min="1" max="1440" placeholder="minutes"><button type="button" class="secondary-button" data-today-reduce>Reduce</button></label><button type="button" class="ghost-button danger" data-today-drop>Drop from active plan</button></div></section>`);
  document.querySelector('[data-today-keep]')?.addEventListener('click',close);
  document.querySelector('[data-today-move]')?.addEventListener('click',async()=>{const planned_for=document.querySelector('#todayMoveDate')?.value;if(!planned_for)return toast('Choose a date');try{await api.put(`/v1/daily-plan/${item.id}`,{planned_for});close();toast('Plan item moved');await reload();}catch(error){toast(error.message||'Could not move item');}});
  document.querySelector('[data-today-reduce]')?.addEventListener('click',async()=>{const planned_minutes=Number(document.querySelector('#todayReduceMinutes')?.value);const current=Number(item.planned_minutes)||0;if(!Number.isInteger(planned_minutes)||planned_minutes<1||planned_minutes>1440)return toast('Choose 1–1440 minutes');if(current>1&&planned_minutes>=current)return toast('Choose a smaller duration');try{await api.put(`/v1/daily-plan/${item.id}`,{planned_minutes});close();toast('Plan reduced');await reload();}catch(error){toast(error.message||'Could not reduce item');}});
  document.querySelector('[data-today-drop]')?.addEventListener('click',async()=>{try{await api.put(`/v1/daily-plan/${item.id}`,{status:'dismissed'});close();toast('Dropped without creating Progress');await reload();}catch(error){toast(error.message||'Could not drop item');}});
}

export function bindToday(model,{reload}={}){
  const refresh=reload||(()=>Promise.resolve());
  document.querySelector('[data-today-jump-plan]')?.addEventListener('click',()=>document.querySelector('#todayPlanList')?.scrollIntoView({behavior:'smooth',block:'start'}));
  document.querySelectorAll('[data-today-start]').forEach(button=>button.addEventListener('click',async()=>{try{await api.put(`/v1/daily-plan/${button.dataset.todayStart}`,{status:'in_progress'});toast('Started');await refresh();}catch(error){toast(error.message||'Could not start item');}}));
  document.querySelectorAll('[data-today-done]').forEach(button=>button.addEventListener('click',()=>{const item=[...model.today,...model.tomorrowItems].find(candidate=>Number(candidate.id)===Number(button.dataset.todayDone));void completeItem(item,refresh);}));
  document.querySelectorAll('[data-today-change]').forEach(button=>button.addEventListener('click',()=>{const item=[...model.today,...model.tomorrowItems].find(candidate=>Number(candidate.id)===Number(button.dataset.todayChange));changeItem(item,refresh);}));
}
