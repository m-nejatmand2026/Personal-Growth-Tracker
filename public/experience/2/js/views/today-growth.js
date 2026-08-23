import { wellbeingCapability } from '../capabilities/wellbeing.js';

const ENERGY=Object.freeze([
  {label:'Drained',score:-3,row:5},
  {label:'Low',score:-1,row:4},
  {label:'Okay',score:0,row:3},
  {label:'Good',score:1,row:1},
  {label:'Strong',score:3,row:0}
]);
const MOOD=Object.freeze([
  {label:'Very negative',short:'Very low',score:-3,col:0},
  {label:'Negative',short:'Low',score:-1,col:1},
  {label:'Neutral',short:'Neutral',score:0,col:3},
  {label:'Positive',short:'Positive',score:1,col:4},
  {label:'Very positive',short:'Very good',score:3,col:5}
]);

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(message){const host=document.querySelector('#toastHost');if(!host)return;host.innerHTML=`<div class="today-growth-toast static-surface">${escapeHtml(message)}</div>`;setTimeout(()=>{if(host.textContent===message)host.innerHTML='';},2400);}
function valueButtons(kind,values,current=null){return values.map((item,index)=>`<button type="button" class="checkin-value${Number(current)===Number(item.score)?' is-selected':''}" data-checkin-kind="${kind}" data-checkin-index="${index}" aria-pressed="${Number(current)===Number(item.score)}"><span aria-hidden="true"></span><strong>${escapeHtml(kind==='mood'?(item.short||item.label):item.label)}</strong></button>`).join('');}
function navigate(view){if(typeof window.__gcExperience2Navigate==='function'){window.__gcExperience2Navigate(view);return;}document.dispatchEvent(new CustomEvent('gc:navigate-view',{detail:{view}}));}
function replaceNavAction(root,selector,handler){root.querySelectorAll(selector).forEach(button=>{const clone=button.cloneNode(true);button.replaceWith(clone);clone.addEventListener('click',handler);});}
function repairNavigation(root){
  replaceNavAction(root,'[data-today-set-routine]',()=>navigate('schedule'));
  replaceNavAction(root,'[data-today-plan-flexible]',()=>{try{localStorage.setItem('growth-compass:preview2:e2:schedule-style','flexible');}catch{}navigate('plan');});
  replaceNavAction(root,'[data-today-go-plan]',()=>navigate('plan'));
  replaceNavAction(root,'[data-today-go-goals]',()=>navigate('goals'));
}

function simplifyFirstRun(root){
  const first=root.querySelector('.today-first-run');if(!first)return;
  root.querySelectorAll('.today-onboarding-guide,.today-onboarding-steps,.today-flow-loop').forEach(node=>node.remove());
  const welcome=root.querySelector('#todayWelcomeTitle');
  if(welcome){welcome.textContent='What would make the next year meaningfully better?';const paragraph=welcome.parentElement?.querySelector('p:last-child');if(paragraph)paragraph.textContent='Start with one part of life you want to improve.';const button=root.querySelector('[data-today-build-compass]');if(button)button.textContent='Choose what matters';}
  const plan=root.querySelector('#todayPlanStartTitle');
  if(plan){plan.textContent='Choose one useful move.';const paragraph=plan.parentElement?.querySelector('p:last-child');if(paragraph)paragraph.textContent='Pick one small step for this week.';}
  const guided=root.querySelector('#todayCompassReadyTitle');
  if(guided){guided.textContent='Make one part of the direction real.';const paragraph=guided.parentElement?.querySelector('p:last-child');if(paragraph)paragraph.textContent='Choose the next useful step.';}
  const onboarding=first.querySelector('.today-onboarding');
  if(onboarding&&!onboarding.querySelector('.onboarding-compass-line')){
    const line=document.createElement('div');line.className='onboarding-compass-line';line.setAttribute('aria-label','Direction to action');line.innerHTML='<span class="is-current">Direction</span><i></i><span>Next step</span><i></i><span>Today</span><i></i><span>Learn</span>';const actions=onboarding.querySelector('.today-onboarding-actions,.today-routine-start');(actions||onboarding).before(line);
  }
  repairNavigation(root);
}

function minutesLabel(value){const minutes=Math.max(0,Math.round(Number(value)||0));const hours=Math.floor(minutes/60),rest=minutes%60;if(!hours)return`${rest}m`;if(!rest)return`${hours}h`;return`${hours}h ${rest}m`;}
function activeGoals(model){return (model?.goals||[]).filter(goal=>goal.status!=='archived'&&goal.status!=='completed');}
function progressRows(model){return Array.isArray(model?.summary?.progress)?model.summary.progress:[];}
function energyLabel(value){const match=ENERGY.find(item=>Number(item.score)===Number(value));return match?.label||'Not set';}
function moodLabel(value){const match=MOOD.find(item=>Number(item.score)===Number(value));return match?.short||match?.label||'Not set';}

function glanceMarkup(model,existing=null){
  const focus=activeGoals(model)[0]||null;
  const active=(model?.today||[]).find(item=>item.status==='in_progress');
  const planned=(model?.today||[]).find(item=>item.status==='planned');
  const attention=active||planned||null;
  const progress=progressRows(model);
  const minutes=progress.reduce((sum,row)=>sum+Math.max(0,Number(row.minutes)||0),0);
  const title=active?active.title:planned?planned.title:'Open space';
  const nowLabel=active?'In progress':planned?'Next':'Today';
  return `<section class="today-glance" aria-labelledby="todayGlanceTitle">
    <div class="today-glance-main">
      <div><p class="eyebrow">${escapeHtml(nowLabel)}</p><h2 class="today-glance-title" id="todayGlanceTitle">${escapeHtml(title)}</h2></div>
      <div class="today-route" aria-label="Direction to current attention">
        <span class="today-route-node"><small>Direction</small><strong>${escapeHtml(focus?.name||'Choose what matters')}</strong></span>
        <i class="today-route-line" aria-hidden="true"></i>
        <span class="today-route-node is-now"><small>${escapeHtml(nowLabel)}</small><strong>${escapeHtml(attention?.title||'Keep the day open')}</strong></span>
      </div>
    </div>
    <dl class="today-signal-cluster" aria-label="Today at a glance">
      <div class="today-signal"><span class="today-signal-mark" aria-hidden="true">${escapeHtml(String(progress.length))}</span><div class="today-signal-copy"><dt>Evidence</dt><dd>${escapeHtml(minutesLabel(minutes))}</dd><span>${progress.length} ${progress.length===1?'record':'records'}</span></div></div>
      <div class="today-signal"><span class="today-signal-mark" aria-hidden="true">E</span><div class="today-signal-copy"><dt>Energy</dt><dd>${escapeHtml(energyLabel(existing?.energy_score))}</dd><span>reported today</span></div></div>
      <div class="today-signal"><span class="today-signal-mark" aria-hidden="true">M</span><div class="today-signal-copy"><dt>Mood</dt><dd>${escapeHtml(moodLabel(existing?.valence_score))}</dd><span>reported today</span></div></div>
    </dl>
  </section>`;
}

function checkinMarkup(existing=null){
  return `<section class="today-checkin" aria-labelledby="todayCheckinTitle"><div class="today-checkin-head"><div><p class="eyebrow">Quick check-in</p><h2 id="todayCheckinTitle">Energy + mood</h2></div>${existing?'<span class="checkin-recorded">Recorded</span>':''}</div><div class="today-checkin-groups"><fieldset><legend>Energy</legend><div class="checkin-scale">${valueButtons('energy',ENERGY,existing?.energy_score)}</div></fieldset><fieldset><legend>Mood</legend><div class="checkin-scale">${valueButtons('mood',MOOD,existing?.valence_score)}</div></fieldset></div><p class="today-checkin-status" role="status">${existing?'Today’s observation is recorded.':'Choose energy and mood.'}</p></section>`;
}

function bindCheckin(section,date,existing=null,onSaved){
  let energyIndex=existing?ENERGY.findIndex(item=>Number(item.score)===Number(existing.energy_score)):null;
  let moodIndex=existing?MOOD.findIndex(item=>Number(item.score)===Number(existing.valence_score)):null;
  if(energyIndex<0)energyIndex=null;if(moodIndex<0)moodIndex=null;
  let saving=false;
  const status=section.querySelector('.today-checkin-status');
  const sync=()=>{
    section.querySelectorAll('[data-checkin-kind="energy"]').forEach(button=>{const selected=Number(button.dataset.checkinIndex)===energyIndex;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
    section.querySelectorAll('[data-checkin-kind="mood"]').forEach(button=>{const selected=Number(button.dataset.checkinIndex)===moodIndex;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
  };
  const save=async()=>{
    if(energyIndex==null||moodIndex==null||saving)return;
    saving=true;section.classList.add('is-saving');if(status)status.textContent='Recording…';
    const energy=ENERGY[energyIndex],mood=MOOD[moodIndex];
    try{await wellbeingCapability.recordEnergy({occurred_on:date,label:`${energy.label} energy · ${mood.label} mood`,row_idx:energy.row,col_idx:mood.col,energy_score:energy.score,valence_score:mood.score,note:null});section.classList.remove('is-saving');section.classList.add('is-recorded');if(status)status.textContent='Recorded. This is an observation, not a score.';onSaved?.({energy_score:energy.score,valence_score:mood.score});toast('Energy and mood recorded');}
    catch(error){section.classList.remove('is-saving');if(status)status.textContent=error.message||'Could not record wellbeing';}
    finally{saving=false;}
  };
  section.querySelectorAll('[data-checkin-kind="energy"]').forEach(button=>button.addEventListener('click',()=>{energyIndex=Number(button.dataset.checkinIndex);sync();void save();}));
  section.querySelectorAll('[data-checkin-kind="mood"]').forEach(button=>button.addEventListener('click',()=>{moodIndex=Number(button.dataset.checkinIndex);sync();void save();}));
}

function updateGlanceSignals(root,existing){
  const signals=root.querySelectorAll('.today-signal-copy dd');
  if(signals[1])signals[1].textContent=energyLabel(existing?.energy_score);
  if(signals[2])signals[2].textContent=moodLabel(existing?.valence_score);
}

export async function enhanceToday({root=document,model}={}){
  simplifyFirstRun(root);
  repairNavigation(root);
  if(root.querySelector('.today-first-run'))return;
  const view=root.querySelector('.today-view');if(!view)return;
  let day=null;try{day=await wellbeingCapability.day(model.date);}catch{}
  if(!view.isConnected)return;
  if(!view.querySelector('.today-glance')){
    const holder=document.createElement('div');holder.innerHTML=glanceMarkup(model,day?.energy||null);const glance=holder.firstElementChild;const grid=view.querySelector('.today-grid');if(grid)grid.before(glance);else view.prepend(glance);
  }
  if(view.querySelector('.today-checkin'))return;
  const section=document.createElement('div');section.innerHTML=checkinMarkup(day?.energy||null);const checkin=section.firstElementChild;
  const mainColumn=view.querySelector('.today-main-column');
  const grid=view.querySelector('.today-grid');
  if(mainColumn)mainColumn.append(checkin);else if(grid)grid.after(checkin);else view.append(checkin);
  bindCheckin(checkin,model.date,day?.energy||null,updated=>updateGlanceSignals(view,updated));
}
