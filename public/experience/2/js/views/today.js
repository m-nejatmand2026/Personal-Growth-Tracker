import { api } from '../core/api.js';
import { goalsCapability } from '../capabilities/goals.js';

let firstRunContinuation='';

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,(character)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));}
function addDays(dateText,amount){const date=new Date(`${dateText}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
function todayKey(){const now=new Date();const offset=now.getTimezoneOffset()*60000;return new Date(now.getTime()-offset).toISOString().slice(0,10);}
function minutesLabel(value){const minutes=Math.max(0,Number(value)||0);if(!minutes)return 'No duration';const hours=Math.floor(minutes/60),rest=minutes%60;return hours&&rest?`${hours}h ${rest}m`:hours?`${hours}h`:`${rest}m`;}
function itemMeta(item){return [item.activity_label&&item.activity_label!==item.title?item.activity_label:null,item.subtype,item.planned_time,item.planned_minutes?`${minutesLabel(item.planned_minutes)} planned`:null].filter(Boolean).join(' · ');}
function glyph(item){return escapeHtml(String(item.activity_label||item.title||'A').trim().slice(0,1).toUpperCase()||'A');}
function summaryRows(model,key){return Array.isArray(model?.summary?.[key])?model.summary[key]:[];}
function activeGoals(model){return Array.isArray(model?.goals)?model.goals.filter(goal=>goal.status!=='archived'):[];}
function hasOperationalSignal(model){return Boolean((model.today||[]).length||(model.tomorrowItems||[]).length||summaryRows(model,'progress').length||summaryRows(model,'direction').length);}

export function todayStage(model){
  if(model?.goalsKnown===true&&!hasOperationalSignal(model)&&Array.isArray(model.goals)&&model.goals.length===0)return 'welcome';
  if(firstRunContinuation==='plan'&&model?.goalsKnown===true&&activeGoals(model).length)return 'plan';
  return 'operational';
}

async function loadGoalSignal(){
  try{const response=await api.get('/v1/goals?include_archived=1');return {known:true,goals:Array.isArray(response?.items)?response.items:[]};}
  catch{return {known:false,goals:[]};}
}

export async function loadToday(date=todayKey()){
  const tomorrow=addDays(date,1);
  const [todayPlan,tomorrowPlan,todaySummary,goalSignal]=await Promise.all([
    api.get(`/v1/daily-plan?date=${encodeURIComponent(date)}`),
    api.get(`/v1/daily-plan?date=${encodeURIComponent(tomorrow)}`),
    api.get(`/v1/today?date=${encodeURIComponent(date)}&period=week`),
    loadGoalSignal()
  ]);
  return {date,tomorrow,today:todayPlan.items||[],tomorrowItems:tomorrowPlan.items||[],summary:todaySummary,goals:goalSignal.goals,goalsKnown:goalSignal.known};
}

function directionHtml(direction=[]){
  return direction.slice(0,5).map(row=>{const target=Math.max(0,Number(row.target_minutes)||0);const actual=Math.max(0,Number(row.actual_minutes)||0);const ratio=target?Math.min(1,actual/target):0;return `<div class="direction-row"><div><strong>${escapeHtml(row.name)}</strong><span>${minutesLabel(actual)} actual${target?` · ${minutesLabel(target)} target`:''}</span></div><div class="direction-track" aria-label="${escapeHtml(row.name)} ${Math.round(ratio*100)} percent of target"><i style="width:${Math.round(ratio*100)}%"></i></div></div>`;}).join('');
}

function itemHtml(item,{future=false}={}){
  const meta=itemMeta(item)||(item.activity_key?'Activity':'One-off intention');
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

function nowHtml(activeItems=[]){
  const [active,...additional]=activeItems;
  return `<section class="living-surface today-now is-active"><p class="eyebrow">Now</p><div class="today-now-active"><span class="today-now-glyph" aria-hidden="true">${glyph(active)}</span><div><h2>${escapeHtml(active.title)}</h2><p>${escapeHtml(itemMeta(active)||'In focus now')}</p></div></div><div class="today-now-actions"><button type="button" class="primary-button" data-today-done="${active.id}">Done</button><button type="button" class="ghost-button" data-today-change="${active.id}">Plans changed?</button></div>${additional.length?`<div class="today-now-also"><div class="today-now-also-head"><span>Also in progress</span><strong>${additional.length}</strong></div><div class="today-now-also-list">${additional.map(item=>itemHtml(item)).join('')}</div></div>`:''}</section>`;
}

function progressHtml(progress=[]){
  const minutes=progress.reduce((sum,row)=>sum+Math.max(0,Number(row.minutes)||0),0);
  return `<article class="static-surface today-metric"><span class="metric-label">Factual progress today</span><strong class="metric-value">${minutesLabel(minutes)}</strong><p>${progress.length} recorded ${progress.length===1?'entry':'entries'}</p></article>`;
}

function onboardingSteps(current='direction'){
  const steps=[['direction','1','Direction','Decide what matters.'],['plan','2','Plan','Choose what deserves attention now.'],['progress','3','Progress','Record what actually happened.']];
  const currentIndex=Math.max(0,steps.findIndex(([key])=>key===current));
  return `<div class="today-onboarding-steps" aria-label="Growth Compass flow">${steps.map(([key,number,title,copy],index)=>`<article class="today-onboarding-step${index<currentIndex?' is-done':''}${index===currentIndex?' is-current':''}"><span>${index<currentIndex?'✓':number}</span><div><strong>${title}</strong><p>${copy}</p></div></article>`).join('')}</div>`;
}

function welcomeHtml(){
  return `<div class="today-view today-first-run">
    <section class="living-surface today-onboarding" aria-labelledby="todayWelcomeTitle">
      <div class="today-onboarding-kicker"><span>Start here</span><b>1 of 3 · About 2 minutes</b></div>
      <div class="today-onboarding-copy"><p class="eyebrow">Your compass starts with direction</p><h2 id="todayWelcomeTitle">Welcome to Growth Compass</h2><p>Turn what matters to you into direction, plans, and measurable progress — without turning your life into a list of overdue tasks.</p></div>
      <div class="today-onboarding-actions"><button type="button" class="primary-button" data-today-build-compass>Build my compass</button><button type="button" class="ghost-button today-how-toggle" data-today-how aria-expanded="false" aria-controls="todayHowPanel">How Growth Compass works</button></div>
      ${onboardingSteps('direction')}
      <div class="today-how-panel" id="todayHowPanel" hidden><p><strong>Direction is intention.</strong> Start with one goal that matters. Planning decides what deserves time. Progress records only what actually happened.</p><p>You can change your direction later. Targets, life areas, schedules, and detailed setup are optional until they become useful.</p></div>
    </section>
    <p class="today-first-run-note">Start small. One meaningful direction is enough.</p>
  </div>`;
}

function planPromptHtml(model){
  const goal=activeGoals(model)[0];
  return `<div class="today-view today-first-run">
    <section class="living-surface today-onboarding today-onboarding-next" aria-labelledby="todayPlanStartTitle">
      <div class="today-onboarding-kicker"><span>Direction set</span><b>2 of 3</b></div>
      <div class="today-onboarding-copy"><p class="eyebrow">Next step</p><h2 id="todayPlanStartTitle">Turn direction into a workable plan</h2><p>${goal?`“${escapeHtml(goal.name)}” is now part of your compass. `:''}Choose what deserves your attention before Today becomes an execution dashboard.</p></div>
      <div class="today-onboarding-actions"><button type="button" class="primary-button" data-today-go-plan>Plan what matters</button><button type="button" class="ghost-button" data-today-go-goals>Review goals</button></div>
      ${onboardingSteps('plan')}
    </section>
  </div>`;
}

function openDayHtml(){
  return `<section class="static-surface today-open-day"><div><p class="eyebrow">Today</p><h2>Your day is open</h2><p>Nothing needs to be added just to fill space. Plan something only if it genuinely deserves attention.</p></div><button type="button" class="secondary-button" data-today-go-plan>Plan today</button></section>`;
}

export function renderToday(model){
  const stage=todayStage(model);
  if(stage==='welcome')return welcomeHtml();
  if(stage==='plan')return planPromptHtml(model);
  const activeItems=(model.today||[]).filter(item=>item.status==='in_progress');
  const planned=(model.today||[]).filter(item=>item.status==='planned');
  const plannedMinutes=(model.today||[]).reduce((sum,item)=>sum+Math.max(0,Number(item.planned_minutes)||0),0);
  const progress=summaryRows(model,'progress');
  const direction=summaryRows(model,'direction');
  const sideParts=[];
  if(progress.length)sideParts.push(progressHtml(progress));
  if(direction.length)sideParts.push(`<section class="static-surface today-direction"><header><p class="eyebrow">Direction · this week</p><h2>Goal alignment</h2></header>${directionHtml(direction)}</section>`);
  if(progress.length||direction.length)sideParts.push(`<article class="static-surface today-principle"><span class="metric-label">Contract</span><strong>Plan is intention. Progress is fact.</strong><p>Completing an Activity asks for the factual measurement before Progress is written.</p></article>`);
  const daySection=(model.today||[]).length?`<section class="static-surface today-day" id="todayPlanList"><header class="today-section-head"><div><p class="eyebrow">Daily Plan · intention</p><h2>Your day</h2></div><span>${model.today.length} ${model.today.length===1?'item':'items'}${plannedMinutes?` · ${minutesLabel(plannedMinutes)}`:''}</span></header><div class="today-plan-list">${planned.length?planned.map(item=>itemHtml(item)).join(''):`<div class="today-empty"><strong>${activeItems.length?'Everything planned is already in progress.':'Your active plan is clear.'}</strong><span>${activeItems.length?'Current work stays visible above until it is completed or changed.':'Add only what is genuinely useful.'}</span></div>`}</div></section>`:openDayHtml();
  const tomorrowSection=(model.tomorrowItems||[]).length?`<details class="static-surface today-tomorrow"><summary><span><p class="eyebrow">Next</p><strong>Tomorrow</strong><small>${model.tomorrowItems.length} active ${model.tomorrowItems.length===1?'item':'items'}</small></span><b aria-hidden="true">›</b></summary><div class="today-tomorrow-body">${model.tomorrowItems.map(item=>itemHtml(item,{future:true})).join('')}</div></details>`:'';
  return `<div class="today-view">
    ${activeItems.length?nowHtml(activeItems):''}
    <section class="today-grid${sideParts.length?'':' today-grid-single'}">
      <div class="today-main-column">${daySection}${tomorrowSection}</div>
      ${sideParts.length?`<aside class="today-side-column">${sideParts.join('')}</aside>`:''}
    </section>
  </div>`;
}

function overlay(content,{initialFocus}={}){const host=document.querySelector('#overlayHost');if(!host)return()=>{};const opener=document.activeElement;let keyHandler=null;host.innerHTML=`<div class="today-overlay-backdrop" data-today-close></div>${content}`;document.body.classList.add('today-overlay-open');const close=()=>{if(keyHandler)host.removeEventListener('keydown',keyHandler);keyHandler=null;host.innerHTML='';document.body.classList.remove('today-overlay-open');opener?.focus?.({preventScroll:true});};keyHandler=event=>{if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;const focusable=[...host.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};host.addEventListener('keydown',keyHandler);host.querySelectorAll('[data-today-close]').forEach(node=>node.addEventListener('click',close));requestAnimationFrame(()=>host.querySelector(initialFocus||'button,input,select,textarea')?.focus());return close;}
function toast(message){const host=document.querySelector('#toastHost');if(!host)return;host.innerHTML=`<div class="today-toast static-surface">${escapeHtml(message)}</div>`;setTimeout(()=>{if(host.textContent===message)host.innerHTML='';},2600);}
function navigateTo(view){document.querySelector(`[data-view="${view}"]`)?.click();}

function openFirstGoal(reload){
  const close=overlay(`<section class="today-sheet today-first-goal-sheet static-surface" role="dialog" aria-modal="true" aria-labelledby="todayFirstGoalTitle"><button type="button" class="today-sheet-close" data-today-close aria-label="Close">×</button><p class="eyebrow">Build your compass · step 1</p><h2 id="todayFirstGoalTitle">What matters enough to move toward?</h2><p>Start with one direction. You can refine its life area, targets, and details later.</p><form id="todayFirstGoalForm"><label>Direction or goal<input id="todayFirstGoalName" maxlength="120" required placeholder="e.g. Build stronger professional skills"></label><fieldset class="today-first-goal-measure"><legend>How will you recognize progress?</legend><label><input type="radio" name="todayFirstGoalMeasure" value="time" checked><span>Time spent</span></label><label><input type="radio" name="todayFirstGoalMeasure" value="count"><span>Quantity</span></label><label><input type="radio" name="todayFirstGoalMeasure" value="boolean"><span>Completed</span></label><label><input type="radio" name="todayFirstGoalMeasure" value="milestone"><span>Milestones</span></label></fieldset><label>Why does this matter? <small>optional</small><textarea id="todayFirstGoalWhy" maxlength="1000" placeholder="A short reason is enough"></textarea></label><p class="today-first-goal-note">No target is required. Growth Compass can become more detailed only when that detail becomes useful.</p><button class="primary-button" type="submit">Set my first direction</button></form></section>`,{initialFocus:'#todayFirstGoalName'});
  document.querySelector('#todayFirstGoalForm')?.addEventListener('submit',async event=>{event.preventDefault();const name=document.querySelector('#todayFirstGoalName')?.value.trim()||'';if(!name)return toast('Add a direction or goal');const measurement_type=document.querySelector('input[name="todayFirstGoalMeasure"]:checked')?.value||'time';const numeric=measurement_type==='time'||measurement_type==='count';const payload={name,area_id:null,measurement_type,target_period:numeric?'weekly':'none',target_value:null,minimum_value:null,unit:null,priority:'medium',status:'active',why_text:document.querySelector('#todayFirstGoalWhy')?.value.trim()||null,description:null};try{await goalsCapability.create(payload);firstRunContinuation='plan';close();toast('Your first direction is set');await reload();}catch(error){toast(error.message||'Could not create your first direction');}});
}

async function completeItem(item,reload){
  if(!item)return;
  if(!item.activity_key){await api.put(`/v1/daily-plan/${item.id}`,{status:'completed'});toast('One-off item completed');await reload();return;}
  const suggested=Math.max(1,Number(item.planned_minutes)||25);
  const close=overlay(`<section class="today-sheet static-surface" role="dialog" aria-modal="true" aria-labelledby="todayDoneTitle"><button type="button" class="today-sheet-close" data-today-close aria-label="Close">×</button><p class="eyebrow">Record factual Progress</p><h2 id="todayDoneTitle">What actually happened?</h2><p>“${escapeHtml(item.title)}” was planned. Confirm the factual time before it becomes Progress.</p><form id="todayDoneForm"><label>Minutes actually done<input id="todayDoneMinutes" type="number" min="0" max="1440" value="${suggested}" required></label><label>Note <textarea id="todayDoneNote" maxlength="500" placeholder="Optional factual context">${escapeHtml(item.note||'')}</textarea></label><button class="primary-button" type="submit">Record Progress & complete</button></form></section>`,{initialFocus:'#todayDoneMinutes'});
  document.querySelector('#todayDoneForm')?.addEventListener('submit',async event=>{event.preventDefault();const minutes=Number(document.querySelector('#todayDoneMinutes')?.value);if(!Number.isInteger(minutes)||minutes<0||minutes>1440){toast('Minutes must be 0–1440');return;}try{await api.post('/v1/progress',{activity_key:item.activity_key,occurred_on:item.planned_for,minutes,subtype:item.subtype||null,note:document.querySelector('#todayDoneNote')?.value.trim()||null});await api.put(`/v1/daily-plan/${item.id}`,{status:'completed'});close();toast('Factual Progress recorded');await reload();}catch(error){toast(error.message||'Could not record Progress');}});
}

function changeItem(item,reload){
  if(!item)return;
  const next=addDays(item.planned_for,1);
  const close=overlay(`<section class="today-sheet static-surface" role="dialog" aria-modal="true" aria-labelledby="todayChangeTitle"><button type="button" class="today-sheet-close" data-today-close aria-label="Close">×</button><p class="eyebrow">Plans changed?</p><h2 id="todayChangeTitle">Adjust without creating debt</h2><p>Nothing moves automatically. Choose what fits now for “${escapeHtml(item.title)}”.</p><div class="today-change-grid"><button type="button" class="ghost-button" data-today-keep>Keep as is</button><label>Move to<input id="todayMoveDate" type="date" value="${next}"><button type="button" class="secondary-button" data-today-move>Move</button></label><label>Reduce duration<input id="todayReduceMinutes" type="number" min="1" max="1440" placeholder="minutes"><button type="button" class="secondary-button" data-today-reduce>Reduce</button></label><button type="button" class="ghost-button danger" data-today-drop>Drop from active plan</button></div></section>`,{initialFocus:'[data-today-keep]'});
  document.querySelector('[data-today-keep]')?.addEventListener('click',close);
  document.querySelector('[data-today-move]')?.addEventListener('click',async()=>{const planned_for=document.querySelector('#todayMoveDate')?.value;if(!planned_for)return toast('Choose a date');try{await api.put(`/v1/daily-plan/${item.id}`,{planned_for});close();toast('Plan item moved');await reload();}catch(error){toast(error.message||'Could not move item');}});
  document.querySelector('[data-today-reduce]')?.addEventListener('click',async()=>{const planned_minutes=Number(document.querySelector('#todayReduceMinutes')?.value);const current=Number(item.planned_minutes)||0;if(!Number.isInteger(planned_minutes)||planned_minutes<1||planned_minutes>1440)return toast('Choose 1–1440 minutes');if(current>1&&planned_minutes>=current)return toast('Choose a smaller duration');try{await api.put(`/v1/daily-plan/${item.id}`,{planned_minutes});close();toast('Plan reduced');await reload();}catch(error){toast(error.message||'Could not reduce item');}});
  document.querySelector('[data-today-drop]')?.addEventListener('click',async()=>{try{await api.put(`/v1/daily-plan/${item.id}`,{status:'dismissed'});close();toast('Dropped without creating Progress');await reload();}catch(error){toast(error.message||'Could not drop item');}});
}

export function bindToday(model,{reload}={}){
  const refresh=reload||(()=>Promise.resolve());
  document.querySelector('[data-today-how]')?.addEventListener('click',event=>{const button=event.currentTarget;const panel=document.querySelector('#todayHowPanel');if(!panel)return;const open=panel.hidden;panel.hidden=!open;button.setAttribute('aria-expanded',String(open));if(open)panel.focus?.({preventScroll:true});});
  document.querySelector('[data-today-build-compass]')?.addEventListener('click',()=>openFirstGoal(refresh));
  document.querySelectorAll('[data-today-go-plan]').forEach(button=>button.addEventListener('click',()=>{firstRunContinuation='';navigateTo('plan');}));
  document.querySelectorAll('[data-today-go-goals]').forEach(button=>button.addEventListener('click',()=>{firstRunContinuation='';navigateTo('goals');}));
  document.querySelector('[data-today-jump-plan]')?.addEventListener('click',()=>document.querySelector('#todayPlanList')?.scrollIntoView({behavior:'smooth',block:'start'}));
  document.querySelectorAll('[data-today-start]').forEach(button=>button.addEventListener('click',async()=>{try{await api.put(`/v1/daily-plan/${button.dataset.todayStart}`,{status:'in_progress'});toast('Started');await refresh();}catch(error){toast(error.message||'Could not start item');}}));
  document.querySelectorAll('[data-today-done]').forEach(button=>button.addEventListener('click',()=>{const item=[...(model.today||[]),...(model.tomorrowItems||[])].find(candidate=>Number(candidate.id)===Number(button.dataset.todayDone));void completeItem(item,refresh);}));
  document.querySelectorAll('[data-today-change]').forEach(button=>button.addEventListener('click',()=>{const item=[...(model.today||[]),...(model.tomorrowItems||[])].find(candidate=>Number(candidate.id)===Number(button.dataset.todayChange));changeItem(item,refresh);}));
}
