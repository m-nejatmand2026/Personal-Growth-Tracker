import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const BASE_URL=process.env.GC_E2E_BASE_URL||'http://127.0.0.1:8787/experience/2/';
const BROWSERS=[['Chromium',chromium],['WebKit',webkit]];

async function assertNoHorizontalOverflow(page,label){const result=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth}));assert.ok(result.document<=result.viewport+1,`${label}: Experience 2 Logger must not overflow horizontally; ${JSON.stringify(result)}`);}
async function chooseMode(page,value){const card=page.locator(`label.logger-mode-choice:has(input[value="${value}"])`);await card.click();assert.equal(await page.locator('input[name="loggerEntryMode"]:checked').getAttribute('value'),value,`Logger must select ${value}`);}
async function exercise(page,browserName,viewport){const response=await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:15_000});assert.ok(response?.ok(),`${browserName} ${viewport}: Experience 2 must load`);await page.locator('#viewHost').waitFor({state:'visible'});const add=viewport==='desktop'?page.locator('.rail-add'):page.locator('.dock-add');await add.waitFor({state:'visible'});await add.focus();await add.click();const panel=page.locator('.logger-panel');await panel.waitFor({state:'visible'});assert.equal(await page.locator('input[name="loggerEntryMode"]:checked').getAttribute('value'),'done',`${browserName} ${viewport}: global Add must default to factual Done`);assert.equal(await page.locator('input[name="loggerEntryMode"]').count(),3);await assertNoHorizontalOverflow(page,`${browserName} ${viewport}`);await chooseMode(page,'planned');assert.equal(await page.locator('[data-plan-only]').isVisible(),true,`${browserName} ${viewport}: Plan must expose when controls`);await chooseMode(page,'in_progress');assert.equal(await page.locator('[data-plan-only]').isVisible(),false,`${browserName} ${viewport}: Start now must not imply future planning controls`);await page.keyboard.press('Escape');await panel.waitFor({state:'detached'});assert.equal(await add.evaluate(node=>document.activeElement===node),true,`${browserName} ${viewport}: closing Logger must restore focus to Add`);}

for(const [browserName,browserType] of BROWSERS){
  test(`${browserName} desktop accepts Experience 2 Logger`,async()=>{const browser=await browserType.launch();try{const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();await exercise(page,browserName,'desktop');await context.close();}finally{await browser.close();}});
  test(`${browserName} 375px accepts Experience 2 Logger`,async()=>{const browser=await browserType.launch();try{const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});const page=await context.newPage();await exercise(page,browserName,'375px');await context.close();}finally{await browser.close();}});
}
