import { readPreference, writePreference } from './core/preferences.js';

const TUTORIAL_KEY='tutorial-state-v1';
const steps=[
  {key:'welcome',title:'A quick tour',copy:'Growth Compass has four places to think and one place to act. You can skip this now and replay it later from Settings.',button:'Start tour'},
  {key:'today',title:'Today',copy:'Open here to see what deserves attention now, what comes next, and your quick Energy + Mood check-in.',target:'[data-primary-nav][data-view="today"]',view:'today',button:'Open Today'},
  {key:'compass',title:'Compass',copy:'This connects Direction → this week → today. Use it when you need to decide whether your actions still point where you want to go.',target:'[data-primary-nav][data-view="compass"]',view:'compass',button:'Open Compass'},
  {key:'add',title:'Add',copy:'Add starts with intent: do something now, plan it, record what already happened, check in, or write privately.',target:'[data-open-add]',action:'add',button:'Open Add'},
  {key:'add-options',title:'Choose the meaning first',copy:'These choices keep plans, factual Progress, wellbeing evidence, and private reflection from being mixed together.',target:'#addHub .add-hub-options',button:'Continue'},
  {key:'patterns',title:'Patterns',copy:'Patterns stays quiet until enough evidence exists. It should show what is repeatedly happening without pretending association is causation.',target:'[data-primary-nav][data-view="patterns"]',view:'patterns',button:'Open Patterns'},
  {key:'reflect',title:'Reflect',copy:'Look back at a real week or month, notice what mattered, then choose one adjustment. Reflection is not another score.',target:'[data-primary-nav][data-view="reflect"]',view:'reflect',button:'Open Reflect'},
  {key:'done',title:'That is enough',copy:'Use the system in your own order. The tour never needs to be completed again unless you choose Replay tutorial in Settings.',button:'Finish'}
];
let active=false,index=0,layer=null,target=null,targetClick=null,observer=null;

function visible(selector){if(!selector)return null;return [...document.querySelectorAll(selector)].find(node=>!node.hidden&&node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden')||null;}
function clearTarget(){if(target&&targetClick)target.removeEventListener('click',targetClick,true);target?.classList.remove('gc-tutorial-target');target=null;targetClick=null;}
function closeAdd(){document.querySelector('#addHub .add-hub-close')?.click();}
function stop(state){clearTarget();layer?.remove();layer=null;active=false;closeAdd();if(state)writePreference(TUTORIAL_KEY,state);document.documentElement.classList.remove('gc-tutorial-active');}
function progress(){return `<div class="gc-tutorial-progress" aria-label="Tutorial progress">${steps.slice(0,-1).map((step,i)=>`<i class="${i<=index?'is-reached':''}"></i>`).join('')}</div>`;}
function card(step){const final=step.key==='done';return `<section class="gc-tutorial-card" role="dialog" aria-modal="false" aria-labelledby="gcTutorialTitle"><div class="gc-tutorial-top"><span>${final?'Complete':`Step ${Math.min(index+1,steps.length-1)} of ${steps.length-1}`}</span><button type="button" data-tutorial-skip>${final?'Close':'Skip tutorial'}</button></div><h2 id="gcTutorialTitle">${step.title}</h2><p>${step.copy}</p>${progress()}<div class="gc-tutorial-actions">${index>0&&!final?'<button type="button" class="gc-tutorial-back" data-tutorial-back>Back</button>':''}<button type="button" class="gc-tutorial-next" data-tutorial-next>${step.button}</button></div></section>`;}
function next(){if(index>=steps.length-1){stop('complete');return;}if(steps[index].key==='add-options')closeAdd();index+=1;render();}
function back(){if(index<=0)return;if(steps[index].key==='add-options')closeAdd();index-=1;render();}
function activateTarget(step){clearTarget();target=visible(step.target);if(!target)return;target.classList.add('gc-tutorial-target');if(step.view||step.action==='add'){targetClick=()=>{window.setTimeout(()=>{if(!active)return;if(step.action==='add'){index+=1;render();}else next();},180);};target.addEventListener('click',targetClick,true);}}
function perform(step){if(step.key==='done'){stop('complete');return;}if(step.action==='add'){
    const button=visible(step.target);button?.click();window.setTimeout(()=>{if(active){index+=1;render();}},180);return;
  }
  if(step.view){window.__gcExperience2Navigate?.(step.view);window.setTimeout(()=>{if(active)next();},260);return;}
  next();
}
function render(){if(!active)return;clearTarget();const step=steps[index];if(!layer){layer=document.createElement('div');layer.className='gc-tutorial-layer';document.body.append(layer);}layer.innerHTML=card(step);layer.querySelector('[data-tutorial-skip]')?.addEventListener('click',()=>stop(step.key==='done'?'complete':'skipped'));layer.querySelector('[data-tutorial-next]')?.addEventListener('click',()=>perform(step));layer.querySelector('[data-tutorial-back]')?.addEventListener('click',back);window.setTimeout(()=>{if(active)activateTarget(step);},80);requestAnimationFrame(()=>layer.querySelector('[data-tutorial-next]')?.focus({preventScroll:true}));}

export function startTutorial({force=false}={}){if(active)return;if(!force&&readPreference(TUTORIAL_KEY,null))return;active=true;index=0;document.documentElement.classList.add('gc-tutorial-active');render();}
export function tutorialState(){return readPreference(TUTORIAL_KEY,'not-started');}

function eligibleForAutomaticStart(){if(readPreference(TUTORIAL_KEY,null)||active)return false;if(!window.__gcExperience2Navigate)return false;if(document.documentElement.classList.contains('auth-checking')||document.documentElement.classList.contains('auth-gated'))return false;const host=document.querySelector('#viewHost');if(!host?.childElementCount)return false;if(host.querySelector('.today-first-run,.first-run,.today-welcome,.today-guided'))return false;return true;}
function maybeStart(){if(!eligibleForAutomaticStart())return;window.setTimeout(()=>{if(eligibleForAutomaticStart())startTutorial();},700);}

document.addEventListener('gc:start-tutorial',()=>startTutorial({force:true}));
document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){event.preventDefault();stop('skipped');}});
observer=new MutationObserver(maybeStart);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-current-view']});
window.addEventListener('load',maybeStart,{once:true});
