const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' }
});

const bad = (message, status = 400) => json({ error: message }, status);

function weekStart(dateText) {
  const d = new Date(`${dateText}T12:00:00Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateText, n) {
  const d = new Date(`${dateText}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function monthBounds(dateText) {
  const d = new Date(`${dateText}T12:00:00Z`);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 12));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

async function getTargets(DB) {
  const { results } = await DB.prepare(`
    SELECT a.key, a.name, t.target_minutes, t.minimum_minutes
    FROM weekly_targets t JOIN activities a ON a.key=t.activity_key
    WHERE a.active=1 ORDER BY CASE a.key WHEN 'sport' THEN 1 WHEN 'german' THEN 2 WHEN 'guitar' THEN 3 ELSE 4 END
  `).all();
  return results;
}

async function getWeek(DB, start) {
  const end = addDays(start, 6);
  const targets = await getTargets(DB);
  const { results } = await DB.prepare(`
    SELECT activity_key, COALESCE(SUM(minutes),0) AS actual_minutes
    FROM sessions WHERE occurred_on BETWEEN ? AND ? GROUP BY activity_key
  `).bind(start, end).all();
  const actual = Object.fromEntries(results.map(r => [r.activity_key, Number(r.actual_minutes)]));
  return targets.map(t => ({
    ...t,
    actual_minutes: actual[t.key] || 0,
    progress: t.target_minutes ? Math.min(1, (actual[t.key] || 0) / t.target_minutes) : 0
  }));
}

async function getBootstrap(DB, date) {
  const ws = weekStart(date);
  const [targets, week, energy, sessions, roadmap, lessons] = await Promise.all([
    getTargets(DB),
    getWeek(DB, ws),
    DB.prepare('SELECT * FROM energy_logs WHERE occurred_on=?').bind(date).first(),
    DB.prepare(`SELECT s.*, a.name AS activity_name FROM sessions s JOIN activities a ON a.key=s.activity_key WHERE occurred_on=? ORDER BY s.id DESC`).bind(date).all(),
    DB.prepare(`SELECT * FROM roadmap_items WHERE active=1 ORDER BY horizon, sort_order, id`).all(),
    DB.prepare(`SELECT * FROM momente_lessons ORDER BY lesson`).all()
  ]);
  return { date, week_start: ws, targets, week, energy, sessions: sessions.results, roadmap: roadmap.results, lessons: lessons.results };
}

async function getMonth(DB, date) {
  const { start, end } = monthBounds(date);
  const [targets, totals, byDay, energy] = await Promise.all([
    getTargets(DB),
    DB.prepare(`SELECT activity_key, SUM(minutes) AS actual_minutes FROM sessions WHERE occurred_on BETWEEN ? AND ? GROUP BY activity_key`).bind(start,end).all(),
    DB.prepare(`SELECT occurred_on, activity_key, SUM(minutes) AS minutes FROM sessions WHERE occurred_on BETWEEN ? AND ? GROUP BY occurred_on, activity_key ORDER BY occurred_on`).bind(start,end).all(),
    DB.prepare(`SELECT occurred_on,label,energy_score,valence_score FROM energy_logs WHERE occurred_on BETWEEN ? AND ? ORDER BY occurred_on`).bind(start,end).all()
  ]);
  const days = Number(end.slice(-2));
  const weeksEquivalent = days / 7;
  const actual = Object.fromEntries(totals.results.map(r => [r.activity_key, Number(r.actual_minutes)]));
  return {
    start, end,
    items: targets.map(t => ({...t, actual_minutes: actual[t.key] || 0, month_target_minutes: Math.round(Number(t.target_minutes) * weeksEquivalent)})),
    by_day: byDay.results,
    energy: energy.results
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (!path.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });

    try {
      if (request.method === 'GET' && path === '/api/bootstrap') {
        const date = url.searchParams.get('date') || new Date().toISOString().slice(0,10);
        return json(await getBootstrap(env.DB, date));
      }

      if (request.method === 'GET' && path === '/api/week') {
        const start = url.searchParams.get('start');
        if (!start) return bad('start is required');
        return json({ start, end: addDays(start,6), items: await getWeek(env.DB,start) });
      }

      if (request.method === 'GET' && path === '/api/month') {
        const date = url.searchParams.get('date') || new Date().toISOString().slice(0,10);
        return json(await getMonth(env.DB, date));
      }

      if (request.method === 'GET' && path === '/api/history') {
        const from = url.searchParams.get('from') || '2026-08-10';
        const to = url.searchParams.get('to') || new Date().toISOString().slice(0,10);
        const [energy, sessions] = await Promise.all([
          env.DB.prepare('SELECT * FROM energy_logs WHERE occurred_on BETWEEN ? AND ? ORDER BY occurred_on DESC').bind(from,to).all(),
          env.DB.prepare(`SELECT s.*, a.name AS activity_name FROM sessions s JOIN activities a ON a.key=s.activity_key WHERE occurred_on BETWEEN ? AND ? ORDER BY occurred_on DESC, id DESC LIMIT 500`).bind(from,to).all()
        ]);
        return json({ energy: energy.results, sessions: sessions.results });
      }

      if (request.method === 'POST' && path === '/api/energy') {
        const b = await request.json();
        if (!b.occurred_on || !b.label) return bad('occurred_on and label are required');
        await env.DB.prepare(`
          INSERT INTO energy_logs(occurred_on,label,row_idx,col_idx,energy_score,valence_score,note,updated_at)
          VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
          ON CONFLICT(occurred_on) DO UPDATE SET label=excluded.label,row_idx=excluded.row_idx,col_idx=excluded.col_idx,
            energy_score=excluded.energy_score,valence_score=excluded.valence_score,note=excluded.note,updated_at=CURRENT_TIMESTAMP
        `).bind(b.occurred_on,b.label,b.row_idx,b.col_idx,b.energy_score,b.valence_score,b.note || null).run();
        return json({ ok: true });
      }

      if (request.method === 'POST' && path === '/api/session') {
        const b = await request.json();
        const minutes = Number(b.minutes);
        if (!b.occurred_on || !b.activity_key || !Number.isFinite(minutes) || minutes <= 0) return bad('invalid session');
        const result = await env.DB.prepare(`INSERT INTO sessions(occurred_on,activity_key,minutes,subtype,note) VALUES(?,?,?,?,?)`)
          .bind(b.occurred_on,b.activity_key,Math.round(minutes),b.subtype || null,b.note || null).run();
        return json({ ok: true, id: result.meta.last_row_id });
      }

      if (request.method === 'PUT' && path === '/api/session') {
        const b = await request.json();
        const id = Number(b.id);
        const minutes = Number(b.minutes);
        if (!id || !b.occurred_on || !b.activity_key || !Number.isFinite(minutes) || minutes <= 0) return bad('invalid session');
        await env.DB.prepare(`UPDATE sessions SET occurred_on=?,activity_key=?,minutes=?,subtype=?,note=? WHERE id=?`)
          .bind(b.occurred_on,b.activity_key,Math.round(minutes),b.subtype || null,b.note || null,id).run();
        return json({ ok:true });
      }

      if (request.method === 'DELETE' && path === '/api/session') {
        const id = Number(url.searchParams.get('id'));
        if (!id) return bad('id is required');
        await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(id).run();
        return json({ ok: true });
      }

      if (request.method === 'PUT' && path === '/api/targets') {
        const b = await request.json();
        if (!Array.isArray(b.items)) return bad('items must be an array');
        const statements = b.items.map(i => env.DB.prepare(`UPDATE weekly_targets SET target_minutes=?,minimum_minutes=?,updated_at=CURRENT_TIMESTAMP WHERE activity_key=?`)
          .bind(Math.round(Number(i.target_minutes)),Math.round(Number(i.minimum_minutes)),i.key));
        if (statements.length) await env.DB.batch(statements);
        return json({ ok: true, targets: await getTargets(env.DB) });
      }

      if (request.method === 'PUT' && path === '/api/momente') {
        const b = await request.json();
        const lesson = Number(b.lesson);
        if (!(lesson >= 1 && lesson <= 24)) return bad('lesson must be 1..24');
        await env.DB.prepare('UPDATE momente_lessons SET completed_at=? WHERE lesson=?').bind(b.completed ? (b.completed_at || new Date().toISOString()) : null, lesson).run();
        return json({ ok: true });
      }

      if (request.method === 'POST' && path === '/api/roadmap') {
        const b = await request.json();
        if (!['six_month','compass'].includes(b.horizon) || !b.title) return bad('invalid roadmap item');
        const r = await env.DB.prepare('INSERT INTO roadmap_items(horizon,title,detail,sort_order) VALUES(?,?,?,?)')
          .bind(b.horizon,b.title,b.detail || '',Number(b.sort_order)||100).run();
        return json({ ok:true,id:r.meta.last_row_id });
      }

      if (request.method === 'PUT' && path.startsWith('/api/roadmap/')) {
        const id = Number(path.split('/').pop());
        const b = await request.json();
        if (!id || !b.title) return bad('invalid roadmap item');
        await env.DB.prepare('UPDATE roadmap_items SET title=?,detail=?,active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
          .bind(b.title,b.detail || '',b.active === false ? 0 : 1,id).run();
        return json({ok:true});
      }

      if (request.method === 'GET' && path === '/api/export') {
        const [activities, targets, sessions, energy, lessons, roadmap, settings] = await Promise.all([
          env.DB.prepare('SELECT * FROM activities').all(), env.DB.prepare('SELECT * FROM weekly_targets').all(),
          env.DB.prepare('SELECT * FROM sessions ORDER BY occurred_on,id').all(), env.DB.prepare('SELECT * FROM energy_logs ORDER BY occurred_on').all(),
          env.DB.prepare('SELECT * FROM momente_lessons ORDER BY lesson').all(), env.DB.prepare('SELECT * FROM roadmap_items ORDER BY horizon,sort_order,id').all(),
          env.DB.prepare('SELECT * FROM settings').all()
        ]);
        return json({ exported_at:new Date().toISOString(), activities:activities.results, targets:targets.results, sessions:sessions.results,
          energy:energy.results, momente_lessons:lessons.results, roadmap:roadmap.results, settings:settings.results });
      }

      return bad('API route not found', 404);
    } catch (err) {
      return json({ error: err?.message || 'Unexpected error' }, 500);
    }
  }
};
