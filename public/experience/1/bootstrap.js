const EXPERIENCE1_PREFERENCE_NAMESPACE='growth-compass:';
const manifest=document.querySelector('link[rel="manifest"]');
if(manifest)manifest.href='/experience/1/manifest.webmanifest';
if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/experience/1/sw.js',{scope:'/experience/1/'}).catch(error=>console.warn('Experience 1 service worker registration failed',error)));}
window.__GC_EXPERIENCE_PREFERENCE_NAMESPACE__=EXPERIENCE1_PREFERENCE_NAMESPACE;
