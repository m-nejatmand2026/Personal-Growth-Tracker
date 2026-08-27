import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const indexHtml=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const appJs=await readFile(new URL('../public/js/app.js',import.meta.url),'utf8');
const loggerJs=await readFile(new URL('../public/js/modules/logger/ui.js',import.meta.url),'utf8');
const activitiesJs=await readFile(new URL('../public/js/modules/activities/module.js',import.meta.url),'utf8');
const planJs=await readFile(new URL('../public/js/features/plan.js',import.meta.url),'utf8');
const progressJs=await readFile(new URL('../public/js/modules/progress/ui.js',import.meta.url),'utf8');
const progressManifest=await readFile(new URL('../public/js/modules/progress/manifest.js',import.meta.url),'utf8');
const insightsJs=await readFile(new URL('../public/js/modules/insights/ui.js',import.meta.url),'utf8');
const todayJs=await readFile(new URL('../public/js/features/today.js',import.meta.url),'utf8');
const capacityModule=await readFile(new URL('../public/js/modules/capacity/module.js',import.meta.url),'utf8');
const wellbeingModule=await readFile(new URL('../public/js/modules/wellbeing/module.js',import.meta.url),'utf8');
const dailyPlanJs=await readFile(new URL('../public/js/modules/daily-plan/module.js',import.meta.url),'utf8');
const journalJs=await readFile(new URL('../public/js/modules/journal/module.js',import.meta.url),'utf8');
const experienceDoc=await readFile(new URL('../docs/EXPERIENCE_ARCHITECTURE.md',import.meta.url),'utf8');
const planExperience=`${planJs}\n${capacityModule}`;

test('primary navigation keeps five mobile destinations and direct desktop secondary routes',()=>{
  for(const label of ['Today','Plan','Progress','Wellness'])assert.match(indexHtml,new RegExp(`>${label}<|<b>${label}</b>`));
  assert.match(indexHtml,/id="quickAddBtn"/); assert.match(indexHtml,/>Add<\/b>/); assert.match(indexHtml,/aria-label="Add activity"/);
  assert.match(indexHtml,/class="app-rail"/); assert.match(indexHtml,/data-view="insights" class="rail-nav-btn rail-secondary"/); assert.match(indexHtml,/id="journalRailBtn"/); assert.match(indexHtml,/id="settingsRailBtn"/); assert.match(indexHtml,/data-open-logger/);
});

test('Logger supports Plan Start now Done and only Done writes factual Progress',()=>{assert.match(loggerJs,/id="loggerDuration"[^>]*min="1"[^>]*max="1440"/);assert.match(loggerJs,/>Plan</);assert.match(loggerJs,/>Start now</);assert.match(loggerJs,/>Done</);assert.match(loggerJs,/Plan adds an intention/);assert.match(loggerJs,/Progress waits until Done/);assert.match(loggerJs,/Done records factual Progress/);assert.match(loggerJs,/\/api\/v1\/progress/);assert.doesNotMatch(loggerJs,/\/api\/session/)});

test('Logger Activity UX stays generic behind the Activities public capability',()=>{assert.match(appJs,/moduleRegistry\.get\('activities'\)/);assert.match(appJs,/create\(\{\s*onSaved:\s*load,\s*activities\s*\}\)/);assert.match(loggerJs,/activityCapability\?\.list/);assert.match(loggerJs,/activityCapability\.create/);assert.doesNotMatch(loggerJs,/\/api\/v1\/activities|\/api\/v1\/goals/);assert.match(activitiesJs,/\/api\/v1\/activities/);assert.match(activitiesJs,/creationContext/);assert.match(loggerJs,/Focus \/ variation/i)});

test('Today is composition-only and business widgets stay module-owned',()=>{assert.match(todayJs,/frontendModules/);assert.match(todayJs,/createFrontendModuleRegistry/);assert.match(todayJs,/dailyPlanPanel/);assert.match(todayJs,/journalPreview/);assert.doesNotMatch(todayJs,/\/api\/v1\/capacity|\/api\/energy|config\/energy|\bENERGY\b/);assert.match(capacityModule,/\/api\/v1\/capacity\?date=/);assert.match(progressManifest,/todayDirection/);assert.match(progressManifest,/todayRecent/);assert.match(wellbeingModule,/\/api\/v1\/wellbeing\/energy/);assert.match(dailyPlanJs,/gc-now-card/);assert.match(journalJs,/journal-preview/)});

test('Progress foregrounds factual evidence with optional guidance',()=>{assert.match(progressJs,/<h2 id="progressCurrentTitle">Progress<\/h2>/);assert.match(progressJs,/>Recent activity/);assert.match(progressJs,/<h3 id="progressWeekTitle">This week<\/h3>/);assert.match(progressJs,/>By goal</);for(const label of ['Actual','Minimum','Target'])assert.match(progressJs,new RegExp(label));assert.match(progressJs,/Plans never appear here until you explicitly record them as done/);assert.match(progressJs,/data-delete-progress/);assert.doesNotMatch(progressJs,/data-delete-session/)});

test('Insights keeps evidence thresholds and refuses invented associations',()=>{for(const threshold of ['0–6','7–20','21–41','42+'])assert.match(insightsJs,new RegExp(threshold.replace('+','\\+')));assert.match(insightsJs,/No defensible matched pattern yet/);assert.match(insightsJs,/does not prove cause/);assert.match(insightsJs,/\/api\/v1\/progress/);assert.match(insightsJs,/\/api\/v1\/wellbeing\/energy/);assert.doesNotMatch(insightsJs,/\/api\/history/);assert.doesNotMatch(insightsJs,/journal/i);assert.doesNotMatch(insightsJs,/causes higher|causes lower|because of sleep/i)});

test('Plan begins with weekly time fit and keeps module-owned composition',()=>{assert.match(planJs,/<h2 id="planCurrentTitle">Plan<\/h2>/);assert.match(planJs,/Choose what deserves attention, then fit it to the time you actually have/);assert.match(planExperience,/Available this week/);assert.match(planExperience,/Planned this week/);assert.match(planExperience,/Still flexible/);assert.match(planJs,/module\.planSummary/);assert.doesNotMatch(planJs,/\/api\/v1\//)});

test('experience documentation records Daily Plan Journal and recursive modularity',()=>{assert.match(experienceDoc,/Daily Plan/);assert.match(experienceDoc,/Journal/);assert.match(experienceDoc,/Universal Logger/);assert.match(experienceDoc,/car-parts rule/);assert.match(experienceDoc,/Growth Compass — Version 1 Beta/)});
