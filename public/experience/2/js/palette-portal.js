(()=>{
  function mountPalettePortal(){
    const switcher=document.querySelector('#e2PaletteSwitcher');
    const toggle=document.querySelector('#e2PaletteToggle');
    const menu=document.querySelector('#e2PaletteMenu');
    const overlay=document.querySelector('#overlayHost');
    if(!switcher||!toggle||!menu||!overlay||menu.dataset.portalMounted==='true')return;

    menu.dataset.portalMounted='true';
    overlay.append(menu);
    Object.assign(menu.style,{position:'fixed',zIndex:'1000',pointerEvents:'auto',margin:'0',right:'auto',bottom:'auto'});

    const options=[...menu.querySelectorAll('[data-e2-palette-option]')];
    const syncChecks=()=>{const active=document.documentElement.dataset.palette||'violet';options.forEach(option=>option.setAttribute('aria-checked',String(option.dataset.palette===active)))};
    const position=()=>{
      if(menu.hidden)return;
      const rect=toggle.getBoundingClientRect();
      const mobile=window.matchMedia('(max-width: 900px)').matches;
      if(mobile){
        const inset=window.innerWidth<=430?8:12;
        menu.style.left=`${inset}px`;
        menu.style.top=`${Math.max(62,rect.bottom+8)}px`;
        menu.style.width=`${Math.max(280,window.innerWidth-(inset*2))}px`;
        menu.style.maxWidth=`calc(100vw - ${inset*2}px)`;
        menu.style.maxHeight=`calc(100dvh - ${Math.max(150,rect.bottom+28)}px)`;
      }else{
        const width=Math.min(380,Math.max(320,window.innerWidth-rect.right-32));
        menu.style.width=`${width}px`;
        menu.style.maxWidth=`${width}px`;
        menu.style.maxHeight='calc(100dvh - 36px)';
        const left=Math.min(rect.right+14,window.innerWidth-width-18);
        menu.style.left=`${Math.max(18,left)}px`;
        requestAnimationFrame(()=>{
          const height=Math.min(menu.getBoundingClientRect().height,window.innerHeight-36);
          const top=Math.max(18,Math.min(rect.top,window.innerHeight-height-18));
          menu.style.top=`${top}px`;
        });
      }
    };

    const menuObserver=new MutationObserver(()=>{if(!menu.hidden){position();syncChecks()}});
    menuObserver.observe(menu,{attributes:true,attributeFilter:['hidden']});
    const paletteObserver=new MutationObserver(syncChecks);
    paletteObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-palette']});

    menu.addEventListener('click',event=>event.stopPropagation());
    window.addEventListener('resize',position,{passive:true});
    window.addEventListener('scroll',position,{passive:true,capture:true});
    toggle.addEventListener('click',()=>requestAnimationFrame(position));
    syncChecks();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountPalettePortal,{once:true});
  else mountPalettePortal();
})();
