import { wellbeingCapability } from '../capabilities/wellbeing.js';

const ENERGY=Object.freeze([
  {label:'Drained',score:-3,row:5},
  {label:'Low',score:-1,row:4},
  {label:'Okay',score:0,row:3},
  {label:'Good',score:1,row:1},
  {label:'Strong',score:3,row:0}
]);
const MOOD=Object.freeze([
  {label:'Very negative',score:-3,col:0},
  {label:'Negative',score:-1,col:1},
  {label:'Neutral',score:0,col:3},
  {label:'Positive',score:1,col:4},
  {label:'Very positive',score:3,col:5}
]);

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(message){const host=document.querySelector('#toastHost');if(!host)return;host.innerHTML=`<div class="today-growth-toast static-surface">${escapeHtml(message)}</div>`;setTimeout(()=>{if(host.textContent===message)host.innerHTML='';},2400);}
function valueButtons(kind,values,current=null){return values.map((item,index)=>`<button type="button" class="checkin-value${Number(current)===Number(item.score)?' is-selected':''}" data-checkin-kind="${kind}" data-checkin-index="${index}" aria-pressed="${Number(current)===Number(item.score)}"><span aria-hidden="true"></span><strong>${escapeHtml(item.label)}</strong></button>`).join('');}

function simplifyFirstRun(root){
  const first=root.querySelector('.today-first-run');if(!first)return;
  root.querySelectorAll('.today-onboarding-guide,.today-onboarding-steps,.today-flow-loop').forEach(node=>node.remove());
  const welcome=root.querySelector('#todayWelcomeTitle');
  if(welcome){welcome.textContent='What would make the next year meaningfully better?';const paragraph=welcome.parentElement?.querySelector('p:last-child');if(paragraph)paragraph.textContent='Start with one part of life you want to improve. You only need one direction to begin.';const button=root.querySelector('[data-today-build-compass]');if(button)button.textContent='Choose what matters';}
  const plan=root.querySelector('#todayPlanStartTitle');
  if(plan){plan.textContent='Choose one useful move.';const paragraph=plan.parentElement?.querySelector('p:last-child');if(paragraph)paragraph.textContent='You do not need a roadmap. Pick one small step that would make this direction more real this week.';}
  const guided=root.querySelector('#todayCompassReadyTitle');
  if(guided){guided.textContent='Make one part of the direction real.';const paragraph=guided.parentElement?.querySelector('p:last-child');if(paragraph)paragraph.textContent='Choose a useful next step and give it a place that fits the life you already have.';}
  const onboarding=first.querySelector('.today-onboarding');
  if(onboarding&&!onboarding.querySelector('.onboarding-compass-line')){
    const line=document.createElement('div');line.className='onboarding-compass-line';line.setAttribute('aria-label','Your compass grows from direction to action');line.innerHTML='<span class="is-current">Direction</span><i></i><span>Next step</span><i></i><span>Today</span><i></i><span>Learn</span>';const actions=onboarding.querySelector('.today-onboarding-actions,.today-routine-start');(actions||onboarding).before(line);
  }
}

function checkinMarkup(existing=null){
  return `<section class="today-checkin" aria-labelledby="todayCheckinTitle"><div class="today-checkin-head"><div><p class="eyebrow">A few seconds of evidence</p><h2 id="todayCheckinTitle">How are you right now?</h2><p>Energy and mood are separate. Recording both helps your baseline become more useful over time.</p></div>${existing?'<span class="checkin-recorded">Recorded today</span>':''}</div><div class="today-checkin-groups"><fieldset><legend>Energy</legend><div class="checkin-scale">${valueButtons('energy',ENERGY,existing?.energy_score)}</div></fieldset><fieldset><legend>Mood</legend><div class="checkin-scale">${valueButtons('mood',MOOD,existing?.valence_score)}</div></fieldset></div><p class="today-checkin-status" role="status">${existing?'You can update today’s check-in if your state has changed.':'Choose one energy level and one mood level.'}</p></section>`;
}

function bindCheckin(section,date){
  let energyIndex=null,moodIndex=null,saving=false;
  const status=section.querySelector('.today-checkin-status');
  const sync=()=>{
    section.querySelectorAll('[data-checkin-kind="energy"]').forEach(button=>{const selected=Number(button.dataset.checkinIndex)===energyIndex;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
    section.querySelectorAll('[data-checkin-kind="mood"]').forEach(button=>{const selected=Number(button.dataset.checkinIndex)===moodIndex;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
  };
  const save=async()=>{
    if(energyIndex==null||moodIndex==null||saving)return;
    saving=true;section.classList.add('is-saving');if(status)status.textContent='Recording…';
    const energy=ENERGY[energyIndex],mood=MOOD[moodIndex];
    try{await wellbeingCapability.recordEnergy({occurred_on:date,label:`${energy.label} energy · ${mood.label} mood`,row_idx:energy.row,col_idx:mood.col,energy_score:energy.score,valence_score:mood.score,note:null});section.classList.remove('is-saving');section.classList.add('is-recorded');if(status)status.textContent='Recorded. This is an observation, not a score.';toast('Energy and mood recorded');}
    catch(error){section.classList.remove('is-saving');if(status)status.textContent=error.message||'Could not record wellbeing';}
    finally{saving=false;}
  };
  section.querySelectorAll('[data-checkin-kind="energy"]').forEach(button=>button.addEventListener('click',()=>{energyIndex=Number(button.dataset.checkinIndex);sync();void save();}));
  section.querySelectorAll('[data-checkin-kind="mood"]').forEach(button=>button.addEventListener('click',()=>{moodIndex=Number(button.dataset.checkinIndex);sync();void save();}));
}

export async function enhanceToday({root=document,model}={}){
  simplifyFirstRun(root);
  if(root.querySelector('.today-first-run'))return;
  const view=root.querySelector('.today-view');if(!view||view.querySelector('.today-checkin'))return;
  let day=null;try{day=await wellbeingCapability.day(model.date);}catch{}
  if(!view.isConnected)return;
  const section=document.createElement('div');section.innerHTML=checkinMarkup(day?.energy||null);const checkin=section.firstElementChild;
  const grid=view.querySelector('.today-grid');if(grid)grid.after(checkin);else view.append(checkin);
  bindCheckin(checkin,model.date);
}
