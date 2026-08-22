import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

const planCompatibility = await readFile(new URL('../public/js/features/plan/legacy.js', import.meta.url), 'utf8');
const momenteRoute = await readFile(new URL('../worker/routes/momente.js', import.meta.url), 'utf8');
const roadmapRoute = await readFile(new URL('../worker/routes/roadmap.js', import.meta.url), 'utf8');
const bootstrap = await readFile(new URL('../worker/compatibility/legacy-beta/bootstrap.js', import.meta.url), 'utf8');

test('Plan compatibility surface contains no founder-specific roadmap or course model', () => {
  assert.match(planCompatibility, /Areas and Goals are the source of truth/);
  assert.doesNotMatch(planCompatibility, /Momente|B1|24 lessons|Aug 2026|Feb 2027|six_month|data-lesson/i);
  assert.doesNotMatch(planCompatibility, /api\(|fetch\(|\/api\//);
});

test('Founder-specific mutation endpoints are explicitly retired', () => {
  for (const source of [momenteRoute, roadmapRoute]) {
    assert.match(source, /410/);
    assert.doesNotMatch(source, /DB\.prepare|INSERT\s+INTO|UPDATE\s+(?:momente_lessons|roadmap_items)/i);
  }
});

test('Founder seed stays out of bootstrap runtime payload construction', async () => {
  assert.doesNotMatch(bootstrap, /momente_lessons|roadmap_items|weekly_targets|getTargets/);
  assert.match(bootstrap, /targets:\s*\[\]/);
  assert.match(bootstrap, /roadmap:\s*\[\]/);
  assert.match(bootstrap, /lessons:\s*\[\]/);
  assert.equal(await exists(new URL('../worker/data/bootstrap.js', import.meta.url)), false);
});

test('Unused legacy Week and History frontend screens are removed', async () => {
  assert.equal(await exists(new URL('../public/js/features/week.js', import.meta.url)), false);
  assert.equal(await exists(new URL('../public/js/features/history.js', import.meta.url)), false);
});
