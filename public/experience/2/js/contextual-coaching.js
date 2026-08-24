import { readPreference, writePreference } from './core/preferences.js';

const KEY=Object.freeze({compass:'coach-compass-seen-v1',patterns:'coach-patterns-seen-v1'});
const COPY={
  compass:{title:'Use Compass when you need to choose.',body:'It connects what matters to what you are doing next. Direction, planning details and routine stay underneath this view until you need them.'},
  patterns:{title:'Patterns is useful now.',body:'You have enough recorded days for repeated signals to start meaning something. Treat them as evidence to investigate, not proof of cause.'}
};
function currentView(){return document.querySelector('#experience2App')?.dataset.currentView||'today';}
function key(view){return KEY[view]||`coach-${view}-seen-v1`;}
function dismiss(view,node){writePreference(key(view),'seen');node?.remove();}
function shouldShow(view,host){if(readPreference(key(view),null))return false;if(view==='compass')return Boolean(host.querySelector('.compass-view'));if(view==='patterns')return Boolean(host.querySelector('.patterns-view:not(.is-baseline)'));return false;}
function install(){const host=document.querySelector('#viewHost');if(!host)return;const view=currentView();if(!COPY[view]||!shouldShow(view,host)||host.querySelector(`[data-context-coach="${view}"]`))return;const coach=document.createElement('aside');coach.className='gc-context-coach';coach.dataset.contextCoach=view;coach.innerHTML=`<div><span>${view==='compass'?'First time here':'Now useful'}</span><strong>${COPY[view].title}</strong><p>${COPY[view].body}</p></div><button type="button" class="text-button">Got it</button>`;coach.querySelector('button')?.addEventListener('click',()=>dismiss(view,coach));host.prepend(coach);}
const observer=new MutationObserver(()=>queueMicrotask(install));observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-current-view']});window.addEventListener('load',install,{once:true});install();
