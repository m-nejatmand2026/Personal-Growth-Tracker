import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const BASE_URL=process.env.GC_E2E_BASE_URL||'http://127.0.0.1:8787/experience/2/';
const SCREENSHOT_DIR=process.env.GC_E2E_SCREENSHOT_DIR||'';
const BROWSERS=[['Chromium',chromium],['WebKit',webkit]];

async function capture(page,browserName,viewport,state){if(!SCREENSHOT_DIR||browserName!=='Chromium')return;await mkdir(SCREENSHOT_DIR,{recursive:true});await page.waitForTimeout(180);await page.screenshot({path:`${SCREENSHOT_DIR}/e2-first-run-chromium-${viewport}-${state}.png`,fullPage:false});}
async function assertNoOverflow(page,label){const size=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth}));assert.ok(size.document<=size.viewport+1,`${label}: first-run Today must not overflow horizontally; ${JSON.stringify(size)}`);}

async function mockNewAccount(page){
  const goals=[];
  const areas=[];
  await page.route('**/api/v1/areas*',async route=>{
    const request=route.request();
    if(request.method()==='POST'){
      const body=request.postDataJSON();
      const area={id:500+areas.length+1,name:body.name,status:'active',template_key:body.template_key??null,sort_order:body.sort_order??100};
      areas.push(area);
      await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({item:area})});
      return;
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:areas})});
  });
  await page.route('**/api/v1/goals*',async route=>{
    const request=route.request();
    if(request.method()==='POST'){
      const body=request.postDataJSON();
      const area=areas.find(candidate=>Number(candidate.id)===Number(body.area_id));
      const goal={id:901,name:body.name,status:'active',area_id:body.area_id??null,area_name:area?.name??null,measurement_type:body.measurement_type,target_period:body.target_period,target_value:body.target_value??null,minimum_value:body.minimum_value??null,unit:body.unit??null,why_text:body.why_text??null};
      goals.splice(0,goals.length,goal);
      await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({item:goal})});
      return;
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:goals})});
  });
  await page.route('**/api/v1/daily-plan*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[]})}));
  await page.route('**/api/v1/today*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({progress:[],direction:goals.length?[{name:goals[0].name,target_minutes:0,actual_minutes:0}]:[]})}));
  return {goals,areas};
}

async function exercise(page,browserName,viewport){
  if(viewport==='375px')await page.addInitScript(()=>{localStorage.setItem('growth-compass:preview2:e2:palette','ivory');localStorage.setItem('growth-compass:preview2:e2:theme','light');localStorage.setItem('growth-compass:preview2:e2:palette-appearance-v2','1');});
  const state=await mockNewAccount(page);
  const response=await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:15_000});
  assert.ok(response?.ok(),`${browserName} ${viewport}: Experience 2 must load`);
  assert.equal(await page.locator('html').getAttribute('data-theme'),viewport==='375px'?'light':'dark',`${browserName} ${viewport}: onboarding should respect the selected appearance`);
  const welcome=page.locator('.today-first-run');
  await welcome.waitFor({state:'visible',timeout:15_000});
  await page.getByRole('heading',{name:'Build a compass for the life you want to grow.'}).waitFor({state:'visible'});
  assert.equal(await page.getByRole('button',{name:'Create my compass'}).count(),1);
  assert.match(await welcome.innerText(),/Direction[\s\S]*Plan[\s\S]*Action[\s\S]*Progress/);
  assert.match(await welcome.innerText(),/Start with one area/);
  assert.doesNotMatch(await welcome.innerText(),/Nothing running|No other plans yet|No duration|Nothing recorded yet/);
  await assertNoOverflow(page,`${browserName} ${viewport}`);
  await capture(page,browserName,viewport,'welcome');

  const how=page.getByRole('button',{name:'How Growth Compass works'});
  await how.click();
  assert.equal(await page.locator('#todayHowPanel').isVisible(),true);
  await how.click();

  await page.getByRole('button',{name:'Create my compass'}).click();
  const dialog=page.getByRole('dialog',{name:'Where do you want to grow first?'});
  await dialog.waitFor({state:'visible'});
  if(!(browserName==='WebKit'&&viewport==='375px')){
    await page.waitForFunction(()=>Boolean(document.activeElement?.closest('[role="dialog"]')),{timeout:2_000});
    assert.equal(await page.evaluate(()=>Boolean(document.activeElement?.closest('[role="dialog"]'))),true,`${browserName} ${viewport}: modal focus should remain inside the first-direction dialog`);
  }
  assert.equal(await dialog.getByText('Time spent').count(),0,`${browserName} ${viewport}: first-run setup should defer measurement administration`);
  await dialog.locator('input[name="todayFirstArea"][value="career"]').check({force:true});
  await page.locator('#todayFirstGoalName').fill('Build a meaningful first direction');
  await page.locator('#todayFirstGoalWhy').fill('It gives the rest of the system a reason to exist.');
  await assertNoOverflow(page,`${browserName} ${viewport} goal dialog`);
  await capture(page,browserName,viewport,'goal-dialog');
  await dialog.getByRole('button',{name:'Set my direction'}).click();

  await page.getByRole('heading',{name:'Your compass has started.'}).waitFor({state:'visible',timeout:15_000});
  const continuation=page.locator('.today-first-run');
  assert.match(await continuation.innerText(),/career/i);
  assert.match(await continuation.innerText(),/Build a meaningful first direction/);
  assert.match(await continuation.innerText(),/2 of 4/i);
  assert.equal(state.areas.length,1,`${browserName} ${viewport}: starter life area should be created once`);
  assert.equal(state.areas[0].name,'Career');
  assert.equal(state.goals[0].area_id,state.areas[0].id);
  assert.equal(state.goals[0].measurement_type,'milestone',`${browserName} ${viewport}: first-run should use a neutral milestone measurement until the user refines it`);
  assert.equal(state.goals[0].target_period,'none');
  await assertNoOverflow(page,`${browserName} ${viewport} continuation`);
  await capture(page,browserName,viewport,'plan-continuation');

  await page.getByRole('button',{name:'Plan my first step'}).click();
  await page.locator('.plan-view').waitFor({state:'visible',timeout:15_000});
}

for(const [browserName,browserType] of BROWSERS){
  test(`${browserName} desktop accepts the Experience 2 Today first-run journey`,async()=>{const browser=await browserType.launch();try{const context=await browser.newContext({viewport:{width:1280,height:900}});await exercise(await context.newPage(),browserName,'desktop');await context.close();}finally{await browser.close();}});
  test(`${browserName} 375px accepts the Experience 2 Today first-run journey`,async()=>{const browser=await browserType.launch();try{const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});await exercise(await context.newPage(),browserName,'375px');await context.close();}finally{await browser.close();}});
}
