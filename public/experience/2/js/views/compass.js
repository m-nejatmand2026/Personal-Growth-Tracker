import { loadPlan } from './plan.js';
import { loadGoals } from './goals.js';

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]||c));}
function minutesLabel(value){const minutes=Math.max(0,Math.round(Number(value)||0));const hours=Math.floor(minutes/60),rest=minutes%60;if(!hours)return`${rest}m`;if(!rest)return`${hours}h`;return`${hours}h ${rest}m`;}
function activeGoals(model){return (model?.goals||[]).filter(goal=>goal.status!=='archived'&&goal.status!=='completed');}

export async function loadCompass(){
  const [plan,direction]=await Promise.all([loadPlan({period:'week'}),loadGoals()]);
  return {plan,direction};
}

function goalPlan(plan,goal){
  const rows=Array.isArray(plan?.goals)?plan.goals:[];
  if(!goal)return rows[0]||null;
  return rows.find(row=>String(row.goal_id??row.id??'')===String(goal.id??''))||rows.find(row=>String(row.name||'').trim().toLowerCase()===String(goal.name||'').trim().toLowerCase())||rows[0]||null;
}
function nextToday(plan){return (plan?.todayItems||[]).find(item=>item.status==='in_progress')||(plan?.todayItems||[]).find(item=>item.status==='planned')||null;}
function activeRoutine(plan){return (plan?.commitments||[]).filter(item=>Number(item.active??1)===1);}

function pathMarkup(plan,goal){
  const weekly=goalPlan(plan,goal);const next=nextToday(plan);const weekMinutes=Math.max(0,Number(weekly?.period_target_minutes)||0);
  const direction=goal?.name||'Choose a direction';
  const week=weekMinutes?`${minutesLabel(weekMinutes)} protected for ${weekly?.name||direction}`:'No time protected yet';
  const today=next?.title||'Nothing scheduled';
  return `<ol class="gc-path" aria-label="Direction to today">
    <li class="gc-path-step is-origin"><span class="gc-path-dot" aria-hidden="true"></span><div><small>Direction</small><strong>${escapeHtml(direction)}</strong>${goal?.area_name?`<span>${escapeHtml(goal.area_name)}</span>`:''}</div></li>
    <li class="gc-path-step"><span class="gc-path-dot" aria-hidden="true"></span><div><small>This week</small><strong>${escapeHtml(week)}</strong></div></li>
    <li class="gc-path-step is-current"><span class="gc-path-dot" aria-hidden="true"></span><div><small>${next?.status==='in_progress'?'Now':'Today'}</small><strong>${escapeHtml(today)}</strong></div></li>
  </ol>`;
}

function directionRail(goals=[]){
  if(!goals.length)return '';
  return `<div class="gc-direction-list">${goals.slice(0,3).map((goal,index)=>`<button type="button" class="gc-direction-item${index===0?' is-focus':''}" data-compass-open="goals"><span>${escapeHtml(goal.area_name||'Direction')}</span><strong>${escapeHtml(goal.name)}</strong>${index===0?'<b>Current</b>':''}</button>`).join('')}</div>`;
}

function capacityState(plan){
  const available=Math.max(0,Number(plan?.flexible_minutes)||0);
  const planned=Math.max(0,Number(plan?.planned_goal_minutes)||0);
  const committed=Math.max(0,Number(plan?.committed_minutes)||0);
  const remaining=Math.max(0,available-planned);
  const over=Math.max(0,planned-available);
  return {available,planned,committed,remaining,over,total:Math.max(1,available+committed)};
}
function capacityMarkup(plan,routine){
  if(!routine.length){
    return `<section class="gc-capacity gc-capacity-setup" aria-labelledby="capacityTitle"><div class="gc-section-label"><span>This week</span></div><div class="gc-capacity-setup-visual" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><h3 id="capacityTitle">Make capacity real.</h3><p>Set the parts of a normal week that are already spoken for. Until then, Growth Compass will not pretend all 168 hours are usable.</p><button type="button" class="secondary-button" data-compass-open="schedule">Set normal week</button></section>`;
  }
  const c=capacityState(plan);const committedPct=Math.min(100,c.committed/c.total*100);const plannedPct=Math.min(100,c.planned/c.total*100);const remainingPct=Math.max(0,100-committedPct-plannedPct);
  const headline=c.over?`${minutesLabel(c.over)} over realistic capacity`:`${minutesLabel(c.remaining)} still flexible`;
  return `<section class="gc-capacity" aria-labelledby="capacityTitle"><div class="gc-section-label"><span>This week</span><button type="button" class="text-button" data-compass-open="schedule">Edit routine</button></div><h3 id="capacityTitle">${escapeHtml(headline)}</h3><div class="gc-capacity-bar" role="img" aria-label="${minutesLabel(c.committed)} fixed, ${minutesLabel(c.planned)} planned, ${minutesLabel(c.remaining)} flexible"><i class="is-fixed" style="width:${committedPct.toFixed(2)}%"></i><i class="is-planned" style="width:${plannedPct.toFixed(2)}%"></i><i class="is-free" style="width:${remainingPct.toFixed(2)}%"></i></div><dl class="gc-capacity-legend"><div><dt>Fixed</dt><dd>${minutesLabel(c.committed)}</dd></div><div><dt>Planned</dt><dd>${minutesLabel(c.planned)}</dd></div><div><dt>Flexible</dt><dd>${minutesLabel(c.remaining)}</dd></div></dl></section>`;
}

function routineMarkup(routine=[]){
  if(!routine.length)return '';
  return `<section class="gc-routine-strip"><div class="gc-section-label"><span>Normal week</span><button type="button" class="text-button" data-compass-open="schedule">Adjust</button></div><div class="gc-routine-chips">${routine.slice(0,6).map(item=>`<span><strong>${escapeHtml(item.name||'Commitment')}</strong><small>${escapeHtml(item.start_time&&item.end_time?`${item.start_time}–${item.end_time}`:minutesLabel(item.minutes))}</small></span>`).join('')}</div></section>`;
}

export function renderCompass(model){
  const goals=activeGoals(model.direction);const focus=goals[0]||null;const routine=activeRoutine(model.plan);const next=nextToday(model.plan);
  if(!focus){
    return `<div class="composition-view gc-instrument compass-view"><section class="gc-empty-primary"><div class="gc-empty-symbol" aria-hidden="true">◇</div><p class="eyebrow">Compass</p><h2>Choose one direction.</h2><p>Start with one part of life you genuinely want to change. Planning comes after direction.</p><button type="button" class="primary-button" data-compass-open="goals">Choose what matters</button></section></div>`;
  }
  return `<div class="composition-view gc-instrument compass-view">
    <header class="gc-page-lead"><div><p class="eyebrow">Compass</p><h2>${escapeHtml(focus.name)}</h2>${focus.why_text?`<p>${escapeHtml(focus.why_text)}</p>`:''}</div><button type="button" class="primary-button" data-compass-plan>${next?'Plan another':'Plan next step'}</button></header>
    <section class="gc-path-card"><div class="gc-section-label"><span>Direction → today</span><button type="button" class="text-button" data-compass-open="goals">Edit direction</button></div>${pathMarkup(model.plan,focus)}</section>
    <div class="gc-compass-grid">
      <section class="gc-directions"><div class="gc-section-label"><span>What matters</span><b>${goals.length} active</b></div>${directionRail(goals)}${goals.length>3?'<button type="button" class="text-button" data-compass-open="goals">See all directions</button>':''}</section>
      ${capacityMarkup(model.plan,routine)}
    </div>
    ${routineMarkup(routine)}
  </div>`;
}

export function bindCompass(model,{navigate,openPlanner}={}){
  document.querySelectorAll('[data-compass-open]').forEach(button=>button.addEventListener('click',()=>navigate?.(button.dataset.compassOpen)));
  document.querySelector('[data-compass-plan]')?.addEventListener('click',()=>openPlanner?.({entryMode:'planned',date:model.plan?.date}));
}
