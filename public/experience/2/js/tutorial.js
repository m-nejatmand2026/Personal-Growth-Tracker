import { readPreference, writePreference } from './core/preferences.js';

const TUTORIAL_KEY='tutorial-state-v2';
const STYLESHEET='/experience/2/css/tutorial.css';
if(typeof document!=='undefined'&&!document.querySelector(`link[href="${STYLESHEET}"]`)){const link=document.createElement('link');link.rel='stylesheet';link.href=STYLESHEET;document.head.append(link);}

const steps=[
  {key:'today',title:'Today',copy:'See what deserves attention now, what comes next, and whether anything is worth recording or checking in.',target:'[data-primary-nav][data-view="today"]',view:'today',button:'Open Today'},
  {key:'compass',title:'Compass',copy:'Use Compass when you need to choose or adjust direction. Planning details and routine stay underneath it.',target:'[data-primary-nav][data-view="compass"]',view:'compass',button:'Open Compass'},
  {key:'add',title:'Add',copy:'Add starts with meaning: do something now, plan it, record what happened, check in, or write privately.',target:'[data-open-add]',action:'add',button:'Open Add'},
  {key:'patterns',title:'Patterns',copy:'Patterns stays quiet until there is enough evidence, then shows repeated signals without pretending association is causation.',target:'[data-primary-nav][data-view="patterns"]',view:'patterns',button:'Open Patterns'},
  {key:'reflect',title:'Reflect',copy:'Look back at a real period, notice what mattered, and choose one adjustment.',target:'[data-primary-nav][data-view="reflect"]',view:'reflect',button:'Open Reflect'},
  {key:'done',title:'That is the product',copy:'Today to act. Compass to choose. Patterns to notice. Reflect to adjust. Everything else is supporting detail.',button:'Finish'}
];
let active=false,index=0,layer=null,target=null,targetClick=null;
function visible(selector){if(!selector)return null;return [...document.querySelectorAll(selector)].find(node=>!node.hidden&&node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden')||null;}
function clearTarget(){if(target&&targetClick)target.removeEventListener('click',targetClick,true);target?.classList.remove('gc-tutorial-target');target=null;targetClick=null;}
function closeAdd(){document.querySelector('#addHub .add-hub-close')?.click();}
function stop(state){clearTarget();layer?.remove();layer=null;active=false;closeAdd();if(state)writePreference(TUTORIAL_KEY,state);document.documentElement.classList.remove('gc-tutorial-active');}
function progress(){return `<div class="gc-tutorial-progress" aria-label="Tutorial progress">${steps.slice(0,-1).map((step,i)=>`<i class="${i<=index?'is-reached':''}"></i>`).join('')}</div>`;}
function card(step){const final=step.key==='done';return `<section class="gc-tutorial-card" role="dialog" aria-modal="false" aria-labelledby="gcTutorialTitle"><div class="gc-tutorial-top"><span>${final?'Complete':`Step ${Math.min(index+1,steps.length-1)} of ${steps.length-1}`}</span><button type="button" data-tutorial-skip>${final?'Close':'Skip tutorial'}</button></div><h2 id="gcTutorialTitle">${step.title}</h2><p>${step.copy}</p>${progress()}<div class="gc-tutorial-actions">${index>0&&!final?'<button type="button" class="gc-tutorial-back" data-tutorial-back>Back</button>':''}<button type="button" class="gc-tutorial-next" data-tutorial-next>${step.button}</button></div></section>`;}
function next(){if(index>=steps.length-1){stop('complete');return;}index+=1;render();}
function back(){if(index<=0)return;index-=1;render();}
function activateTarget(step){clearTarget();target=visible(step.target);if(!target)return;target.classList.add('gc-tutorial-target');if(step.view){targetClick=()=>window.setTimeout(()=>{if(active)next();},180);target.addEventListener('click',targetClick,true);}}
function perform(step){if(step.key==='done'){stop('complete');return;}if(step.action==='add'){visible(step.target)?.click();window.setTimeout(()=>{if(active)next();},180);return;}if(step.view){window.__gcExperience2Navigate?.(step.view);window.setTimeout(()=>{if(active)next();},260);return;}next();}
function render(){if(!active)return;clearTarget();const step=steps[index];if(!layer){layer=document.createElement('div');layer.className='gc-tutorial-layer';document.body.append(layer);}layer.innerHTML=card(step);layer.querySelector('[data-tutorial-skip]')?.addEventListener('click',()=>stop('skipped'));layer.querySelector('[data-tutorial-next]')?.addEventListener('click',()=>perform(step));layer.querySelector('[data-tutorial-back]')?.addEventListener('click',back);window.setTimeout(()=>{if(active)activateTarget(step);},80);requestAnimationFrame(()=>layer.querySelector('[data-tutorial-next]')?.focus({preventScroll:true}));}
export function startTutorial({force=false}={}){if(active)return;if(!force&&readPreference(TUTORIAL_KEY,null)==='complete')return;active=true;index=0;document.documentElement.classList.add('gc-tutorial-active');render();}
export function tutorialState(){return readPreference(TUTORIAL_KEY,'not-started');}
document.addEventListener('gc:start-tutorial',()=>startTutorial({force:true}));document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){event.preventDefault();stop('skipped');}});
