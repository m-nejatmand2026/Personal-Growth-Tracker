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
    <li><span>This season</span><strong>${goal?'Keep this direction visible':'Not set yet'}</strong></li>
    <li><span>This week</span><strong>${goal?'Make one useful move':'Start with one direction'}</strong></li>
    <li class="is-current"><span>Today</span><strong>${escapeHtml(next?.title||'Choose what deserves attention')}</strong></li>
  </ol>`;
}

function directionList(goals=[]){
  if(!goals.length)return `<div class="compass-empty"><p>No direction is active yet.</p><button type="button" class="primary-button" data-compass-open="goals">Choose what matters</button></div>`;
  return goals.slice(0,4).map((goal,index)=>`<article class="compass-direction-row${index===0?' is-primary':''}"><div><span>${escapeHtml(goal.area_name||'Direction')}</span><strong>${escapeHtml(goal.name)}</strong>${goal.why_text?`<p>${escapeHtml(goal.why_text)}</p>`:''}</div>${index===0?'<b>Current focus</b>':''}</article>`).join('');
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

export function renderCompass(model){
  const goals=activeGoals(model.direction);
  const focus=goals[0]||null;
  const capacity=capacityState(model.plan);
  const routine=(model.plan?.commitments||[]).filter(item=>Number(item.active??1)===1);
  return `<div class="composition-view compass-view">
    <header class="composition-header">
      <div><p class="eyebrow">Compass</p><h2>Where are you going?</h2><p>Keep the direction visible, then make only the next part concrete.</p></div>
      <button type="button" class="primary-button" data-compass-plan>Plan a next step</button>
    </header>
    <section class="compass-map" aria-labelledby="compassMapTitle">
      <div class="composition-section-heading"><div><p class="eyebrow">From direction to today</p><h3 id="compassMapTitle">Make your days point somewhere.</h3></div><button type="button" class="ghost-button compact" data-compass-open="goals">Edit direction</button></div>
      ${compassLine(focus,model.plan?.todayItems||[])}
    </section>
    <div class="composition-two-column">
      <section class="composition-panel compass-directions">
        <div class="composition-section-heading"><div><p class="eyebrow">What matters</p><h3>Your directions</h3></div><span>${goals.length} active</span></div>
        <div class="compass-direction-list">${directionList(goals)}</div>
        ${goals.length?'<button type="button" class="secondary-button" data-compass-open="goals">Review all directions</button>':''}
      </section>
      <section class="composition-panel compass-reality">
        <div class="composition-section-heading"><div><p class="eyebrow">Reality check · this week</p><h3>Does the plan fit your life?</h3></div></div>
        <div class="compass-capacity-line" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${capacity.pct}"><span style="width:${capacity.pct}%"></span></div>
        <div class="compass-capacity-copy"><strong>${capacity.over?`${minutesLabel(capacity.over)} over available time`:`${minutesLabel(capacity.remaining)} still flexible`}</strong><p>${minutesLabel(capacity.planned)} planned from ${minutesLabel(capacity.available)} available after recurring commitments. Capacity is arithmetic, not a score.</p></div>
        <dl class="compass-facts"><div><dt>Available</dt><dd>${minutesLabel(capacity.available)}</dd></div><div><dt>Planned</dt><dd>${minutesLabel(capacity.planned)}</dd></div><div><dt>Committed</dt><dd>${minutesLabel(capacity.committed)}</dd></div></dl>
        <div class="compass-reality-actions"><button type="button" class="secondary-button" data-compass-open="schedule">Shape my routine</button><button type="button" class="ghost-button" data-compass-open="plan">Open planning details</button></div>
      </section>
    </div>
    <section class="composition-panel compass-routine">
      <div class="composition-section-heading"><div><p class="eyebrow">Normal week</p><h3>Your routine should protect reality.</h3></div><span>${routine.length?`${routine.length} recurring blocks`:'No recurring blocks yet'}</span></div>
      ${routine.length?`<div class="compass-routine-list">${routine.slice(0,6).map(item=>`<span><strong>${escapeHtml(item.name||'Commitment')}</strong><small>${escapeHtml(item.start_time&&item.end_time?`${item.start_time}–${item.end_time}`:minutesLabel(item.minutes))}</small></span>`).join('')}</div>`:'<p class="composition-muted">Add work, sleep, commute, family or other fixed time only when it helps make planning more realistic.</p>'}
      <div class="compass-routine-actions"><button type="button" class="secondary-button" data-compass-open="schedule">${routine.length?'Adjust routine':'Set my routine'}</button><button type="button" class="ghost-button" data-compass-open="activities">Activity library</button></div>
    </section>
  </div>`;
}

export function bindCompass(model,{navigate,openPlanner}={}){
  document.querySelectorAll('[data-compass-open]').forEach(button=>button.addEventListener('click',()=>navigate?.(button.dataset.compassOpen)));
  document.querySelector('[data-compass-plan]')?.addEventListener('click',()=>openPlanner?.({entryMode:'planned',date:model.plan?.date}));
}
