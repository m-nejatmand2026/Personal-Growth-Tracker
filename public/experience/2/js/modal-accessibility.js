const host=document.querySelector('#overlayHost');
const app=document.querySelector('#experience2App');
let opener=null;
let isolated=false;

function modal(){return host?.querySelector('[role="dialog"][aria-modal="true"]')||null;}
function restoreFocus(){const target=opener;opener=null;queueMicrotask(()=>{const active=document.activeElement;if(target?.isConnected&&(active===document.body||active===document.documentElement||!active))target.focus({preventScroll:true});});}
function syncIsolation(){const open=Boolean(modal());if(open&&!isolated){opener=app?.contains(document.activeElement)?document.activeElement:null;if(app)app.inert=true;isolated=true;return;}if(!open&&isolated){if(app)app.inert=false;isolated=false;restoreFocus();}}
if(host&&app){new MutationObserver(syncIsolation).observe(host,{childList:true,subtree:true});syncIsolation();}

document.addEventListener('keydown',event=>{if(event.key!=='Escape'||event.defaultPrevented)return;const dialog=modal();if(!dialog)return;const close=dialog.querySelector('button[aria-label^="Close"]');if(!close)return;event.preventDefault();close.click();});
