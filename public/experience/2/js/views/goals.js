const DIRECTION_STYLESHEET='/experience/2/css/direction.css';
if(typeof document!=='undefined'&&!document.querySelector(`link[href="${DIRECTION_STYLESHEET}"]`)){const link=document.createElement('link');link.rel='stylesheet';link.href=DIRECTION_STYLESHEET;link.dataset.experience2Direction='true';document.head.append(link);}
export { loadGoals, renderGoals, bindGoals } from './direction.js';
