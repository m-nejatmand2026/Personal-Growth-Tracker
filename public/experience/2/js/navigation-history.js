const HISTORY_KEY='gcExperience2Navigation';
const VALID_VIEWS=new Set(['today','plan','goals','activities','schedule','progress','insights','wellness','journal','settings']);
let installed=false;

function safeState(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function normalizeDepth(value){const depth=Number(value);return Number.isInteger(depth)&&depth>=0?depth:0;}
function activeView(){return document.querySelector('[data-view][aria-current="page"]')?.dataset.view||null;}
function navigationButton(view){return [...document.querySelectorAll(`[data-view="${view}"]`)].find(node=>node instanceof HTMLButtonElement)||null;}
function withNavigationState(view,depth){return {...safeState(history.state),[HISTORY_KEY]:{view,depth}};}

function ensureStyles(){
  if(document.querySelector('link[href="/experience/2/css/navigation-history.css"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='/experience/2/css/navigation-history.css';
  document.head.append(link);
}

function ensureBackButton(){
  const header=document.querySelector('.mobile-header');
  if(!header)return null;
  let button=header.querySelector('[data-app-back]');
  if(button)return button;
  button=document.createElement('button');
  button.type='button';
  button.className='mobile-history-back';
  button.dataset.appBack='';
  button.hidden=true;
  button.setAttribute('aria-label','Back to previous page');
  button.title='Back';
  button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m14.5 6-6 6 6 6"/></svg><span>Back</span>';
  header.prepend(button);
  return button;
}

export function installNavigationHistory(){
  if(installed)return;
  installed=true;
  ensureStyles();
  const header=document.querySelector('.mobile-header');
  const backButton=ensureBackButton();
  let view=activeView()||'today';
  let depth=0;
  const existing=history.state?.[HISTORY_KEY];
  if(existing&&VALID_VIEWS.has(existing.view)){
    view=existing.view;
    depth=normalizeDepth(existing.depth);
  }else{
    history.replaceState(withNavigationState(view,0),'',location.href);
  }

  const syncBackButton=()=>{
    const canGoBack=depth>0;
    if(backButton)backButton.hidden=!canGoBack;
    header?.classList.toggle('has-history-back',canGoBack);
  };

  const restoreView=target=>{
    if(!VALID_VIEWS.has(target))return;
    const current=activeView();
    if(current===target)return;
    navigationButton(target)?.click();
  };

  if(existing&&VALID_VIEWS.has(existing.view)&&activeView()!==existing.view){
    restoreView(existing.view);
  }
  syncBackButton();

  const observer=new MutationObserver(()=>{
    const next=activeView();
    if(!next||!VALID_VIEWS.has(next)||next===view)return;
    view=next;
    depth+=1;
    history.pushState(withNavigationState(view,depth),'',location.href);
    syncBackButton();
  });
  const app=document.querySelector('#experience2App');
  if(app)observer.observe(app,{subtree:true,attributes:true,attributeFilter:['aria-current']});

  window.addEventListener('popstate',event=>{
    const state=event.state?.[HISTORY_KEY];
    if(!state||!VALID_VIEWS.has(state.view))return;
    view=state.view;
    depth=normalizeDepth(state.depth);
    syncBackButton();
    restoreView(view);
  });

  backButton?.addEventListener('click',()=>{
    if(depth>0)history.back();
  });
}

function installWhenAppIsReady(){
  const html=document.documentElement;
  const ready=()=>!html.classList.contains('auth-checking')&&!html.classList.contains('auth-gated')&&document.querySelector('#experience2App');
  if(ready()){installNavigationHistory();return;}
  const observer=new MutationObserver(()=>{if(!ready())return;observer.disconnect();installNavigationHistory();});
  observer.observe(html,{attributes:true,attributeFilter:['class']});
}

installWhenAppIsReady();
