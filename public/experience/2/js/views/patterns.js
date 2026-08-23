import { loadProgress } from './progress.js';
import { loadInsights } from './insights.js';

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function minutesLabel(value){const minutes=Math.max(0,Math.round(Number(value)||0));const hours=Math.floor(minutes/60),rest=minutes%60;if(!hours)return`${rest}m`;if(!rest)return`${hours}h`;return`${hours}h ${rest}m`;}
function dayKey(){const now=new Date();const offset=now.getTimezoneOffset()*60000;return new Date(now.getTime()-offset).toISOString().slice(0,10);}
function addDays(dateText,amount){const date=new Date(`${dateText}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
function median(values=[]){if(!values.length)return null;const sorted=values.map(Number).filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return null;const i=Math.floor(sorted.length/2);return sorted.length%2?sorted[i]:(sorted[i-1]+sorted[i])/2;}
function stageFor(count){if(count<=6)return{label:'Building baseline',detail:'Not enough history for patterns yet.'};if(count<=20)return{label:'Descriptive',detail:'Simple trends are becoming visible.'};if(count<=41)return{label:'Early patterns',detail:'Treat associations as hypotheses.'};return{label:'Stronger evidence',detail:'Repeated associations can be more informative, not causal.'};}
function energyWord(value){if(value==null)return'—';if(value<=-2)return'Drained';if(value<0)return'Low';if(value===0)return'Okay';if(value<2)return'Good';return'Strong';}
function moodWord(value){if(value==null)return'—';if(value<=-2)return'Very negative';if(value<0)return'Negative';if(value===0)return'Neutral';if(value<2)return'Positive';return'Very positive';}

export async function loadPatterns(){
  const [progress,insights]=await Promise.all([loadProgress(),loadInsights()]);
  return {progress,insights};
}

function lineChart(items=[]){
  const ordered=[...items].sort((a,b)=>String(a.occurred_on).localeCompare(String(b.occurred_on))).slice(-30);
  if(ordered.length<2)return '<div class="patterns-chart-empty"><strong>Energy trend is still forming.</strong><span>Keep checking in on ordinary days.</span></div>';
  const width=600,height=180,pad=18,innerW=width-pad*2,innerH=height-pad*2;
  const points=ordered.map((item,index)=>{const x=pad+(ordered.length===1?0:index/(ordered.length-1)*innerW);const score=Math.max(-3,Math.min(3,Number(item.energy_score)||0));const y=pad+(3-score)/6*innerH;return{x,y,score,date:item.occurred_on};});
  const polyline=points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return `<div class="patterns-chart-wrap"><svg class="patterns-line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Reported energy over the last ${ordered.length} check-ins"><line x1="${pad}" x2="${width-pad}" y1="${height/2}" y2="${height/2}" class="chart-zero"/><polyline points="${polyline}" class="chart-line"/>${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" class="chart-point"><title>${escapeHtml(p.date)}: ${escapeHtml(energyWord(p.score))}</title></circle>`).join('')}</svg><div class="patterns-chart-axis" aria-hidden="true"><span>Strong</span><span>Okay</span><span>Drained</span></div></div>`;
}

function moodEnergyMap(items=[]){
  const recent=[...items].slice(-42);
  if(recent.length<4)return '<div class="patterns-chart-empty compact"><strong>Energy × mood is still forming.</strong><span>More ordinary check-ins will reveal the shape.</span></div>';
  const width=360,height=300,pad=28,innerW=width-pad*2,innerH=height-pad*2;
  const dots=recent.map(item=>{const e=Math.max(-3,Math.min(3,Number(item.energy_score)||0));const v=Math.max(-3,Math.min(3,Number(item.valence_score)||0));const x=pad+(v+3)/6*innerW;const y=pad+(3-e)/6*innerH;return`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"><title>${escapeHtml(item.occurred_on)} · ${escapeHtml(energyWord(e))} energy · ${escapeHtml(moodWord(v))} mood</title></circle>`;}).join('');
  return `<div class="patterns-map-wrap"><svg class="patterns-map" viewBox="0 0 ${width} ${height}" role="img" aria-label="Energy and mood observations"><line x1="${width/2}" x2="${width/2}" y1="${pad}" y2="${height-pad}"/><line x1="${pad}" x2="${width-pad}" y1="${height/2}" y2="${height/2}"/>${dots}</svg><span class="map-label map-top">Higher energy</span><span class="map-label map-bottom">Lower energy</span><span class="map-label map-left">More negative</span><span class="map-label map-right">More positive</span></div>`;
}

function progressFacts(items=[]){
  const today=dayKey(),from=addDays(today,-6);const week=items.filter(item=>item.occurred_on>=from&&item.occurred_on<=today);const minutes=week.reduce((sum,item)=>sum+Math.max(0,Number(item.minutes)||0),0);const days=new Set(week.map(item=>item.occurred_on)).size;
  return {today,from,week,minutes,days};
}

function weekStrip(items=[]){
  const facts=progressFacts(items);
  const days=[];
  for(let offset=0;offset<7;offset+=1){
    const date=addDays(facts.from,offset);const records=facts.week.filter(item=>item.occurred_on===date);const minutes=records.reduce((sum,item)=>sum+Math.max(0,Number(item.minutes)||0),0);const strength=Math.min(88,Math.max(0,Math.round(minutes/180*88)));const label=new Intl.DateTimeFormat(undefined,{weekday:'short',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));days.push(`<div class="patterns-week-day" style="--day-strength:${strength}" aria-label="${escapeHtml(`${label}: ${minutesLabel(minutes)}, ${records.length} records`)}"><i aria-hidden="true"></i><strong>${escapeHtml(label.slice(0,2))}</strong><span>${minutes?escapeHtml(minutesLabel(minutes)):'—'}</span></div>`);
  }
  return `<div class="patterns-week-strip" aria-label="Recorded progress across the last seven days">${days.join('')}</div>`;
}

export function renderPatterns(model){
  const energy=model.insights?.energy||[];
  const progress=model.progress?.items||[];
  const trackedDays=new Set([...energy.map(item=>item.occurred_on),...progress.map(item=>item.occurred_on)]).size;
  const stage=stageFor(trackedDays);
  const typicalEnergy=median(energy.map(item=>item.energy_score));
  const typicalMood=median(energy.map(item=>item.valence_score));
  const facts=progressFacts(progress);
  const recentEnergy=energy.slice(-14);
  const firstHalf=recentEnergy.slice(0,Math.floor(recentEnergy.length/2));
  const secondHalf=recentEnergy.slice(Math.floor(recentEnergy.length/2));
  const early=median(firstHalf.map(item=>item.energy_score)),late=median(secondHalf.map(item=>item.energy_score));
  const movement=early==null||late==null?'Not enough data':late>early?'Recently higher':late<early?'Recently lower':'Broadly steady';
  const evidencePct=Math.min(100,Math.round(trackedDays/42*100));
  return `<div class="composition-view patterns-view">
    <header class="composition-header">
      <div><p class="eyebrow">Patterns</p><h2>What is your life showing you?</h2><p>Evidence before interpretation.</p></div>
      <span class="evidence-stage"><strong>${trackedDays}</strong> tracked ${trackedDays===1?'day':'days'}</span>
    </header>
    <section class="patterns-readiness composition-panel">
      <div class="evidence-orbit" style="--evidence:${evidencePct}" aria-label="${trackedDays} tracked days toward stronger evidence"><strong>${trackedDays}</strong><span>days</span></div>
      <div><p class="eyebrow">Evidence</p><h3>${escapeHtml(stage.label)}</h3><p>${escapeHtml(stage.detail)}</p></div>
      <button type="button" class="ghost-button" data-patterns-open="insights">Evidence rules</button>
    </section>
    <section class="patterns-question">
      <div class="composition-section-heading"><div><p class="eyebrow">Energy</p><h3>Your reported energy</h3></div><span>Last 30</span></div>
      ${lineChart(energy)}
      <dl class="patterns-fact-row"><div><dt>Typical</dt><dd>${escapeHtml(energyWord(typicalEnergy))}</dd></div><div><dt>Movement</dt><dd>${escapeHtml(movement)}</dd></div><div><dt>Mood</dt><dd>${escapeHtml(moodWord(typicalMood))}</dd></div></dl>
      <p class="composition-boundary">Descriptions of your records, not explanations of why they changed.</p>
    </section>
    <div class="composition-two-column">
      <section class="patterns-question compact-question">
        <div class="composition-section-heading"><div><p class="eyebrow">Relationship</p><h3>Energy × mood</h3></div></div>
        ${moodEnergyMap(energy)}
      </section>
      <section class="patterns-question compact-question">
        <div class="composition-section-heading"><div><p class="eyebrow">Time</p><h3>Last 7 days</h3></div></div>
        ${weekStrip(progress)}
        <dl class="patterns-big-facts"><div><dt>Recorded</dt><dd>${minutesLabel(facts.minutes)}</dd></div><div><dt>Records</dt><dd>${facts.week.length}</dd></div><div><dt>Active days</dt><dd>${facts.days}</dd></div></dl>
        <button type="button" class="secondary-button" data-patterns-open="progress">Progress details</button>
      </section>
    </div>
    <section class="patterns-adjust composition-panel">
      <div><p class="eyebrow">Adjust</p><h3>Try one change.</h3><p>Compare what happens next without claiming cause.</p></div>
      <button type="button" class="secondary-button" data-patterns-adjust>Choose adjustment</button>
    </section>
  </div>`;
}

export function bindPatterns(model,{navigate,openAdjustment}={}){
  document.querySelectorAll('[data-patterns-open]').forEach(button=>button.addEventListener('click',()=>navigate?.(button.dataset.patternsOpen)));
  document.querySelector('[data-patterns-adjust]')?.addEventListener('click',()=>openAdjustment?.(model));
}
