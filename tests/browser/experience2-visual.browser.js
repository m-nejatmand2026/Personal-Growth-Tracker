import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE_URL=process.env.GC_E2E_BASE_URL||'http://127.0.0.1:8787/experience/2/';
const SCREENSHOT_DIR=process.env.GC_E2E_SCREENSHOT_DIR||'';
const VIEW_SELECTORS={today:'.today-view',plan:'.plan-view',goals:'.goals-view',activities:'.activities-view',progress:'.progress-view',insights:'.insights-view',wellness:'.wellness-view',journal:'.journal-view',settings:'.settings-view'};
const PRIMARY_MOBILE=new Set(['today','plan','progress','wellness']);

async function capture(page,viewport,state){if(!SCREENSHOT_DIR)return;await mkdir(SCREENSHOT_DIR,{recursive:true});await page.waitForTimeout(220);await page.screenshot({path:`${SCREENSHOT_DIR}/e2-chromium-${viewport}-${state}.png`,fullPage:false});}
async function assertNoOverflow(page,label){const size=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth}));assert.ok(size.document<=size.viewport+1,`${label}: Experience 2 visual evidence must not overflow horizontally; ${JSON.stringify(size)}`);}
async function openView(page,view,viewport){if(viewport==='mobile'){if(PRIMARY_MOBILE.has(view)){await page.locator(`.mobile-dock [data-view="${view}"]`).click();}else{const explore=page.locator('#mobileExploreToggle');if(await explore.getAttribute('aria-expanded')!=='true')await explore.click();await page.locator(`#mobileSecondary [data-view="${view}"]`).click();}}else{await page.locator(`.desktop-rail [data-view="${view}"]`).click();}await page.locator(VIEW_SELECTORS[view]).waitFor({state:'visible',timeout:15_000});await assertNoOverflow(page,`${viewport} ${view}`);}
async function evidence(viewport,contextOptions){const browser=await chromium.launch();try{const context=await browser.newContext(contextOptions);const page=await context.newPage();const response=await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:15_000});assert.ok(response?.ok(),`${viewport}: Experience 2 must load`);await page.locator('.today-view').waitFor({state:'visible',timeout:15_000});await capture(page,viewport,'today');for(const view of ['plan','goals','activities','progress','insights','wellness','journal','settings']){await openView(page,view,viewport);await capture(page,viewport,view);}await openView(page,'plan',viewport);await page.locator('[data-plan-open="schedule"]').first().click();await page.locator('.schedule-view').waitFor({state:'visible',timeout:15_000});await assertNoOverflow(page,`${viewport} schedule`);await capture(page,viewport,'schedule');await openView(page,'today',viewport);await page.locator('[data-open-add]:visible').first().click();await page.locator('.logger-panel').waitFor({state:'visible',timeout:15_000});await assertNoOverflow(page,`${viewport} add`);await capture(page,viewport,'add');await page.keyboard.press('Escape');await context.close();}finally{await browser.close();}}

test('Chromium desktop captures Experience 2 visual acceptance evidence',async()=>{await evidence('desktop',{viewport:{width:1280,height:900}});});
test('Chromium 375px captures Experience 2 visual acceptance evidence',async()=>{await evidence('mobile',{viewport:{width:375,height:812},isMobile:true,hasTouch:true});});
