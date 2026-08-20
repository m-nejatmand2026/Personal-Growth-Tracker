import test, { after, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestHarness } from 'wrangler';

const WORKER_NAME='personal-growth-tracker-auth-test-resources';
const server=createTestHarness({workers:[{configPath:'./wrangler.auth-test.jsonc',name:WORKER_NAME}]});
function worker(){return server.getWorker(WORKER_NAME)}
function cookieFrom(response){const values=typeof response.headers.getSetCookie==='function'?response.headers.getSetCookie():[response.headers.get('set-cookie')].filter(Boolean);return values.map(value=>String(value).split(';')[0].trim()).filter(Boolean).join('; ')}
async function request(path,init={}){const headers=new Headers(init.headers||{});if(init.body!=null&&!headers.has('content-type'))headers.set('content-type','application/json');const response=await server.fetch(path,{...init,headers});const text=await response.text();let body=null;if(text){try{body=JSON.parse(text)}catch{body=text}}return{response,body,cookie:cookieFrom(response)}}
async function signUp(email,name){return request('/api/auth/sign-up/email',{method:'POST',headers:{origin:'http://localhost'},body:JSON.stringify({email,name,password:'correct-horse-battery-staple-42'})})}

before(async()=>server.listen());
beforeEach(async()=>worker().applyD1Migrations('DB'));
afterEach(async()=>server.reset());
after(async()=>server.close());

test('tester cannot list, update, or delete owner records across private V1 resource families',async()=>{
  const owner=await signUp('owner@example.test','Owner');assert.ok(owner.cookie);
  await request('/api/account/invites',{method:'POST',headers:{cookie:owner.cookie},body:JSON.stringify({email:'resource-tester@example.test'})});
  const tester=await signUp('resource-tester@example.test','Resource Tester');assert.ok(tester.cookie);

  const env=await worker().getEnv();
  const ownerArea=await env.DB.prepare("INSERT INTO areas(profile_id,name,sort_order) VALUES('default','Owner resource area',700)").run();
  const ownerAreaId=Number(ownerArea.meta.last_row_id);
  const ownerGoal=await env.DB.prepare("INSERT INTO goals(profile_id,area_id,name,measurement_type,target_period,priority,status,sort_order) VALUES('default',?,'Owner resource goal','time','weekly','medium','active',700)").bind(ownerAreaId).run();
  const ownerGoalId=Number(ownerGoal.meta.last_row_id);
  const ownerActivity=await env.DB.prepare("INSERT INTO goal_activities(profile_id,goal_id,key,name,sort_order,active) VALUES('default',?,'owner-resource-activity','Owner resource activity',700,1)").bind(ownerGoalId).run();
  const ownerActivityId=Number(ownerActivity.meta.last_row_id);
  const ownerJournal=await env.DB.prepare("INSERT INTO journal_entries(profile_id,occurred_on,title,body,entry_type) VALUES('default','2026-08-20','Owner private journal','owner-only text','free')").run();
  const ownerJournalId=Number(ownerJournal.meta.last_row_id);
  const ownerProgress=await env.DB.prepare("INSERT INTO progress_records(profile_id,goal_id,activity_id,occurred_on,minutes,source) VALUES('default',?,?,'2026-08-20',25,'manual')").bind(ownerGoalId,ownerActivityId).run();
  const ownerProgressId=Number(ownerProgress.meta.last_row_id);
  const ownerCapacity=await env.DB.prepare("INSERT INTO capacity_commitments(profile_id,kind,name,minutes,weekday_mask,protected,active,sort_order,series_id) VALUES('default','life','Owner private commitment',30,127,1,1,700,'owner-private-series')").run();
  const ownerCapacityId=Number(ownerCapacity.meta.last_row_id);
  const ownerPlan=await env.DB.prepare("INSERT INTO daily_plan_items(profile_id,planned_for,title,status,source,sort_order) VALUES('default','2026-08-20','Owner private plan','planned','manual',700)").run();
  const ownerPlanId=Number(ownerPlan.meta.last_row_id);
  await env.DB.prepare("INSERT INTO energy_logs_v1(profile_id,occurred_on,label,row_idx,col_idx,energy_score,valence_score) VALUES('default','2026-08-20','Owner energy',3,3,1,1)").run();

  const headers={cookie:tester.cookie};
  const goals=await request('/api/v1/goals?include_archived=1',{headers});assert.equal(goals.response.status,200);assert.equal(goals.body.items.some(item=>Number(item.id)===ownerGoalId),false);
  const activities=await request('/api/v1/activities?include_archived=1',{headers});assert.equal(activities.response.status,200);assert.equal(activities.body.items.some(item=>Number(item.id)===ownerActivityId),false);
  const journal=await request('/api/v1/journal?limit=100',{headers});assert.equal(journal.response.status,200);assert.equal(journal.body.items.some(item=>Number(item.id)===ownerJournalId),false);
  const progress=await request('/api/v1/progress?from=2026-08-01&to=2026-08-31&limit=100',{headers});assert.equal(progress.response.status,200);assert.equal(progress.body.items.some(item=>Number(item.id)===ownerProgressId),false);
  const commitments=await request('/api/v1/capacity/commitments?include_inactive=1',{headers});assert.equal(commitments.response.status,200);assert.equal(commitments.body.items.some(item=>Number(item.id)===ownerCapacityId),false);
  const daily=await request('/api/v1/daily-plan?date=2026-08-20',{headers});assert.equal(daily.response.status,200);assert.equal(daily.body.items.some(item=>Number(item.id)===ownerPlanId),false);
  const energy=await request('/api/v1/wellbeing/energy?from=2026-08-01&to=2026-08-31&limit=100',{headers});assert.equal(energy.response.status,200);assert.equal(energy.body.items.some(item=>item.label==='Owner energy'),false);

  const goalUpdate=await request(`/api/v1/goals/${ownerGoalId}`,{method:'PUT',headers,body:JSON.stringify({name:'stolen goal'})});assert.equal(goalUpdate.response.status,404);
  const activityUpdate=await request(`/api/v1/activities/${ownerActivityId}`,{method:'PUT',headers,body:JSON.stringify({name:'stolen activity',goal_id:ownerGoalId})});assert.equal(activityUpdate.response.status,404);
  const journalDelete=await request(`/api/v1/journal/${ownerJournalId}`,{method:'DELETE',headers});assert.equal(journalDelete.response.status,404);
  const progressDelete=await request(`/api/v1/progress/${ownerProgressId}`,{method:'DELETE',headers});assert.equal(progressDelete.response.status,404);
  const capacityUpdate=await request(`/api/v1/capacity/commitments/${ownerCapacityId}`,{method:'PUT',headers,body:JSON.stringify({name:'stolen commitment'})});assert.equal(capacityUpdate.response.status,404);
  const planUpdate=await request(`/api/v1/daily-plan/${ownerPlanId}`,{method:'PUT',headers,body:JSON.stringify({status:'completed'})});assert.equal(planUpdate.response.status,404);

  const ownerRows=await env.DB.prepare("SELECT (SELECT name FROM goals WHERE id=?) goal_name,(SELECT name FROM goal_activities WHERE id=?) activity_name,(SELECT title FROM journal_entries WHERE id=?) journal_title,(SELECT name FROM capacity_commitments WHERE id=?) commitment_name").bind(ownerGoalId,ownerActivityId,ownerJournalId,ownerCapacityId).first();
  assert.equal(ownerRows.goal_name,'Owner resource goal');assert.equal(ownerRows.activity_name,'Owner resource activity');assert.equal(ownerRows.journal_title,'Owner private journal');assert.equal(ownerRows.commitment_name,'Owner private commitment');
});
