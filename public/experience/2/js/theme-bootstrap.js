(()=>{
  const root=document.documentElement;
  const prefix='growth-compass:preview2:e2:';
  const valid=new Set(['dark','light','system']);
  function resolved(value){if(value==='system'){try{return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}catch{return'dark';}}return value==='light'?'light':'dark';}
  try{
    let stored=localStorage.getItem(`${prefix}theme`)||'dark';
    if(!valid.has(stored))stored='dark';
    root.dataset.theme=resolved(stored);
    delete root.dataset.palette;
    if(localStorage.getItem(`${prefix}motion`)==='reduce')root.dataset.motion='reduce';
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',root.dataset.theme==='light'?'#f3f0e8':'#151714');
  }catch{
    root.dataset.theme='dark';
    delete root.dataset.palette;
  }
})();
