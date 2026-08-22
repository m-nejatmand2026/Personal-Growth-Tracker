import { readPreference, writePreference } from './core/preferences.js';
import { loadToday, renderToday, bindToday } from './views/today.js';
import { enhanceToday } from './views/today-growth.js';
import { loadPlan, renderPlan, bindPlan } from './views/plan.js';
import { loadGoals, renderGoals, bindGoals } from './views/goals.js';
import { loadActivities, renderActivities, bindActivities } from './views/activities.js';
import { loadSchedule, renderSchedule, bindSchedule } from './views/schedule.js';
import { loadProgress, renderProgress, bindProgress } from './views/progress.js';
import { loadInsights, renderInsights } from './views/insights.js';
import { loadJournal, renderJournal, bindJournal } from './views/journal.js';
import { renderWellness, bindWellness, deactivateWellness } from './views/wellness.js';
import { renderSettings, bindSettings, applyPresentationPreferences } from './views/settings.js';
import { createLogger } from './views/logger.js';
import { loadCompass, renderCompass, bindCompass } from './views/compass.js';
import { loadPatterns, renderPatterns, bindPatterns } from './views/patterns.js';
import { loadReflect, renderReflect, bindReflect, openAdjustmentDialog } from './views/reflect.js';

applyPresentationPreferences();
if(!document.querySelector('link[href="/experience/2/css/time-planning.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/experience/2/css/time-planning.css';document.head.append(link);}

const views=new Set(['today','compass','patterns','reflect','plan','goals','activities','schedule','progress','insights','wellness','journal','settings']);
const titles={today:'Today',compass:'Compass',patterns:'Patterns',reflect:'Reflect',plan:'Planning details',goals:'Direction',activities:'Activities',schedule:'Routine',progress:'Factual progress',insights:'Evidence',wellness:'Wellness',journal:'Journal',settings:'Settings'};
const parentOf={plan:'compass',goals:'compass',schedule:'compass',progress:'patterns',insights:'patterns',journal:'reflect'};
const migrationMap={plan:'compass',goals:'compass',schedule:'compass',progress:'patterns',insights:'patterns',journal:'reflect'};
let current=readPreference('last-view','today');
if(migrationMap[current])current=migrationMap[current];
if(!views.has(current))current='today';
let renderVersion=0,pendingAction='';

const host=document.querySelector('#viewHost');
const title=document.querySelector('#viewTitle');
const app=document.querySelector('#experience2App');
const mobileExploreToggle=document.querySelector('#mobileExploreToggle');
const mobileSecondary=document.querySelector('#mobileSecondary');

function setMobileExplore(open){if(!mobileExploreToggle||!mobileSecondary)return;const expanded=Boolean(open);mobileExploreToggle.setAttribute('aria-expanded',String(expanded));mobileSecondary.classList.toggle('open',expanded);mobileSecondary.setAttribute('aria-hidden',String(!expanded));mobileSecondary.inert=!expanded;}
function primaryFor(view){return parentOf[view]||(['today','compass','patterns','reflect'].includes(view)?view:null);}
function syncNav(){
  const parent=primaryFor(current);
  document.querySelectorAll('[data-view]').forEach(button=>{
    const isPrimary=button.hasAttribute('data-primary-nav');
    const active=isPrimary?button.dataset.view===parent:button.dataset.view===current;
    button.classList.toggle('active',active);
    if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  if(app)app.dataset.currentView=current;
}
function safeMessage(error){return String(error?.message||'Unknown error').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));}

const navigationTransitions=new Set();let loadingTimer=0;
function beginViewLoad(version){clearTimeout(loadingTimer);host.setAttribute('aria-busy','true');host.classList.toggle('is-navigation-pending',navigationTransitions.has(version)&&host.childElementCount>0);host.classList.remove('is-loading-delayed','is-navigation-entering');loadingTimer=window.setTimeout(()=>{if(version===renderVersion)host.classList.add('is-loading-delayed');},280);}
function finishViewLoad(version,{animate=true}={}){if(version!==renderVersion)return;const wasNavigation=navigationTransitions.delete(version);clearTimeout(loadingTimer);host.removeAttribute('aria-busy');host.classList.remove('is-navigation-pending','is-loading-delayed','is-navigation-entering');if(animate&&wasNavigation){void host.offsetWidth;host.classList.add('is-navigation-entering');host.addEventListener('animationend',()=>host.classList.remove('is-navigation-entering'),{once:true});}if(wasNavigation){document.querySelector('#experience2Main')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});}}
function childContext(parent,label){const bar=document.createElement('div');bar.className='composition-child-bar';bar.innerHTML=`<button type="button" class="ghost-button compact" data-return-parent="${parent}">← ${titles[parent]}</button><span>${label}</span>`;host.prepend(bar);bar.querySelector('[data-return-parent]')?.addEventListener('click',()=>show(parent));}
function errorHtml(kind,heading,error,retryId){return `<section class="static-surface ${kind}-error"><p class="eyebrow">${heading}</p><h2>Could not load this part of Growth Compass</h2><p>${safeMessage(error)}</p><button type="button" class="secondary-button" id="${retryId}">Retry</button></section>`;}

let logger=null;
async function renderCompassView(version=renderVersion){beginViewLoad(version);try{const model=await loadCompass();if(version!==renderVersion||current!=='compass')return;host.innerHTML=renderCompass(model);bindCompass(model,{navigate:show,openPlanner:prefill=>logger?.open(prefill)});finishViewLoad(version);}catch(error){if(version!==renderVersion||current!=='compass')return;host.innerHTML=errorHtml('compass','Compass unavailable',error,'compassRetry');finishViewLoad(version,{animate:false});document.querySelector('#compassRetry')?.addEventListener('click',()=>void renderCompassView(version));}}
async function renderPatternsView(version=renderVersion){beginViewLoad(version);try{const model=await loadPatterns();if(version!==renderVersion||current!=='patterns')return;host.innerHTML=renderPatterns(model);bindPatterns(model,{navigate:show,openAdjustment:()=>openAdjustmentDialog(model,{reload:()=>renderPatternsView(version)})});finishViewLoad(version);}catch(error){if(version!==renderVersion||current!=='patterns')return;host.innerHTML=errorHtml('patterns','Patterns unavailable',error,'patternsRetry');finishViewLoad(version,{animate:false});document.querySelector('#patternsRetry')?.addEventListener('click',()=>void renderPatternsView(version));}}
async function renderReflectView(version=renderVersion){beginViewLoad(version);try{const model=await loadReflect();if(version!==renderVersion||current!=='reflect')return;host.innerHTML=renderReflect(model);bindReflect(model,{navigate:show,reload:()=>renderReflectView(version)});finishViewLoad(version);}catch(error){if(version!==renderVersion||current!=='reflect')return;host.innerHTML=errorHtml('reflect','Reflect unavailable',error,'reflectRetry');finishViewLoad(version,{animate:false});document.querySelector('#reflectRetry')?.addEventListener('click',()=>void renderReflectView(version));}}
async function renderPlanView(period='week',version=renderVersion){beginViewLoad(version);try{const model=await loadPlan({period});if(version!==renderVersion||current!=='plan')return;host.innerHTML=renderPlan(model);childContext('compass','Planning is a detail of your Compass, not a separate destination.');bindPlan(model,{reload:nextPeriod=>renderPlanView(nextPeriod,version),navigate:show,openPlanner:prefill=>logger?.open(prefill)});finishViewLoad(version);}catch(error){if(version!==renderVersion||current!=='plan')return;host.innerHTML=errorHtml('plan','Planning unavailable',error,'planRetry');finishViewLoad(version,{animate:false});document.querySelector('#planRetry')?.addEventListener('click',()=>void renderPlanView(period,version));}}
async function renderGoalsView(version=renderVersion){beginViewLoad(version);try{const model=await loadGoals();if(version!==renderVersion||current!=='goals')return;host.innerHTML=renderGoals(model);childContext('compass','Direction tells the rest of the system what matters.');bindGoals(model,{reload:render,navigate:show});finishViewLoad(version);}catch(error){if(version!==renderVersion||current!=='goals')return;host.innerHTML=errorHtml('goals','Direction unavailable',error,'goalsRetry');finishViewLoad(version,{animate:false});document.querySelector('#goalsRetry')?.addEventListener('click',()=>void renderGoalsView(version));}}
async function renderActivitiesView(version=renderVersion){beginViewLoad(version);try{const model=await loadActivities();if(version!==renderVersion||current!=='activities')return;host.innerHTML=renderActivities(model);bindActivities(model,{reload:()=>renderActivitiesView(version)});finishViewLoad(version);}catch(error){if(version!==renderVersion||current!=='activities')return;host.innerHTML=errorHtml('activities','Activities unavailable',error,'activitiesRetry');finishViewLoad(version,{animate:false});document.querySelector('#activitiesRetry')?.addEventListener('click',()=>void renderActivitiesView(version));}}
async function renderScheduleView(version=renderVersion){beginViewLoad(version);try{const model=await loadSchedule();if(version!==renderVersion||current!=='schedule')return;host.innerHTML=renderSchedule(model);childContext('compass','Routine shapes the real time your plans must fit around.');bindSchedule(model,{reload:()=>renderScheduleView(version),navigate:show});finishViewLoad(version);}catch(error){if(version!==renderVersion||current!=='schedule')return;host.innerHTML=errorHtml('schedule','Routine unavailable',error,'scheduleRetry');finishViewLoad(version,{animate:false});document.querySelector('#scheduleRetry')?.addEventListener('click',()=>void renderScheduleView(version));}}
async function renderProgressView(version=renderVersion){beginViewLoad(version);try{const model=await loadProgress();if(version!==renderVersion||current!=='progress')return;host.innerHTML=renderProgress(model);childContext('patterns','This is factual evidence. Interpretation belongs in Patterns and Reflect.');bindProgress(model,{reload:render});finishViewLoad(version);}catch(error){if(version!==renderVersion||current!=='progress')return;host.innerHTML=errorHtml('progress','Progress unavailable',error,'progressRetry');finishViewLoad(version,{animate:false});document.querySelector('#progressRetry')?.addEventListener('click',()=>void renderProgressView(version));}}
async function renderInsightsView(version=renderVersion){beginViewLoad(version);try{const model=await loadInsights();if(version!==renderVersion||current!=='insights')return;host.innerHTML=renderInsights(model);childContext('patterns','Evidence rules keep possible associations from turning into fake certainty.');finishViewLoad(version);}catch(error){if(version!==renderVersion||current!=='insights')return;host.innerHTML=errorHtml('insights','Evidence unavailable',error,'insightsRetry');finishViewLoad(version,{animate:false});document.querySelector('#insightsRetry')?.addEventListener('click',()=>void renderInsightsView(version));}}
async function renderJournalView(query='',version=renderVersion){beginViewLoad(version);try{const model=await loadJournal(query);if(version!==renderVersion||current!=='journal')return;host.innerHTML=renderJournal(model);childContext('reflect','Journal is private reflection; it does not become Progress or Wellbeing evidence.');bindJournal(model,{reload:nextQuery=>renderJournalView(nextQuery,version)});finishViewLoad(version);if(pendingAction==='new-journal'){pendingAction='';document.querySelector('[data-journal-new]')?.click();}}catch(error){if(version!==renderVersion||current!=='journal')return;host.innerHTML=errorHtml('journal','Journal unavailable',error,'journalRetry');finishViewLoad(version,{animate:false});document.querySelector('#journalRetry')?.addEventListener('click',()=>void renderJournalView(query,version));}}
function renderWellnessView(version=renderVersion){host.innerHTML=renderWellness();bindWellness({root:host,onRerender:()=>renderWellnessView(version)});finishViewLoad(version);}
function renderSettingsView(version=renderVersion){host.innerHTML=renderSettings();bindSettings({rerender:()=>renderSettingsView(version)});finishViewLoad(version);}

async function render(){
  const version=++renderVersion;beginViewLoad(version);title.textContent=titles[current];document.title=`${titles[current]} — Growth Compass`;syncNav();
  if(current==='compass'){await renderCompassView(version);return;}
  if(current==='patterns'){await renderPatternsView(version);return;}
  if(current==='reflect'){await renderReflectView(version);return;}
  if(current==='plan'){await renderPlanView('week',version);return;}
  if(current==='goals'){await renderGoalsView(version);return;}
  if(current==='activities'){await renderActivitiesView(version);return;}
  if(current==='schedule'){await renderScheduleView(version);return;}
  if(current==='progress'){await renderProgressView(version);return;}
  if(current==='insights'){await renderInsightsView(version);return;}
  if(current==='journal'){await renderJournalView('',version);return;}
  if(current==='wellness'){renderWellnessView(version);return;}
  if(current==='settings'){renderSettingsView(version);return;}
  try{const model=await loadToday();if(version!==renderVersion||current!=='today')return;host.innerHTML=renderToday(model);bindToday(model,{reload:render});void enhanceToday({root:host,model});finishViewLoad(version);if(pendingAction==='checkin'){pendingAction='';window.setTimeout(()=>host.querySelector('.today-checkin')?.scrollIntoView({behavior:'smooth',block:'center'}),220);}}
  catch(error){if(version!==renderVersion||current!=='today')return;host.innerHTML=errorHtml('today','Today unavailable',error,'todayRetry');finishViewLoad(version,{animate:false});document.querySelector('#todayRetry')?.addEventListener('click',()=>void render());}
}

logger=createLogger({onSaved:async()=>{if(['today','activities','progress','insights','patterns','compass'].includes(current)){await render();return;}if(current==='plan'){const version=++renderVersion;await renderPlanView('week',version);}}});
function show(view){if(!views.has(view))return;setMobileExplore(false);if(view===current)return;if(current==='wellness'&&view!=='wellness')deactivateWellness();current=view;writePreference('last-view',view);navigationTransitions.add(renderVersion+1);void render();}
window.__gcExperience2Navigate=show;
document.addEventListener('gc:navigate-view',event=>show(event.detail?.view));

document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.view)));

function closeAddHub(){document.querySelector('#addHubBackdrop')?.remove();document.querySelector('#addHub')?.remove();document.body.classList.remove('add-hub-open');}
function openAddHub(){
  closeAddHub();const backdrop=document.createElement('div');backdrop.id='addHubBackdrop';backdrop.className='add-hub-backdrop';backdrop.addEventListener('click',closeAddHub);const panel=document.createElement('section');panel.id='addHub';panel.className='add-hub';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','addHubTitle');panel.innerHTML=`<header><div><p class="eyebrow">Add</p><h2 id="addHubTitle">What do you want to do?</h2></div><button type="button" class="add-hub-close" aria-label="Close">×</button></header><div class="add-hub-options"><button type="button" data-add-intent="started"><strong>Do something now</strong><span>Start an action without pretending it was planned earlier.</span></button><button type="button" data-add-intent="planned"><strong>Plan something</strong><span>Put an intention into a real day and time.</span></button><button type="button" data-add-intent="done"><strong>Record something already done</strong><span>Create factual Progress from what actually happened.</span></button><button type="button" data-add-intent="checkin"><strong>Energy & mood check-in</strong><span>Add a few seconds of wellbeing evidence.</span></button><button type="button" data-add-intent="note"><strong>Write a note</strong><span>Reflect privately without turning it into Progress.</span></button></div>`;document.body.append(backdrop,panel);document.body.classList.add('add-hub-open');panel.querySelector('.add-hub-close')?.addEventListener('click',closeAddHub);panel.querySelectorAll('[data-add-intent]').forEach(button=>button.addEventListener('click',()=>{const intent=button.dataset.addIntent;closeAddHub();if(['started','planned','done'].includes(intent)){void logger.open({entryMode:intent});return;}if(intent==='checkin'){pendingAction='checkin';if(current==='today')void render();else show('today');return;}if(intent==='note'){pendingAction='new-journal';show('journal');}}));panel.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();closeAddHub();}};requestAnimationFrame(()=>panel.querySelector('[data-add-intent]')?.focus());
}

document.querySelectorAll('[data-open-add]').forEach(button=>button.addEventListener('click',openAddHub));
mobileExploreToggle?.addEventListener('click',event=>{event.stopPropagation();setMobileExplore(mobileExploreToggle.getAttribute('aria-expanded')!=='true');});
mobileSecondary?.addEventListener('click',event=>event.stopPropagation());
document.addEventListener('click',()=>setMobileExplore(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobileExploreToggle?.getAttribute('aria-expanded')==='true'){event.preventDefault();setMobileExplore(false);mobileExploreToggle.focus({preventScroll:true});}});
setMobileExplore(false);
if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/experience/2/sw.js',{scope:'/experience/2/'}).catch(error=>console.warn('Experience 2 service worker registration failed',error)));}
void render();
