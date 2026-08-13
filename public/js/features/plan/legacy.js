import { api } from '../../core/api.js';
import { $$, escapeHtml } from '../../core/dom.js';
import { toast } from '../../core/toast.js';

export function legacyPlanHtml(data) {
  const lessons = data.lessons || [];
  const completed = lessons.filter((lesson) => lesson.completed_at).length;
  const sixMonth = (data.roadmap || []).filter((item) => item.horizon === 'six_month');
  const compass = (data.roadmap || []).filter((item) => item.horizon === 'compass');

  return `<details class="legacy-plan"><summary>Legacy beta plan during migration</summary>
    <div class="card nested-card"><div class="section-head"><div><h2>Next six months</h2><p>Kept intact while Version 1 moves to generic goals.</p></div><span class="badge">Aug 2026 → Feb 2027</span></div>${sixMonth.map((item)=>`<div class="roadmap-item"><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.detail||'')}</p></div>`).join('')}</div>
    <div class="card nested-card"><div class="section-head"><div><h2>Momente B1</h2><p>${completed}/24 lessons complete · target: 31 Dec 2026</p></div><span class="badge">${Math.round(completed/24*100)}%</span></div><div class="lesson-grid">${lessons.map((lesson)=>`<button class="lesson ${lesson.completed_at?'done':''}" data-lesson="${lesson.lesson}">${lesson.lesson}</button>`).join('')}</div><p class="small muted">Tap a lesson to mark/unmark it complete.</p></div>
    <div class="card nested-card"><div class="section-head"><div><h2>Compass</h2><p>Long-term direction, not a contract.</p></div></div>${compass.map((item)=>`<div class="roadmap-item"><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.detail||'')}</p></div>`).join('')}</div>
  </details>`;
}

export function bindLegacyPlan(data, { reload }) {
  const lessons = data.lessons || [];
  $$('[data-lesson]').forEach((button) => button.addEventListener('click', async () => {
    const lesson = lessons.find((item) => item.lesson === Number(button.dataset.lesson));
    if (!lesson) return;
    try {
      await api('/api/momente', {
        method: 'PUT',
        body: JSON.stringify({ lesson: lesson.lesson, completed: !lesson.completed_at })
      });
      await reload();
      toast(lesson.completed_at ? 'Lesson reopened' : 'Lesson completed');
    } catch {
      toast('Could not update lesson');
    }
  }));
}
