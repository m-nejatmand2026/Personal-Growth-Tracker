import { api } from '../core/api.js';
import { goalsCapability } from '../capabilities/goals.js';

let firstRunContinuation='';
let firstRunAreaName='';

const FIRST_RUN_STYLESHEET='/experience/2/css/today-first-run.css';
const FIRST_RUN_AREAS=Object.freeze([
  Object.freeze({key:'career',name:'Career',copy:'Work, skills and professional growth',sample:'Become confident leading cloud architecture projects'}),
  Object.freeze({key:'health',name:'Health',copy:'Energy, fitness and wellbeing',sample:'Build the strength and energy to feel good every day'}),
  Object.freeze({key:'learning',name:'Learning',copy:'Knowledge and new capabilities',sample:'Become fluent enough to use German confidently at work'}),
  Object.freeze({key:'finance',name:'Finance',copy:'Security, freedom and money',sample:'Build a stronger financial safety net'}),
  Object.freeze({key:'relationships',name:'Relationships',copy:'Family, friendship and connection',sample:'Invest consistently in the relationships that matter most'}),
  Object.freeze({key:'personal',name:'Personal Growth',copy:'Character, habits and mindset',sample:'Become more consistent with the habits I care about'}),
  Object.freeze({key:'custom',name:'Something else',copy:'Create a life area that fits you',sample:'Describe the change you want to move toward'})
]);
const ONBOARDING_STEPS=Object.freeze([
  Object.freeze({key:'direction',number:'1',title:'Direction',copy:'Choose what matters.',detail:'Choose one area and define the change you want to move toward. Direction gives every later plan a reason.'}),
  Object.freeze({key:'plan',number:'2',title:'Plan',copy:'Choose the next useful step.',detail:'Turn that direction into a realistic next step and place it around the time your life already needs. Plans are intentions and can change.'}),
  Object.freeze({key:'action',number:'3',title:'Action',copy:'Do what matters now.',detail:'A Plan becomes Action when you actually do the next useful thing. When real life changes, adjust the Plan instead of carrying old intentions forward.'}),
  Object.freeze({key:'progress',number:'4',title:'Progress',copy:'Record what actually happened.',detail:'Action creates factual Progress. Progress then helps you improve the next Plan — and, when needed, rethink the Direction.'})
]);

function ensureFirstRunStyles(){
  if(typeof document==='undefined'||document.querySelector(`link[href="${FIRST_RUN_STYLESHEET}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=FIRST_RUN_STYLESHEET;link.dataset.experience2FirstRun='true';document.head.append(link);
}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,(character)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));}
function addDays(dateText,amount){const date=new Date(`${dateText}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
function todayKey(){const now=new Date();const offset=now.getTimezoneOffset()*60000;return new Date(now.getTime()-offset).toISOString().slice(0,10);}
function minutesLabel(value){const minutes=Math.max(0,Number(value)||0);if(!minutes)return 'No duration';const hours=Math.floor(minutes/60),rest=minutes%60;return hours&&rest?`${hours}h ${rest}m`:hours?`${hours}h`:`${rest}m`;}
function itemMeta(item){return [item.activity_label&&item.activity_label!==item.title?item.activity_label:null,item.subtype,item.planned_time,item.planned_minutes?`${minutesLabel(item.planned_minutes)} planned`:null].filter(Boolean).join(' · ');}
function glyph(item){return escapeHtml(String(item.activity_label||item.title||'A').trim().slice(0,1).toUpperCase()||'A');}
function summaryRows(model,key){return Array.isArray(model?.summary?.[key])?model.summary[key]:[];}
function activeGoals(model){return Array.isArray(model?.goals)?model.goals.filter(goal=>goal.status!=='archived'):[];}
function activeRoutine(model){return Array.isArray(model?.routineItems)?model.routineItems.filter(item=>Number(item.active??1)===1):[];}
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
async function loadRoutineSignal(date){
  try{const response=await api.get(`/v1/capacity/commitments?date=${encodeURIComponent(date)}`);return {known:true,items:Array.isArray(response?.items)?response.items:[]};}
  catch{return {known:false,items:[]};}
}

export async function loadToday(date=todayKey()){
  const tomorrow=addDays(date,1);
  const [todayPlan,tomorrowPlan,todaySummary,goalSignal,routineSignal]=await Promise.all([
    api.get(`/v1/daily-plan?date=${encodeURIComponent(date)}`),
    api.get(`/v1/daily-plan?date=${encodeURIComponent(tomorrow)}`),
    api.get(`/v1/today?date=${encodeURIComponent(date)}&period=week`),
    loadGoalSignal(),
    loadRoutineSignal(date)
  ]);
  return {date,tomorrow,today:todayPlan.items||[],tomorrowItems:tomorrowPlan.items||[],summary:todaySummary,goals:goalSignal.goals,goalsKnown:goalSignal.known,routineItems:routineSignal.items,routineKnown:routineSignal.known};
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

function stepActionLabel(step,current='direction'){
  if(step.key==='direction')return current==='direction'?'Create direction':'Review direction';
  if(step.key==='plan')return 'Open Plan';
  if(step.key==='action')return 'Add an action';
  return 'Open Progress';
}

function onboardingSteps(current='direction'){
  const currentIndex=Math.max(0,ONBOARDING_STEPS.findIndex(step=>step.key===current));
  return `<div class="today-onboarding-steps" aria-label="Growth Compass flow">${ONBOARDING_STEPS.map((step,index)=>`<details class="today-onboarding-step${index<currentIndex?' is-done':''}${index===currentIndex?' is-current':''}" data-today-flow-step="${step.key}"><summary><span>${index<currentIndex?'✓':step.number}</span><div><strong>${step.title}</strong><p>${step.copy}</p></div><b aria-hidden="true">+</b></summary><div class="today-onboarding-step-body"><p class="today-onboarding-step-detail">${step.detail}</p><button type="button" class="today-step-action" data-today-step-action="${step.key}">${stepActionLabel(step,current)}<span aria-hidden="true">→</span></button></div></details>`).join('')}</div>`;
}
function flowLoopHtml(){return `<p class="today-flow-loop"><strong>Direction</strong> guides the <strong>Plan</strong>. The Plan chooses <strong>Actions</strong>. Actions create <strong>Progress</strong>. Progress helps you adjust what comes next.</p>`;}

function welcomeHtml(){
  return `<div class="today-view today-first-run">
    <section class="living-surface today-onboarding" aria-labelledby="todayWelcomeTitle">
      <div class="today-onboarding-kicker"><span>Empty compass</span><b>Start with one direction · about 90 seconds</b></div>
      <div class="today-onboarding-copy"><p class="eyebrow">Welcome to Growth Compass</p><h2 id="todayWelcomeTitle">Start with what matters.</h2><p>Choose one area you want to grow. Growth Compass helps you turn that direction into a practical next step, act on it, and learn from what actually happened.</p></div>
      <div class="today-onboarding-actions"><button type="button" class="primary-button" data-today-build-compass>Create my compass</button></div>
      <p class="today-onboarding-micro">Start with one area. You can change everything later.</p>
      <div class="today-onboarding-guide"><strong>How your compass grows</strong><span>Open any step to understand it or start there.</span></div>
      ${onboardingSteps('direction')}
      ${flowLoopHtml()}
    </section>
  </div>`;
}

function routineChoiceHtml(){return `<section class="today-routine-start" aria-labelledby="todayRoutineTitle"><div><p class="eyebrow">Make the Plan fit your real life</p><h3 id="todayRoutineTitle">How predictable is your week?</h3><p>Growth Compass can protect the hours that are already spoken for, so it never suggests exercise in the middle of work.</p></div><div class="today-routine-choices"><button type="button" data-today-set-routine><strong>I have a regular routine</strong><span>Set work, sleep, school, commute or family time once.</span><b>Set my routine →</b></button><button type="button" data-today-plan-flexible><strong>My week changes a lot</strong><span>Choose times as you plan. Add fixed blocks only when they become useful.</span><b>Keep it flexible →</b></button></div><button type="button" class="ghost-button today-routine-skip" data-today-go-plan>Skip for now</button></section>`;}
function planPromptHtml(model){
  const goal=activeGoals(model)[0];
  const areaName=goal?.area_name||firstRunAreaName||'Your first direction';
  const needsRoutineChoice=model?.routineKnown===true&&activeRoutine(model).length===0;
  return `<div class="today-view today-first-run">
    <section class="living-surface today-onboarding today-onboarding-next" aria-labelledby="todayPlanStartTitle">
      <div class="today-onboarding-kicker"><span>Compass started</span><b>2 of 4</b></div>
      <div class="today-onboarding-copy"><p class="eyebrow">Your first direction</p><h2 id="todayPlanStartTitle">Your compass has started.</h2><p>You do not need a full roadmap. Choose one useful next step that would move this direction forward.</p></div>
      ${goal?`<div class="today-created-direction"><span>${escapeHtml(areaName)}</span><strong>${escapeHtml(goal.name)}</strong>${goal.why_text?`<p>${escapeHtml(goal.why_text)}</p>`:''}</div>`:''}
      ${needsRoutineChoice?routineChoiceHtml():`<div class="today-onboarding-actions"><button type="button" class="primary-button" data-today-go-plan>Plan my first step</button><button type="button" class="ghost-button" data-today-go-goals>Review my direction</button></div>`}
      <div class="today-onboarding-guide"><strong>Keep building</strong><span>Schedule is the time layer inside Plan — not another goal to maintain.</span></div>
      ${onboardingSteps('plan')}
      ${flowLoopHtml()}
    </section>
  </div>`;
}

function openDayHtml(){
  return `<section class="static-surface today-open-day"><div><p class="eyebrow">Today</p><h2>Your day is open</h2><p>Nothing needs to be added just to fill space. Plan something only if it genuinely deserves attention.</p></div><button type="button" class="secondary-button" data-today-go-plan>Plan today</button></section>`;
}

export function renderToday(model){
  const stage=todayStage(model);
  if(stage==='welcome'){ensureFirstRunStyles();return welcomeHtml();}
  if(stage==='plan'){ensureFirstRunStyles();return planPromptHtml(model);}
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

function firstAreaOptionsHtml(){
  return FIRST_RUN_AREAS.map((area,index)=>`<label class="today-first-area-option"><input type="radio" name="todayFirstArea" value="${area.key}" ${index===0?'checked':''}><span class="today-first-area-card"><strong>${escapeHtml(area.name)}</strong><span>${escapeHtml(area.copy)}</span></span></label>`).join('');
}

async function openFirstGoal(reload){
  ensureFirstRunStyles();
  let areas=[];
  try{const response=await api.get('/v1/areas');areas=Array.isArray(response?.items)?response.items:[];}catch{}
  const close=overlay(`<section class="today-sheet today-first-goal-sheet static-surface" role="dialog" aria-modal="true" aria-labelledby="todayFirstGoalTitle"><button type="button" class="today-sheet-close" data-today-close aria-label="Close">×</button><p class="eyebrow">Create your compass · direction</p><h2 id="todayFirstGoalTitle">Where do you want to grow first?</h2><p>Choose one area and one meaningful direction. This is a starting point, not a permanent category or commitment.</p><form id="todayFirstGoalForm"><fieldset class="today-first-area"><legend>Choose one area</legend><div class="today-first-area-grid">${firstAreaOptionsHtml()}</div></fieldset><div class="today-first-area-custom" id="todayFirstAreaCustomWrap" hidden><label><span>Name this life area</span><input id="todayFirstAreaCustom" maxlength="80" placeholder="e.g. Creativity"></label></div><label class="today-first-goal-prompt"><span>What would meaningful progress look like?</span><input id="todayFirstGoalName" maxlength="120" required placeholder="${escapeHtml(FIRST_RUN_AREAS[0].sample)}"></label><label class="today-first-goal-why"><span>Why does this matter? <small>optional</small></span><textarea id="todayFirstGoalWhy" maxlength="1000" placeholder="A short reason can help keep this direction grounded"></textarea></label><p class="today-first-goal-note">Keep it simple. Targets and measurement details can be added later if they become useful.</p><button class="primary-button" type="submit">Set my direction</button></form></section>`,{initialFocus:'input[name="todayFirstArea"]'});
  const areaInputs=[...document.querySelectorAll('input[name="todayFirstArea"]')];
  const syncArea=({focusCustom=false}={})=>{const selected=document.querySelector('input[name="todayFirstArea"]:checked')?.value||'career';document.querySelectorAll('.today-first-area-option').forEach(label=>label.classList.toggle('is-selected',label.querySelector('input')?.checked));const customWrap=document.querySelector('#todayFirstAreaCustomWrap');if(customWrap)customWrap.hidden=selected!=='custom';const area=FIRST_RUN_AREAS.find(candidate=>candidate.key===selected)||FIRST_RUN_AREAS[0];const goalInput=document.querySelector('#todayFirstGoalName');if(goalInput&&!goalInput.value)goalInput.placeholder=area.sample;if(selected==='custom'&&focusCustom)requestAnimationFrame(()=>document.querySelector('#todayFirstAreaCustom')?.focus());};
  areaInputs.forEach(input=>input.addEventListener('change',()=>syncArea({focusCustom:true})));
  syncArea();
  document.querySelector('#todayFirstGoalForm')?.addEventListener('submit',async event=>{event.preventDefault();const selectedKey=document.querySelector('input[name="todayFirstArea"]:checked')?.value||'';const selectedArea=FIRST_RUN_AREAS.find(area=>area.key===selectedKey);if(!selectedArea)return toast('Choose an area to begin');const customName=document.querySelector('#todayFirstAreaCustom')?.value.trim()||'';const areaName=selectedKey==='custom'?customName:selectedArea.name;if(!areaName)return toast('Name the life area you want to grow');const name=document.querySelector('#todayFirstGoalName')?.value.trim()||'';if(!name)return toast('Describe the direction you want to move toward');try{let area=areas.find(candidate=>candidate.status!=='archived'&&String(candidate.name||'').trim().toLowerCase()===areaName.toLowerCase());if(!area){area=await goalsCapability.createArea({name:areaName,template_key:null,sort_order:100});areas.push(area);}const payload={name,area_id:area?.id??null,measurement_type:'milestone',target_period:'none',target_value:null,minimum_value:null,unit:null,priority:'medium',status:'active',why_text:document.querySelector('#todayFirstGoalWhy')?.value.trim()||null,description:null};await goalsCapability.create(payload);firstRunContinuation='plan';firstRunAreaName=areaName;close();toast('Your compass has started');await reload();}catch(error){toast(error.message||'Could not create your first direction');}});
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
  document.querySelector('[data-today-build-compass]')?.addEventListener('click',()=>{void openFirstGoal(refresh);});
  document.querySelectorAll('[data-today-step-action]').forEach(button=>button.addEventListener('click',()=>{const step=button.dataset.todayStepAction;if(step==='direction'){if(todayStage(model)==='welcome'){void openFirstGoal(refresh);return;}firstRunContinuation='';navigateTo('goals');return;}if(step==='plan'){firstRunContinuation='';navigateTo('plan');return;}if(step==='action'){document.querySelector('[data-open-add]')?.click();return;}if(step==='progress'){firstRunContinuation='';navigateTo('progress');}}));
  document.querySelector('[data-today-set-routine]')?.addEventListener('click',()=>{firstRunContinuation='';navigateTo('schedule');});
  document.querySelector('[data-today-plan-flexible]')?.addEventListener('click',()=>{try{localStorage.setItem('growth-compass:preview2:e2:schedule-style','flexible');}catch{}firstRunContinuation='';navigateTo('plan');});
  document.querySelectorAll('[data-today-go-plan]').forEach(button=>button.addEventListener('click',()=>{firstRunContinuation='';navigateTo('plan');}));
  document.querySelectorAll('[data-today-go-goals]').forEach(button=>button.addEventListener('click',()=>{firstRunContinuation='';navigateTo('goals');}));
  document.querySelector('[data-today-jump-plan]')?.addEventListener('click',()=>document.querySelector('#todayPlanList')?.scrollIntoView({behavior:'smooth',block:'start'}));
  document.querySelectorAll('[data-today-start]').forEach(button=>button.addEventListener('click',async()=>{try{await api.put(`/v1/daily-plan/${button.dataset.todayStart}`,{status:'in_progress'});toast('Started');await refresh();}catch(error){toast(error.message||'Could not start item');}}));
  document.querySelectorAll('[data-today-done]').forEach(button=>button.addEventListener('click',()=>{const item=[...(model.today||[]),...(model.tomorrowItems||[])].find(candidate=>Number(candidate.id)===Number(button.dataset.todayDone));void completeItem(item,refresh);}));
  document.querySelectorAll('[data-today-change]').forEach(button=>button.addEventListener('click',()=>{const item=[...(model.today||[]),...(model.tomorrowItems||[])].find(candidate=>Number(candidate.id)===Number(button.dataset.todayChange));changeItem(item,refresh);}));
}
