import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const BASE_URL=process.env.GC_E2E_BASE_URL||'http://127.0.0.1:8787/experience/2/';
const SCREENSHOT_DIR=process.env.GC_E2E_SCREENSHOT_DIR||'';
const BROWSERS=[['Chromium',chromium],['WebKit',webkit]];
const STARTER_AREA_KEYS=['career','health','learning','finance','relationships','personal','custom'];
async function capture(page,browserName,viewport,state){if(!SCREENSHOT_DIR||browserName!=='Chromium')return;await mkdir(SCREENSHOT_DIR,{recursive:true});await page.waitForTimeout(120);await page.screenshot({path:`${SCREENSHOT_DIR}/e2-direction-chromium-${viewport}-${state}.png`,fullPage:false,animations:'disabled'});}
async function assertNoOverflow(page,label){const size=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth}));assert.ok(size.document<=size.viewport+1,`${label}: Direction must not overflow horizontally; ${JSON.stringify(size)}`);}
async function openDirection(page,viewport){if(viewport==='375px'){const explore=page.locator('#mobileExploreToggle');await explore.waitFor({state:'visible'});await explore.click();assert.equal(await explore.getAttribute('aria-expanded'),'true');const nav=page.locator('#mobileSecondary [data-view="goals"]');await nav.waitFor({state:'visible'});await nav.click();assert.equal(await explore.getAttribute('aria-expanded'),'false');return;}const nav=page.locator('.desktop-rail [data-view="goals"]');await nav.waitFor({state:'visible'});await nav.click();}

async function exercise(page,browserName,viewport){
  const response=await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:15_000});assert.ok(response?.ok());
  await openDirection(page,viewport);
  const direction=page.locator('.direction-view');await direction.waitFor({state:'visible'});
  await page.getByRole('heading',{name:'Where do you want to go?'}).waitFor({state:'visible'});
  assert.equal(await page.locator('#viewTitle').innerText(),'Direction');
  assert.match(await page.title(),/^Direction — Growth Compass$/);
  assert.equal(await page.locator('link[href="/experience/2/css/direction.css"]').count(),1);
  await assertNoOverflow(page,`${browserName} ${viewport} direction page`);await capture(page,browserName,viewport,'page');

  let add=page.locator('[data-goal-new]').first();await add.focus();await add.click();
  let dialog=page.getByRole('dialog',{name:'Where do you want to move?'});await dialog.waitFor({state:'visible'});
  assert.match(await dialog.innerText(),/Three small decisions\. Details can wait\./i);
  const areaInputs=dialog.locator('input[name="directionArea"]');
  assert.ok(await areaInputs.count()>=STARTER_AREA_KEYS.length,`${browserName} ${viewport}: Direction may include existing custom life areas in addition to starter areas`);
  for(const key of STARTER_AREA_KEYS)assert.equal(await dialog.locator(`input[name="directionArea"][value="${key}"]`).count(),1,`${browserName} ${viewport}: starter life area ${key} must remain available`);
  assert.equal(await dialog.locator('input[name="goalMeasure"]').count(),0,`${browserName} ${viewport}: simple Direction creation must not start with tracking administration`);
  assert.equal(await dialog.getByText('Optional target').count(),0);
  const custom=dialog.locator('input[name="directionArea"][value="custom"]');await custom.check({force:true});assert.equal(await dialog.locator('#directionCustomArea').isVisible(),true);await dialog.locator('input[name="directionArea"][value="career"]').check({force:true});assert.equal(await dialog.locator('#directionCustomArea').isVisible(),false);
  await assertNoOverflow(page,`${browserName} ${viewport} create dialog`);await capture(page,browserName,viewport,'create');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await add.evaluate(node=>document.activeElement===node),true,`${browserName} ${viewport}: closing Direction creation must restore focus`);

  const name=`Direction ${browserName} ${viewport} ${Date.now()}`;
  add=page.locator('[data-goal-new]').first();await add.click();dialog=page.getByRole('dialog',{name:'Where do you want to move?'});await dialog.waitFor({state:'visible'});
  await dialog.locator('input[name="directionArea"][value="career"]').check({force:true});
  await dialog.locator('#directionName').fill(name);await dialog.locator('#directionWhy').fill('This makes future choices easier.');
  await dialog.getByRole('button',{name:'Create direction'}).click();
  const success=page.getByRole('dialog',{name:"You know where you're moving."});await success.waitFor({state:'visible',timeout:15_000});
  assert.match(await success.innerText(),/career/i);assert.match(await success.innerText(),new RegExp(name));assert.match(await success.innerText(),/Plan my first step/i);assert.match(await success.innerText(),/Add tracking details/i);assert.match(await success.innerText(),/Done for now/i);
  await assertNoOverflow(page,`${browserName} ${viewport} success dialog`);await capture(page,browserName,viewport,'success');
  await success.getByRole('button',{name:'Add tracking details'}).click();
  const advanced=page.getByRole('dialog',{name:'Keep it useful'});await advanced.waitFor({state:'visible'});
  const tracking=advanced.locator('.goal-tracking-options');assert.equal(await tracking.getAttribute('open'),null,`${browserName} ${viewport}: tracking must stay collapsed until requested`);
  assert.equal(await advanced.locator('input[name="goalMeasure"]').count(),4);
  await capture(page,browserName,viewport,'advanced-collapsed');await tracking.locator('summary').click();assert.equal(await tracking.getAttribute('open'),'');
  await advanced.locator('label.goal-measure:has(input[value="boolean"])').click();assert.equal(await advanced.locator('.goal-target').isVisible(),false,`${browserName} ${viewport}: Completed directions must not force numeric targets`);
  await advanced.locator('label.goal-measure:has(input[value="time"])').click();assert.equal(await advanced.locator('.goal-target').isVisible(),true,`${browserName} ${viewport}: Time tracking may expose optional guidance`);
  await assertNoOverflow(page,`${browserName} ${viewport} advanced dialog`);await page.keyboard.press('Escape');await advanced.waitFor({state:'detached'});

  const card=page.locator('.goal-card',{hasText:name});await card.waitFor({state:'visible'});assert.match(await card.innerText(),/career/i);assert.match(await card.innerText(),/This makes future choices easier\./i);assert.match(await card.innerText(),/Make this direction actionable/i);assert.match(await card.innerText(),/Plan next step/i);assert.match(await card.innerText(),/Tracking optional/i);await capture(page,browserName,viewport,'created-card');
  await card.locator('[data-goal-open]').click();const detail=page.getByRole('dialog',{name});await detail.waitFor({state:'visible'});assert.match(await detail.innerText(),/why this matters/i);assert.match(await detail.innerText(),/tracking optional/i);assert.match(await detail.innerText(),/next useful move/i);assert.match(await detail.innerText(),/plan next step/i);await capture(page,browserName,viewport,'detail');
  await detail.getByRole('button',{name:'Archive'}).click();const archiveDialog=page.locator('.goal-archive-dialog');await archiveDialog.waitFor({state:'visible'});assert.match(await archiveDialog.innerText(),/archive direction/i);await assertNoOverflow(page,`${browserName} ${viewport} archive dialog`);await page.locator('[data-goal-archive-confirm]').click();await archiveDialog.waitFor({state:'detached'});await card.waitFor({state:'detached',timeout:15_000});

  await page.evaluate(()=>localStorage.setItem('growth-compass:preview2:e2:theme','light'));await page.reload({waitUntil:'domcontentloaded'});await page.locator('.direction-view').waitFor({state:'visible'});assert.equal(await page.locator('html').getAttribute('data-theme'),'light',`${browserName} ${viewport}: light preference must apply`);add=page.locator('[data-goal-new]').first();await add.click();dialog=page.getByRole('dialog',{name:'Where do you want to move?'});await dialog.waitFor({state:'visible'});const themeColors=await dialog.evaluate(node=>{const style=getComputedStyle(node);return{background:style.backgroundColor,text:style.color};});const expected=await page.evaluate(()=>{const probe=document.createElement('i');probe.style.cssText='position:fixed;visibility:hidden;background:var(--gc-surface);color:var(--gc-text)';document.body.appendChild(probe);const style=getComputedStyle(probe),result={background:style.backgroundColor,text:style.color};probe.remove();return result;});assert.equal(themeColors.background,expected.background,`${browserName} ${viewport}: Direction editor must use light semantic surface`);assert.equal(themeColors.text,expected.text,`${browserName} ${viewport}: Direction editor text must use light semantic text`);await capture(page,browserName,viewport,'light-create');await page.keyboard.press('Escape');
}

for(const [browserName,browserType] of BROWSERS){test(`${browserName} desktop accepts Experience 2 Direction`,async()=>{const browser=await browserType.launch();try{const context=await browser.newContext({viewport:{width:1280,height:900}});await exercise(await context.newPage(),browserName,'desktop');await context.close();}finally{await browser.close();}});test(`${browserName} 375px accepts Experience 2 Direction`,async()=>{const browser=await browserType.launch();try{const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});await exercise(await context.newPage(),browserName,'375px');await context.close();}finally{await browser.close();}});}
