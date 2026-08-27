import { api } from './core/api.js';
import { goalsCapability } from './capabilities/goals.js';
import { activitiesCapability } from './capabilities/activities.js';
import { writePreference } from './core/preferences.js';

const AREAS=Object.freeze([
  {key:'career',name:'Career',copy:'Work, skills and professional growth',direction:'Have work that feels challenging and sustainable',action:'Take one useful step on an important piece of work'},
  {key:'health',name:'Health',copy:'Energy, fitness and wellbeing',direction:'Feel stronger and more energetic most days',action:'Do one thing today that supports my energy'},
  {key:'learning',name:'Learning',copy:'Knowledge and new capabilities',direction:'Become comfortable using a new skill in real situations',action:'Practice the skill in one small real situation'},
  {key:'finance',name:'Finance',copy:'Security, freedom and money',direction:'Build more financial breathing room',action:'Review one expense or decision I can improve'},
  {key:'relationships',name:'Relationships',copy:'Family, friendship and connection',direction:'Make more time for the people who matter',action:'Reach out to one person I want to stay close to'},
  {key:'personal',name:'Personal Growth',copy:'Character, habits and mindset',direction:'Respond more consistently in the way I want to',action:'Choose one small behavior to practice today'},
  {key:'custom',name:'Something else',copy:'Use your own life area',direction:'Describe the change you want to move toward',action:'Choose one useful next step'}
]);

let wizardOpen=false;
let sessionDraft={step:1,areaKey:'',customArea:'',direction:'',action:'',duration:null,saving:false,startedAt:null};
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function todayKey(){const now=new Date();const offset=now.getTimezoneOffset()*60000;return new Date(now.getTime()-offset).toISOString().slice(0,10);}
function toast(message){const host=document.querySelector('#toastHost');if(!host)return;host.innerHTML=`<div class="today-toast static-surface">${escapeHtml(message)}</div>`;setTimeout(()=>{if(host.textContent===message)host.innerHTML='';},2600);}
function navigate(view){if(typeof window.__gcExperience2Navigate==='function')window.__gcExperience2Navigate(view);else document.dispatchEvent(new CustomEvent('gc:navigate-view',{detail:{view}}));}
function selectedArea(state){return AREAS.find(area=>area.key===state.areaKey)||null;}
function areaMarkup(state){return AREAS.map(area=>`<label class="gc-onboard-area${state.areaKey===area.key?' is-selected':''}"><input type="radio" name="gcArea" value="${area.key}"${state.areaKey===area.key?' checked':''}><span><strong>${escapeHtml(area.name)}</strong><small>${escapeHtml(area.copy)}</small></span></label>`).join('');}
function progressMarkup(step){return `<div class="gc-onboard-progress" aria-label="Setup progress"><span class="${step>=1?'is-active':''}">1</span><i></i><span class="${step>=2?'is-active':''}">2</span><i></i><span class="${step>=3?'is-active':''}">3</span></div>`;}
function durationButton(value,label,state){const selected=value===state.duration;return `<button type="button" class="${selected?'is-selected':''}" data-duration="${value==null?'unknown':value}" aria-pressed="${selected}">${label}</button>`;}

async function persist({areaKey,customArea,direction,action,duration,startedAt}){
  const areaDef=AREAS.find(area=>area.key===areaKey);
  if(!areaDef)throw new Error('Choose an area you want to grow.');
  const areaName=areaKey==='custom'?customArea.trim():areaDef.name;
  const directionName=direction.trim(),actionName=action.trim(),date=todayKey();
  if(!areaName)throw new Error('Name the area you want to grow.');
  if(!directionName)throw new Error('Describe the change you want.');
  if(!actionName)throw new Error('Choose one next action.');
  const areaResponse=await api.get('/v1/areas').catch(()=>({items:[]}));
  let area=(areaResponse.items||[]).find(item=>item.status!=='archived'&&String(item.name||'').trim().toLowerCase()===areaName.toLowerCase());
  if(!area)area=await goalsCapability.createArea({name:areaName,template_key:null,sort_order:100});
  const goalResponse=await api.get('/v1/goals?include_archived=1').catch(()=>({items:[]}));
  let goal=(goalResponse.items||[]).find(item=>item.status!=='archived'&&Number(item.area_id)===Number(area?.id)&&String(item.name||'').trim().toLowerCase()===directionName.toLowerCase());
  if(!goal)goal=await goalsCapability.create({name:directionName,area_id:area?.id??null,measurement_type:'milestone',target_period:'none',target_value:null,minimum_value:null,unit:null,priority:'medium',status:'active',why_text:null,description:null});
  let activity=(await activitiesCapability.list({goalId:Number(goal.id)}).catch(()=>[])).find(item=>item.status!=='archived'&&String(item.name||'').trim().toLowerCase()===actionName.toLowerCase());
  if(!activity)activity=await activitiesCapability.create({goal_id:Number(goal.id),name:actionName,description:null,sort_order:100});
  const plan=await api.get(`/v1/daily-plan?date=${encodeURIComponent(date)}`).catch(()=>({items:[]}));
  const alreadyPlanned=(plan.items||[]).some(item=>['planned','in_progress'].includes(item.status)&&String(item.activity_key||'')===String(activity.key||'')&&String(item.title||'').trim().toLowerCase()===actionName.toLowerCase());
  if(!alreadyPlanned)await api.post('/v1/daily-plan',{planned_for:date,planned_time:null,title:actionName,activity_key:activity.key,activity_label:activity.name||actionName,subtype:null,planned_minutes:Number.isInteger(duration)?duration:null,note:null,status:'planned',source:'manual'});
  writePreference('first-run-success-v1',JSON.stringify({completedAt:new Date().toISOString(),elapsedMs:Math.max(0,Date.now()-Number(startedAt||Date.now())),goalId:Number(goal.id),activityKey:String(activity.key||'')}));
}

function openWizard(){
  if(wizardOpen)return;wizardOpen=true;
  const host=document.querySelector('#overlayHost');if(!host){wizardOpen=false;return;}
  const opener=document.activeElement;
  if(!sessionDraft.startedAt)sessionDraft.startedAt=Date.now();
  const state=sessionDraft;
  document.body.classList.add('gc-onboard-open');
  const close=()=>{state.saving=false;wizardOpen=false;host.removeEventListener('keydown',trap);host.innerHTML='';document.body.classList.remove('gc-onboard-open');opener?.focus?.({preventScroll:true});};
  const trap=event=>{if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;const nodes=[...host.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled])')].filter(node=>!node.hidden&&node.offsetParent!==null);if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};
  host.addEventListener('keydown',trap,{once:false});
  const render=()=>{
    const area=selectedArea(state),custom=state.areaKey==='custom';
    let body='';
    if(state.step===1)body=`<p class="eyebrow">Start with one area</p><h2 id="gcOnboardTitle">Where do you want to grow first?</h2><p class="gc-onboard-lead">Choose one. Nothing is selected for you, and you can change it later.</p><div class="gc-onboard-area-grid">${areaMarkup(state)}</div><label class="gc-onboard-custom" ${custom?'':'hidden'}>Name this area<input id="gcOnboardCustom" maxlength="80" value="${escapeHtml(state.customArea)}" placeholder="e.g. Creativity"></label><button type="button" class="primary-button gc-onboard-primary" data-next>Continue</button>`;
    if(state.step===2)body=`<p class="eyebrow">Describe the change</p><h2 id="gcOnboardTitle">What would meaningful progress look like?</h2><p class="gc-onboard-lead">Use plain language. This becomes your first Direction.</p><label class="gc-onboard-field"><span>Desired change</span><textarea id="gcOnboardDirection" maxlength="120" rows="3" placeholder="e.g. ${escapeHtml(area?.direction||'Describe the change you want to move toward')}">${escapeHtml(state.direction)}</textarea></label><div class="gc-onboard-actions"><button type="button" class="ghost-button" data-back>Back</button><button type="button" class="primary-button" data-next>Continue</button></div>`;
    if(state.step===3)body=`<p class="eyebrow">Choose the next move</p><h2 id="gcOnboardTitle">What is one useful action you can take next?</h2><p class="gc-onboard-lead">Not a roadmap. Just the next useful thing.</p><label class="gc-onboard-field"><span>Next action</span><input id="gcOnboardAction" maxlength="120" value="${escapeHtml(state.action)}" placeholder="e.g. ${escapeHtml(area?.action||'Choose one useful next step')}"></label><fieldset class="gc-onboard-duration"><legend>Approximate time</legend>${durationButton(15,'15 min',state)}${durationButton(30,'30 min',state)}${durationButton(60,'60 min',state)}${durationButton(null,'Not sure',state)}</fieldset><p class="gc-onboard-note">Not sure is fine. It will appear in Today without a fixed clock time. Routine setup can wait until it is useful.</p><div class="gc-onboard-actions"><button type="button" class="ghost-button" data-back>Back</button><button type="button" class="primary-button" data-finish>${state.saving?'Creating…':'Add to Today'}</button></div><p class="gc-onboard-status" role="status"></p>`;
    host.innerHTML=`<div class="gc-onboard-backdrop" data-close></div><section class="gc-onboard-sheet" role="dialog" aria-modal="true" aria-labelledby="gcOnboardTitle"><button type="button" class="gc-onboard-close" data-close aria-label="Close setup">×</button>${progressMarkup(state.step)}${body}</section>`;
    host.querySelectorAll('[data-close]').forEach(node=>node.addEventListener('click',close));
    if(state.step===1){host.querySelectorAll('input[name="gcArea"]').forEach(input=>{input.addEventListener('change',()=>{state.areaKey=input.value;host.querySelectorAll('.gc-onboard-area').forEach(label=>label.classList.toggle('is-selected',label.querySelector('input')?.checked));const customField=host.querySelector('.gc-onboard-custom');if(customField)customField.hidden=state.areaKey!=='custom';if(state.areaKey==='custom')requestAnimationFrame(()=>host.querySelector('#gcOnboardCustom')?.focus());});});host.querySelector('#gcOnboardCustom')?.addEventListener('input',event=>state.customArea=event.currentTarget.value);}
    if(state.step===2)host.querySelector('#gcOnboardDirection')?.addEventListener('input',event=>state.direction=event.currentTarget.value);
    if(state.step===3){host.querySelector('#gcOnboardAction')?.addEventListener('input',event=>state.action=event.currentTarget.value);host.querySelectorAll('[data-duration]').forEach(button=>button.addEventListener('click',()=>{state.duration=button.dataset.duration==='unknown'?null:Number(button.dataset.duration);render();}));}
    host.querySelector('[data-back]')?.addEventListener('click',()=>{state.step=Math.max(1,state.step-1);render();});
    host.querySelector('[data-next]')?.addEventListener('click',()=>{if(state.step===1){state.customArea=host.querySelector('#gcOnboardCustom')?.value||state.customArea;if(!state.areaKey)return toast('Choose one area first.');if(state.areaKey==='custom'&&!state.customArea.trim())return toast('Name the area you want to grow.');state.step=2;render();return;}if(state.step===2){state.direction=host.querySelector('#gcOnboardDirection')?.value||state.direction;if(!state.direction.trim())return toast('Describe the change you want.');state.step=3;render();}});
    host.querySelector('[data-finish]')?.addEventListener('click',async()=>{state.action=host.querySelector('#gcOnboardAction')?.value||state.action;if(!state.action.trim())return toast('Choose one next action.');if(state.saving)return;state.saving=true;render();const status=host.querySelector('.gc-onboard-status');if(status)status.textContent='Creating your Direction and first action…';try{await persist(state);if(status)status.textContent='Ready.';toast('Your first action is ready');sessionDraft={step:1,areaKey:'',customArea:'',direction:'',action:'',duration:null,saving:false,startedAt:null};window.setTimeout(()=>location.assign('/experience/2/'),160);}catch(error){state.saving=false;render();const nextStatus=host.querySelector('.gc-onboard-status');if(nextStatus)nextStatus.textContent=error.message||'Could not finish setup.';}});
    requestAnimationFrame(()=>{const selector=state.step===1?(state.areaKey?`input[name="gcArea"][value="${state.areaKey}"]`:'input[name="gcArea"]'):state.step===2?'#gcOnboardDirection':'#gcOnboardAction';host.querySelector(selector)?.focus({preventScroll:true});});
  };
  render();
}

function simplifyExistingFirstRun(root){
  root.querySelectorAll('.today-onboarding-guide,.today-onboarding-steps,.today-flow-loop').forEach(node=>node.remove());
  const build=root.querySelector('[data-today-build-compass]');
  if(build&&!build.dataset.gcThreeStep){const clone=build.cloneNode(true);clone.dataset.gcThreeStep='true';clone.textContent='Start with one area';build.replaceWith(clone);clone.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openWizard();},{capture:true});}
  const routine=root.querySelector('.today-routine-start');
  if(routine&&!routine.dataset.gcDeferred){routine.dataset.gcDeferred='true';routine.innerHTML=`<div><p class="eyebrow">Next action</p><h3>Choose the next useful move.</h3><p>Routine setup is optional. Add it later when fixed time actually affects your planning.</p></div><button type="button" class="primary-button" data-gc-plan-now>Choose next action</button><button type="button" class="text-button" data-gc-routine-later>Set routine later</button>`;routine.querySelector('[data-gc-plan-now]')?.addEventListener('click',()=>navigate('plan'));routine.querySelector('[data-gc-routine-later]')?.addEventListener('click',()=>navigate('schedule'));}
}

function enhance(){const root=document.querySelector('#viewHost');if(!root)return;simplifyExistingFirstRun(root);}
const observer=new MutationObserver(enhance);observer.observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('load',enhance,{once:true});enhance();
