import { loadPlan } from './plan.js';
import { loadGoals } from './goals.js';

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function minutesLabel(value){const minutes=Math.max(0,Math.round(Number(value)||0));const hours=Math.floor(minutes/60),rest=minutes%60;if(!hours)return`${rest}m`;if(!rest)return`${hours}h`;return`${hours}h ${rest}m`;}
function activeGoals(model){return (model?.goals||[]).filter(goal=>goal.status!=='archived'&&goal.status!=='completed');}

export async function loadCompass(){
  const [plan,direction]=await Promise.all([loadPlan({period:'week'}),loadGoals()]);
  return {plan,direction};
}

function compassLine(goal,todayItems=[]){
  const next=todayItems.find(item=>item.status==='in_progress')||todayItems.find(item=>item.status==='planned');
  return `<ol class="compass-line" aria-label="Direction to action">
    <li><span>Direction</span><strong>${escapeHtml(goal?.name||'Choose what matters')}</strong></li>
    <li><span>Season</span><strong>${goal?'Keep it visible':'—'}</strong></li>
    <li><span>Week</span><strong>${goal?'One useful move':'—'}</strong></li>
    <li class="is-current"><span>Today</span><strong>${escapeHtml(next?.title||'Open attention')}</strong></li>
  </ol>`;
}

function directionList(goals=[]){
  if(!goals.length)return `<div class="compass-empty"><button type="button" class="primary-button" data-compass-open="goals">Choose what matters</button></div>`;
  return goals.slice(0,4).map((goal,index)=>`<article class="compass-direction-row${index===0?' is-primary':''}"><div><span>${escapeHtml(goal.area_name||'Direction')}</span><strong>${escapeHtml(goal.name)}</strong>${goal.why_text?`<p>${escapeHtml(goal.why_text)}</p>`:''}</div>${index===0?'<b>Focus</b>':''}</article>`).join('');
}

function capacityState(plan){
  const available=Math.max(0,Number(plan?.flexible_minutes)||0);
  const planned=Math.max(0,Number(plan?.planned_goal_minutes)||0);
  const committed=Math.max(0,Number(plan?.committed_minutes)||0);
  const over=Math.max(0,planned-available);
  const remaining=Math.max(0,available-planned);
  const pct=available?Math.min(100,Math.round(planned/available*100)):0;
  return {available,planned,committed,over,remaining,pct};
}

function capacityVisual(capacity){
  const center=capacity.over?`${minutesLabel(capacity.over)} over`:`${minutesLabel(capacity.remaining)} free`;
  return `<div class="compass-capacity-visual">
    <div class="compass-capacity-ring" style="--capacity:${capacity.pct}" role="meter" aria-label="${capacity.pct} percent of flexible time planned" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${capacity.pct}"><strong>${capacity.pct}%</strong><span>planned</span></div>
    <div class="compass-capacity-copy"><strong>${escapeHtml(center)}</strong><p>${minutesLabel(capacity.planned)} planned from ${minutesLabel(capacity.available)} available.</p><dl class="compass-facts"><div><dt>Available</dt><dd>${minutesLabel(capacity.available)}</dd></div><div><dt>Planned</dt><dd>${minutesLabel(capacity.planned)}</dd></div><div><dt>Fixed</dt><dd>${minutesLabel(capacity.committed)}</dd></div></dl></div>
  </div>`;
}

export function renderCompass(model){
  const goals=activeGoals(model.direction);
  const focus=goals[0]||null;
  const capacity=capacityState(model.plan);
  const routine=(model.plan?.commitments||[]).filter(item=>Number(item.active??1)===1);
  return `<div class="composition-view compass-view">
    <header class="composition-header">
      <div><p class="eyebrow">Compass</p><h2>Where are you going?</h2><p>Direction becomes useful when it reaches today.</p></div>
      <button type="button" class="primary-button" data-compass-plan>Plan next step</button>
    </header>
    <section class="compass-map" aria-labelledby="compassMapTitle">
      <div class="composition-section-heading"><div><p class="eyebrow">Route</p><h3 id="compassMapTitle">Direction → today</h3></div><button type="button" class="ghost-button compact" data-compass-open="goals">Edit</button></div>
      ${compassLine(focus,model.plan?.todayItems||[])}
    </section>
    <div class="composition-two-column">
      <section class="composition-panel compass-directions">
        <div class="composition-section-heading"><div><p class="eyebrow">Directions</p><h3>What matters</h3></div><span>${goals.length} active</span></div>
        <div class="compass-direction-list">${directionList(goals)}</div>
        ${goals.length?'<button type="button" class="secondary-button" data-compass-open="goals">All directions</button>':''}
      </section>
      <section class="composition-panel compass-reality">
        <div class="composition-section-heading"><div><p class="eyebrow">This week</p><h3>Capacity</h3></div></div>
        ${capacityVisual(capacity)}
        <div class="compass-reality-actions"><button type="button" class="secondary-button" data-compass-open="schedule">Routine</button><button type="button" class="ghost-button" data-compass-open="plan">Planning details</button></div>
      </section>
    </div>
    <section class="composition-panel compass-routine">
      <div class="composition-section-heading"><div><p class="eyebrow">Normal week</p><h3>Recurring shape</h3></div><span>${routine.length?`${routine.length} blocks`:'No blocks'}</span></div>
      ${routine.length?`<div class="compass-routine-list">${routine.slice(0,7).map(item=>`<span><strong>${escapeHtml(item.name||'Commitment')}</strong><small>${escapeHtml(item.start_time&&item.end_time?`${item.start_time}–${item.end_time}`:minutesLabel(item.minutes))}</small></span>`).join('')}</div>`:'<p class="composition-muted">Add fixed time only when it improves planning.</p>'}
      <div class="compass-routine-actions"><button type="button" class="secondary-button" data-compass-open="schedule">${routine.length?'Adjust':'Set routine'}</button><button type="button" class="ghost-button" data-compass-open="activities">Activities</button></div>
    </section>
  </div>`;
}

export function bindCompass(model,{navigate,openPlanner}={}){
  document.querySelectorAll('[data-compass-open]').forEach(button=>button.addEventListener('click',()=>navigate?.(button.dataset.compassOpen)));
  document.querySelector('[data-compass-plan]')?.addEventListener('click',()=>openPlanner?.({entryMode:'planned',date:model.plan?.date}));
}
