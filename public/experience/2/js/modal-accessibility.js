const app=document.querySelector('#experience2App');
let opener=null;
let lastAppFocus=app?.contains(document.activeElement)?document.activeElement:null;
let isolated=false;

function modal(){return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find(dialog=>!app?.contains(dialog))||null;}
function focusable(dialog){return [...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,a[href],[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.offsetParent!==null);}
function restoreFocus(){const target=opener;opener=null;queueMicrotask(()=>{const active=document.activeElement;if(target?.isConnected&&!modal()&&(active===document.body||active===document.documentElement||!active))target.focus({preventScroll:true});});}
function syncIsolation(){const open=Boolean(modal());if(open&&!isolated){opener=app?.contains(document.activeElement)?document.activeElement:lastAppFocus;if(app)app.inert=true;isolated=true;return;}if(!open&&isolated){if(app)app.inert=false;isolated=false;restoreFocus();}}
if(app){document.addEventListener('focusin',event=>{if(app.contains(event.target))lastAppFocus=event.target;});new MutationObserver(syncIsolation).observe(document.body,{childList:true,subtree:true});syncIsolation();}

document.addEventListener('keydown',event=>{
  const dialog=modal();if(!dialog)return;
  if(event.key==='Escape'&&!event.defaultPrevented){const close=dialog.querySelector('button[aria-label^="Close"],[data-modal-close]');if(close){event.preventDefault();close.click();}return;}
  if(event.key!=='Tab'||event.defaultPrevented)return;
  const nodes=focusable(dialog);if(!nodes.length)return;
  const first=nodes[0],last=nodes.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
