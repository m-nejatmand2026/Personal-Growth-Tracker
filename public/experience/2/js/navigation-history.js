const HISTORY_KEY='gcExperience2Navigation';
const VALID_VIEWS=new Set(['today','compass','patterns','reflect','plan','goals','activities','schedule','progress','insights','wellness','journal','settings']);
let installed=false;

function safeState(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function normalizeDepth(value){const depth=Number(value);return Number.isInteger(depth)&&depth>=0?depth:0;}
function activeView(){return document.querySelector('#experience2App')?.dataset.currentView||'today';}
function withNavigationState(view,depth){return {...safeState(history.state),[HISTORY_KEY]:{view,depth}};}
function restoreView(view){if(!VALID_VIEWS.has(view))return;if(typeof window.__gcExperience2Navigate==='function'){window.__gcExperience2Navigate(view);return;}document.dispatchEvent(new CustomEvent('gc:navigate-view',{detail:{view}}));}

function ensureStyles(){if(document.querySelector('link[href="/experience/2/css/navigation-history.css"]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='/experience/2/css/navigation-history.css';document.head.append(link);}
function ensureBackButton(){const header=document.querySelector('.mobile-header');if(!header)return null;let button=header.querySelector('[data-app-back]');if(button)return button;button=document.createElement('button');button.type='button';button.className='mobile-history-back';button.dataset.appBack='';button.hidden=true;button.setAttribute('aria-label','Back to previous page');button.title='Back';button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m14.5 6-6 6 6 6"/></svg><span>Back</span>';header.prepend(button);return button;}

export function installNavigationHistory(){
  if(installed)return;installed=true;ensureStyles();const app=document.querySelector('#experience2App'),header=document.querySelector('.mobile-header'),backButton=ensureBackButton();let view=activeView(),depth=0;const existing=history.state?.[HISTORY_KEY];
  if(existing&&VALID_VIEWS.has(existing.view)){view=existing.view;depth=normalizeDepth(existing.depth);}else history.replaceState(withNavigationState(view,0),'',location.href);
  const syncBack=()=>{const enabled=depth>0;if(backButton)backButton.hidden=!enabled;header?.classList.toggle('has-history-back',enabled);};
  if(existing&&VALID_VIEWS.has(existing.view)&&activeView()!==existing.view)restoreView(existing.view);syncBack();
  const observer=new MutationObserver(()=>{const next=activeView();if(!next||!VALID_VIEWS.has(next)||next===view)return;view=next;depth+=1;history.pushState(withNavigationState(view,depth),'',location.href);syncBack();});
  if(app)observer.observe(app,{attributes:true,attributeFilter:['data-current-view']});
  window.addEventListener('popstate',event=>{const state=event.state?.[HISTORY_KEY];if(!state||!VALID_VIEWS.has(state.view))return;view=state.view;depth=normalizeDepth(state.depth);syncBack();if(activeView()!==view)restoreView(view);});
  backButton?.addEventListener('click',()=>{if(depth>0)history.back();});
}
function installWhenAppIsReady(){const html=document.documentElement;const ready=()=>!html.classList.contains('auth-checking')&&!html.classList.contains('auth-gated')&&document.querySelector('#experience2App');if(ready()){installNavigationHistory();return;}const observer=new MutationObserver(()=>{if(!ready())return;observer.disconnect();installNavigationHistory();});observer.observe(html,{attributes:true,attributeFilter:['class']});}
installWhenAppIsReady();
