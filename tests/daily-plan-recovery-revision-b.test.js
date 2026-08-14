import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const dailyPlan = await readFile(new URL('../public/js/modules/daily-plan/module.js', import.meta.url), 'utf8');
const dailyPlanCss = await readFile(new URL('../public/css/daily-plan.css', import.meta.url), 'utf8');

test('Daily Plan exposes an explicit changed-plan recovery action without automatic rollover language', () => {
  assert.match(dailyPlan, /Plans changed\?/);
  assert.match(dailyPlan, /Nothing moves automatically and nothing becomes debt\. Choose what fits now\./);
  assert.match(dailyPlan, /It will never roll into the next day automatically/);
  assert.doesNotMatch(dailyPlan, /overdue|auto(?:matic)?[- ]?roll|carry[- ]?forward/i);
});

test('recovery sheet offers exactly Keep Move Reduce Complete Drop choices', () => {
  const start = dailyPlan.indexOf('function recoveryHtml');
  const end = dailyPlan.indexOf('export const dailyPlanModule', start);
  const recovery = dailyPlan.slice(start, end);
  for (const label of ['Keep', 'Move', 'Reduce', 'Complete', 'Drop']) {
    assert.match(recovery, new RegExp(`<strong>${label}<\\/strong>`));
  }
  assert.equal((recovery.match(/<strong>(Keep|Move|Reduce|Complete|Drop)<\/strong>/g) || []).length, 5);
  assert.match(recovery, /without creating Progress/);
});

test('Keep is a true no-op while Move and Reduce change only Daily Plan intent fields', () => {
  const recoveryStart = dailyPlan.indexOf('const openRecovery');
  const recoveryEnd = dailyPlan.indexOf("$$('[data-plan-add]')", recoveryStart);
  const recovery = dailyPlan.slice(recoveryStart, recoveryEnd);
  assert.match(recovery, /dailyPlanKeep'\)\?\.addEventListener\('click', close\)/);
  assert.match(recovery, /this\.update\(item\.id, \{ planned_for: plannedFor \}\)/);
  assert.match(recovery, /this\.update\(item\.id, \{ planned_minutes: plannedMinutes \}\)/);
  assert.match(recovery, /plannedMinutes >= currentMinutes/);
  const keepHandler = recovery.slice(recovery.indexOf("$('#dailyPlanKeep')"), recovery.indexOf("$('#dailyPlanMove')"));
  assert.doesNotMatch(keepHandler, /this\.update|setStatus|reload/);
});

test('Complete reuses the same explicit factual completion path as the checkmark', () => {
  assert.match(dailyPlan, /const completeItem = async \(item\)/);
  assert.match(dailyPlan, /events\?\.publish\('daily-plan\.completion-selected'/);
  assert.match(dailyPlan, /entryMode: 'done'/);
  assert.match(dailyPlan, /dailyPlanId: item\.id/);
  assert.match(dailyPlan, /dailyPlanComplete'\)\?\.addEventListener[\s\S]*await completeItem\(item\)/);
  assert.match(dailyPlan, /data-plan-done[\s\S]*await completeItem\(item\)/);
  assert.doesNotMatch(dailyPlan, /\/api\/v1\/progress/);
});

test('Drop dismisses intent without creating Progress', () => {
  assert.match(dailyPlan, /dailyPlanDrop'\)\?\.addEventListener[\s\S]*this\.setStatus\(item\.id, 'dismissed'\)/);
  assert.match(dailyPlan, /Dropped from active plan/);
  assert.doesNotMatch(dailyPlan, /dailyPlanDrop[\s\S]{0,500}progress/i);
});

test('recovery uses the shared accessible modal controller', () => {
  assert.match(dailyPlan, /host\.innerHTML = recoveryHtml\(item\)/);
  assert.match(dailyPlan, /activateModal\(host, \{/);
  assert.match(dailyPlan, /initialFocus: \(\) => \$\('#dailyPlanKeep'\)/);
  assert.match(dailyPlan, /data-daily-plan-recovery-close/);
});

test('recovery controls are phone-first and touch sized', () => {
  assert.match(dailyPlanCss, /\.daily-plan-recovery-choice\{[^}]*min-height:var\(--gc-target-min\)/s);
  assert.match(dailyPlanCss, /\.recovery-choice-form input\{[^}]*min-height:var\(--gc-target-min\)/s);
  assert.match(dailyPlanCss, /\.recovery-choice-form>button\{[^}]*min-height:var\(--gc-target-min\)/s);
  assert.match(dailyPlanCss, /@media\(min-width:620px\)/);
  assert.match(dailyPlanCss, /@media\(max-width:520px\)/);
});
