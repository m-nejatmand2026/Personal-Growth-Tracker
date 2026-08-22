import { loadProgress } from './progress.js';
import { loadInsights } from './insights.js';

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function minutesLabel(value){const minutes=Math.max(0,Math.round(Number(value)||0));const hours=Math.floor(minutes/60),rest=minutes%60;if(!hours)return`${rest}m`;if(!rest)return`${hours}h`;return`${hours}h ${rest}m`;}
function dayKey(){const now=new Date();const offset=now.getTimezoneOffset()*60000;return new Date(now.getTime()-offset).toISOString().slice(0,10);}
function addDays(dateText,amount){const date=new Date(`${dateText}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
function median(values=[]){if(!values.length)return null;const sorted=values.map(Number).filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return null;const i=Math.floor(sorted.length/2);return sorted.length%2?sorted[i]:(sorted[i-1]+sorted[i])/2;}
function stageFor(count){if(count<=6)return{label:'Building your baseline',detail:'Keep recording ordinary days. Patterns would be premature now.'};if(count<=20)return{label:'Descriptive summaries',detail:'Simple trends can start to be useful, but associations still need more paired observations.'};if(count<=41)return{label:'Early patterns',detail:'Possible associations are hypotheses. Sample size and uncertainty stay visible.'};return{label:'Stronger evidence',detail:'More history can strengthen repeated associations, but it still does not prove cause.'};}
function energyWord(value){if(value==null)return'—';if(value<=-2)return'Drained';if(value<0)return'Low';if(value===0)return'Okay';if(value<2)return'Good';return'Strong';}
function moodWord(value){if(value==null)return'—';if(value<=-2)return'Very negative';if(value<0)return'Negative';if(value===0)return'Neutral';if(value<2)return'Positive';return'Very positive';}

export async function loadPatterns(){
  const [progress,insights]=await Promise.all([loadProgress(),loadInsights()]);
  return {progress,insights};
}

function lineChart(items=[]){
  const ordered=[...items].sort((a,b)=>String(a.occurred_on).localeCompare(String(b.occurred_on))).slice(-30);
  if(ordered.length<2)return '<div class="patterns-chart-empty"><strong>Not enough energy history yet.</strong><span>Two or more check-ins are needed to draw a trend.</span></div>';
  const width=600,height=180,pad=18,innerW=width-pad*2,innerH=height-pad*2;
  const points=ordered.map((item,index)=>{const x=pad+(ordered.length===1?0:index/(ordered.length-1)*innerW);const score=Math.max(-3,Math.min(3,Number(item.energy_score)||0));const y=pad+(3-score)/6*innerH;return{x,y,score,date:item.occurred_on};});
  const polyline=points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return `<div class="patterns-chart-wrap"><svg class="patterns-line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Reported energy over the last ${ordered.length} check-ins"><line x1="${pad}" x2="${width-pad}" y1="${height/2}" y2="${height/2}" class="chart-zero"/><polyline points="${polyline}" class="chart-line"/>${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" class="chart-point"><title>${escapeHtml(p.date)}: ${escapeHtml(energyWord(p.score))}</title></circle>`).join('')}</svg><div class="patterns-chart-axis" aria-hidden="true"><span>Strong</span><span>Okay</span><span>Drained</span></div></div>`;
}

function moodEnergyMap(items=[]){
  const recent=[...items].slice(-42);
  if(recent.length<4)return '<div class="patterns-chart-empty compact"><strong>Energy × mood map is still learning.</strong><span>Keep check-ins quick; this view becomes useful with more ordinary days.</span></div>';
  const width=360,height=300,pad=28,innerW=width-pad*2,innerH=height-pad*2;
  const dots=recent.map(item=>{const e=Math.max(-3,Math.min(3,Number(item.energy_score)||0));const v=Math.max(-3,Math.min(3,Number(item.valence_score)||0));const x=pad+(v+3)/6*innerW;const y=pad+(3-e)/6*innerH;return`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"><title>${escapeHtml(item.occurred_on)} · ${escapeHtml(energyWord(e))} energy · ${escapeHtml(moodWord(v))} mood</title></circle>`;}).join('');
  return `<div class="patterns-map-wrap"><svg class="patterns-map" viewBox="0 0 ${width} ${height}" role="img" aria-label="Energy and mood observations"><line x1="${width/2}" x2="${width/2}" y1="${pad}" y2="${height-pad}"/><line x1="${pad}" x2="${width-pad}" y1="${height/2}" y2="${height/2}"/>${dots}</svg><span class="map-label map-top">Higher energy</span><span class="map-label map-bottom">Lower energy</span><span class="map-label map-left">More negative</span><span class="map-label map-right">More positive</span></div>`;
}

function progressFacts(items=[]){
  const today=dayKey(),from=addDays(today,-6);const week=items.filter(item=>item.occurred_on>=from&&item.occurred_on<=today);const minutes=week.reduce((sum,item)=>sum+Math.max(0,Number(item.minutes)||0),0);const days=new Set(week.map(item=>item.occurred_on)).size;
  return {week,minutes,days};
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
  return `<div class="composition-view patterns-view">
    <header class="composition-header">
      <div><p class="eyebrow">Patterns</p><h2>What is your life showing you?</h2><p>Facts first, interpretation second. Growth Compass stays quiet when the evidence is thin.</p></div>
      <span class="evidence-stage"><strong>${trackedDays}</strong> tracked ${trackedDays===1?'day':'days'}</span>
    </header>
    <section class="patterns-readiness composition-panel">
      <div><p class="eyebrow">Evidence readiness</p><h3>${escapeHtml(stage.label)}</h3><p>${escapeHtml(stage.detail)}</p></div>
      <button type="button" class="ghost-button" data-patterns-open="insights">How evidence is judged</button>
    </section>
    <section class="patterns-question">
      <div class="composition-section-heading"><div><p class="eyebrow">When is my energy strongest?</p><h3>Your reported energy</h3></div><span>Last 30 check-ins</span></div>
      ${lineChart(energy)}
      <dl class="patterns-fact-row"><div><dt>Typical energy</dt><dd>${escapeHtml(energyWord(typicalEnergy))}</dd></div><div><dt>Recent movement</dt><dd>${escapeHtml(movement)}</dd></div><div><dt>Typical mood</dt><dd>${escapeHtml(moodWord(typicalMood))}</dd></div></dl>
      <p class="composition-boundary">These are descriptions of your records, not explanations of why they changed.</p>
    </section>
    <div class="composition-two-column">
      <section class="patterns-question compact-question">
        <div class="composition-section-heading"><div><p class="eyebrow">How do energy and mood relate?</p><h3>Energy × mood map</h3></div></div>
        ${moodEnergyMap(energy)}
      </section>
      <section class="patterns-question compact-question">
        <div class="composition-section-heading"><div><p class="eyebrow">Where is my time going?</p><h3>Factual progress · 7 days</h3></div></div>
        <dl class="patterns-big-facts"><div><dt>Recorded time</dt><dd>${minutesLabel(facts.minutes)}</dd></div><div><dt>Records</dt><dd>${facts.week.length}</dd></div><div><dt>Active days</dt><dd>${facts.days}</dd></div></dl>
        <button type="button" class="secondary-button" data-patterns-open="progress">See factual progress</button>
      </section>
    </div>
    <section class="patterns-adjust composition-panel">
      <div><p class="eyebrow">From observation to action</p><h3>Try one adjustment, not ten.</h3><p>When you notice a pattern worth exploring, choose one small change for a limited period. Growth Compass can help you compare what happened afterward without pretending it proves cause.</p></div>
      <button type="button" class="secondary-button" data-patterns-adjust>Choose an adjustment</button>
    </section>
  </div>`;
}

export function bindPatterns(model,{navigate,openAdjustment}={}){
  document.querySelectorAll('[data-patterns-open]').forEach(button=>button.addEventListener('click',()=>navigate?.(button.dataset.patternsOpen)));
  document.querySelector('[data-patterns-adjust]')?.addEventListener('click',()=>openAdjustment?.(model));
}
