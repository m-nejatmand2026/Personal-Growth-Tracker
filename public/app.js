const ENERGY = [
  ['Anger','Stress','Shock','Surprise','Aroused','Elated'],
  ['Agitated','Irritated','Restless','Energized','Optimistic','Happy'],
  ['Reactive','Worried','Displeased','Pleased','Hopeful','Grateful'],
  ['Hate','Bored','Numb','Comfortable','Satisfied','Neutral'],
  ['Pessimistic','Lonely','Tired','Relaxed','At Ease','Balanced'],
  ['Miserable','Devastated','Empty','Sleepy','Blissful','Composed']
];
const TASKS = {
  1:[['sport',80,'Morning calisthenics'],['german',30,'Momente / German'],['guitar',30,'Course practice']],
  2:[['german',60,'Deep work in the morning'],['guitar',30,'Course practice'],['reading',30,'Reading']],
  3:[['sport',80,'Morning calisthenics'],['german',30,'Speaking / listening'],['guitar',30,'Course practice']],
  4:[['german',60,'45m Momente + 15m writing'],['guitar',30,'Course practice'],['reading',45,'Reading']],
  5:[['sport',80,'Morning calisthenics']],
  6:[['german',30,'Optional catch-up'],['guitar',15,'Optional'],['reading',30,'Optional']],
  0:[['sport',80,'Morning calisthenics'],['german',30,'Review / speaking'],['guitar',45,'Course practice'],['reading',60,'Reading']]
};
const state={date:new Date().toISOString().slice(0,10),data:null,selectedEnergy:null,view:'today'};
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
function fmtMin(m){m=Number(m)||0;const h=Math.floor(m/60),r=m%60;return h?`${h}h${r?` ${r}m`:''}`:`${r}m`}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
async function api(path,opts={}){const r=await fetch(path,{headers:{'content-type':'application/json',...(opts.headers||{})},...opts});if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||`HTTP ${r.status}`);return r.json()}
function fallback(){return {date:state.date,week_start:state.date,energy:null,sessions:[],week:[
  {key:'sport',name:'Sport / Calisthenics',target_minutes:324,minimum_minutes:180,actual_minutes:0,progress:0},
  {key:'german',name:'German',target_minutes:216,minimum_minutes:120,actual_minutes:0,progress:0},
  {key:'guitar',name:'Guitar',target_minutes:135,minimum_minutes:60,actual_minutes:0,progress:0},
  {key:'reading',name:'Reading',target_minutes:216,minimum_minutes:120,actual_minutes:0,progress:0}],
  targets:[],roadmap:[{id:1,horizon:'six_month',title:'German - Momente B1',detail:'Finish 24 lessons by 31 Dec 2026.'},{id:2,horizon:'compass',title:'Physical mastery',detail:'Calisthenics stays permanent; rotating sports stay editable.'}],
  lessons:Array.from({length:24},(_,i)=>({lesson:i+1,planned_start:'',planned_end:'',completed_at:null}))}}
async function load(){try{state.data=await api(`/api/bootstrap?date=${state.date}`)}catch(e){state.data=fallback()} state.selectedEnergy=state.data.energy;renderAll()}
function energyScore(r){return r<3?3-r:-(r-2)} function valenceScore(c){return c<3?-(3-c):(c-2)}
function energyClass(r,c){return r<3?(c<3?'tl':'tr'):(c<3?'bl':'br')}
function energyMap(){return `<div class="energy-axis high">↑ High Energy</div><div class="valence"><span>← Negative Feeling</span><span>Positive Feeling →</span></div><div class="energy-grid">${ENERGY.flatMap((row,r)=>row.map((label,c)=>`<button class="energy-cell ${energyClass(r,c)} ${state.selectedEnergy?.row_idx===r&&state.selectedEnergy?.col_idx===c?'selected':''}" data-energy-r="${r}" data-energy-c="${c}">${label}</button>`)).join('')}</div><div class="energy-axis low">↓ Low Energy</div>`}
function dateLabel(){return new Intl.DateTimeFormat('en',{weekday:'long',day:'numeric',month:'long'}).format(new Date(`${state.date}T12:00:00`))}
function taskActual(key){return (state.data.sessions||[]).filter(s=>s.activity_key===key).reduce((a,s)=>a+Number(s.minutes),0)}
function renderToday(){const day=new Date(`${state.date}T12:00:00`).getDay();const tasks=TASKS[day]||[];const selected=state.selectedEnergy;$('#todayView').innerHTML=`
  <div class="card"><div class="section-head"><div><h2>${dateLabel()}</h2><p>Start with how you actually feel. One check-in per day.</p></div>${selected?`<span class="badge">${esc(selected.label)}</span>`:''}</div>
  ${energyMap()}
  <div class="energy-result">${selected?`<div><span class="small muted">Selected</span><br><strong>${esc(selected.label)}</strong></div>`:`<span class="muted">Choose one state from the map.</span>`}</div>
  <div class="actions"><input id="energyNote" class="note-input" placeholder="Optional note" value="${esc(selected?.note||'')}"/><button id="saveEnergy" class="btn primary" ${selected?'':'disabled'}>Save check-in</button></div></div>
  <div class="card"><div class="section-head"><div><h2>Today</h2><p>${day===5?'Friday evening stays free. ':''}Log what you actually do; no catch-up debt.</p></div></div>
  <div>${tasks.map(([key,min,desc])=>`<div class="today-task"><div><div class="task-title">${key==='sport'?'Sport / Calisthenics':key[0].toUpperCase()+key.slice(1)}</div><div class="task-meta">${desc} · suggested ${fmtMin(min)} · today ${fmtMin(taskActual(key))}</div></div><div class="quick"><button data-log="${key}" data-min="${min}">+ ${fmtMin(min)}</button></div></div>`).join('')}</div></div>`;
  bindToday();
}
function bindToday(){$$('[data-energy-r]').forEach(b=>b.addEventListener('click',()=>{const r=Number(b.dataset.energyR),c=Number(b.dataset.energyC);state.selectedEnergy={occurred_on:state.date,label:ENERGY[r][c],row_idx:r,col_idx:c,energy_score:energyScore(r),valence_score:valenceScore(c),note:state.selectedEnergy?.note||''};renderToday()}));
  $('#saveEnergy')?.addEventListener('click',async()=>{state.selectedEnergy.note=$('#energyNote').value;try{await api('/api/energy',{method:'POST',body:JSON.stringify(state.selectedEnergy)});toast('Energy check-in saved')}catch(e){toast('Preview mode: not saved to database')} renderAll()});
  $$('[data-log]').forEach(b=>b.addEventListener('click',async()=>{try{await api('/api/session',{method:'POST',body:JSON.stringify({occurred_on:state.date,activity_key:b.dataset.log,minutes:Number(b.dataset.min)})});toast('Session logged');await load()}catch(e){toast('Preview mode: database not connected')}}));
}
function renderWeek(){const items=state.data.week||[];const avg=items.length?Math.round(items.reduce((a,x)=>a+Math.min(1,x.progress||0),0)/items.length*100):0;$('#weekView').innerHTML=`<div class="metric-grid"><div class="metric"><span class="small muted">Overall target progress</span><strong>${avg}%</strong></div><div class="metric"><span class="small muted">Rule</span><strong style="font-size:16px">Minimum still counts</strong></div></div><div class="card" style="margin-top:14px"><div class="section-head"><div><h2>This week</h2><p>Progress, not streaks.</p></div></div>${items.map(x=>`<div class="progress-row"><div class="progress-top"><strong>${esc(x.name)}</strong><span>${fmtMin(x.actual_minutes)} / ${fmtMin(x.target_minutes)}</span></div><div class="bar"><span style="width:${Math.round((x.progress||0)*100)}%"></span></div><div class="small muted">Good-enough minimum: ${fmtMin(x.minimum_minutes)}</div></div>`).join('')}</div>`}
function renderPlan(){const lessons=state.data.lessons||[];const done=lessons.filter(x=>x.completed_at).length;const six=(state.data.roadmap||[]).filter(x=>x.horizon==='six_month');const compass=(state.data.roadmap||[]).filter(x=>x.horizon==='compass');$('#planView').innerHTML=`<div class="card"><div class="section-head"><div><h2>Next six months</h2><p>This is the committed horizon. Everything remains editable.</p></div><span class="badge">Aug 2026 → Feb 2027</span></div>${six.map(x=>`<div class="roadmap-item"><h4>${esc(x.title)}</h4><p>${esc(x.detail||'')}</p></div>`).join('')}</div>
<div class="card"><div class="section-head"><div><h2>Momente B1</h2><p>${done}/24 lessons complete · target: 31 Dec 2026</p></div><span class="badge">${Math.round(done/24*100)}%</span></div><div class="lesson-grid">${lessons.map(x=>`<button class="lesson ${x.completed_at?'done':''}" data-lesson="${x.lesson}">${x.lesson}</button>`).join('')}</div><p class="small muted">Tap a lesson to mark/unmark it complete. ±1 lesson around a monthly milestone is still on track.</p></div>
<div class="card"><div class="section-head"><div><h2>Compass</h2><p>Long-term direction, not a contract.</p></div></div>${compass.map(x=>`<div class="roadmap-item"><h4>${esc(x.title)}</h4><p>${esc(x.detail||'')}</p></div>`).join('')}</div>`;
$$('[data-lesson]').forEach(b=>b.addEventListener('click',async()=>{const l=lessons.find(x=>x.lesson===Number(b.dataset.lesson));try{await api('/api/momente',{method:'PUT',body:JSON.stringify({lesson:l.lesson,completed:!l.completed_at})});await load();toast(l.completed_at?'Lesson reopened':'Lesson completed')}catch(e){toast('Preview mode: database not connected')}}));}
async function renderHistory(){let h={energy:[],sessions:[]};try{h=await api(`/api/history?from=2026-08-10&to=${state.date}`)}catch{};$('#historyView').innerHTML=`<div class="card"><div class="section-head"><div><h2>Energy history</h2><p>Your daily selections stay in the record.</p></div></div>${h.energy.length?h.energy.slice(0,30).map(x=>`<div class="history-item"><span class="small muted">${x.occurred_on}</span><strong>${esc(x.label)}</strong><span class="small">E ${x.energy_score>0?'+':''}${x.energy_score} · V ${x.valence_score>0?'+':''}${x.valence_score}</span></div>`).join(''):'<div class="empty">No saved check-ins yet.</div>'}</div><div class="card"><div class="section-head"><div><h2>Recent activity</h2></div></div>${h.sessions.length?h.sessions.slice(0,50).map(x=>`<div class="history-item"><span class="small muted">${x.occurred_on}</span><div><strong>${esc(x.activity_name)}</strong><div class="small muted">${esc(x.subtype||'')}</div></div><span>${fmtMin(x.minutes)}</span></div>`).join(''):'<div class="empty">No sessions logged yet.</div>'}</div>`}
function renderSettings(){const targets=state.data.targets?.length?state.data.targets:state.data.week;$('#settingsView').innerHTML=`<div class="card"><div class="section-head"><div><h2>Weekly targets</h2><p>Edit the plan without altering historical records.</p></div></div><div id="targetRows">${targets.map(x=>`<div class="form-row"><strong>${esc(x.name)}</strong><input type="number" min="0" step="5" value="${x.target_minutes}" data-target="${x.key}" aria-label="${esc(x.name)} target minutes"><input type="number" min="0" step="5" value="${x.minimum_minutes}" data-minimum="${x.key}" aria-label="${esc(x.name)} minimum minutes"></div>`).join('')}</div><div class="small muted">Columns: target minutes / good-enough minimum minutes.</div><div class="actions"><button id="saveTargets" class="btn primary">Save targets</button></div></div>
<div class="card"><div class="section-head"><div><h2>Data ownership</h2><p>Export all records as JSON at any time.</p></div></div><div class="actions"><a class="btn soft" href="/api/export" target="_blank" rel="noopener">Export everything</a></div></div>`;
$('#saveTargets').addEventListener('click',async()=>{const items=targets.map(x=>({key:x.key,target_minutes:Number($(`[data-target="${x.key}"]`).value),minimum_minutes:Number($(`[data-minimum="${x.key}"]`).value)}));try{await api('/api/targets',{method:'PUT',body:JSON.stringify({items})});toast('Targets updated');await load()}catch(e){toast('Preview mode: database not connected')}})}
function renderAll(){renderToday();renderWeek();renderPlan();if(state.view==='history')renderHistory();renderSettings()}
function showView(name){state.view=name;$$('.view').forEach(v=>v.classList.remove('active'));$(`#${name}View`).classList.add('active');$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('#pageTitle').textContent={today:'Today',week:'Week',plan:'Plan',history:'History',settings:'Settings'}[name];if(name==='history')renderHistory()}
$$('.nav-btn').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));$('#refreshBtn').addEventListener('click',load);load();
