import { api } from '../core/api.js';
import { $, $$, escapeHtml } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast } from '../core/toast.js';

export function renderPlan({ reload }) {
  const lessons = state.data.lessons || [];
  const completed = lessons.filter((lesson) => lesson.completed_at).length;
  const sixMonth = (state.data.roadmap || []).filter((item) => item.horizon === 'six_month');
  const compass = (state.data.roadmap || []).filter((item) => item.horizon === 'compass');

  $('#planView').innerHTML = `<div class="card"><div class="section-head"><div><h2>Next six months</h2><p>This is the committed horizon. Everything remains editable.</p></div><span class="badge">Aug 2026 → Feb 2027</span></div>${sixMonth.map((item)=>`<div class="roadmap-item"><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.detail||'')}</p></div>`).join('')}</div>
  <div class="card"><div class="section-head"><div><h2>Momente B1</h2><p>${completed}/24 lessons complete · target: 31 Dec 2026</p></div><span class="badge">${Math.round(completed/24*100)}%</span></div><div class="lesson-grid">${lessons.map((lesson)=>`<button class="lesson ${lesson.completed_at?'done':''}" data-lesson="${lesson.lesson}">${lesson.lesson}</button>`).join('')}</div><p class="small muted">Tap a lesson to mark/unmark it complete. ±1 lesson around a monthly milestone is still on track.</p></div>
  <div class="card"><div class="section-head"><div><h2>Compass</h2><p>Long-term direction, not a contract.</p></div></div>${compass.map((item)=>`<div class="roadmap-item"><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.detail||'')}</p></div>`).join('')}</div>`;

  $$('[data-lesson]').forEach((button) => button.addEventListener('click', async () => {
    const lesson = lessons.find((item) => item.lesson === Number(button.dataset.lesson));
    try {
      await api('/api/momente', {
        method: 'PUT',
        body: JSON.stringify({ lesson: lesson.lesson, completed: !lesson.completed_at })
      });
      await reload();
      toast(lesson.completed_at ? 'Lesson reopened' : 'Lesson completed');
    } catch {
      toast('Preview mode: database not connected');
    }
  }));
}
