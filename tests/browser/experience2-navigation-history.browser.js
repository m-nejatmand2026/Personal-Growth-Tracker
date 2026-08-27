import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const BASE_URL=process.env.GC_E2E_BASE_URL||'http://127.0.0.1:8787/experience/2/';
const BROWSERS=[['Chromium',chromium],['WebKit',webkit]];
async function waitForView(page,title){await page.waitForFunction(expected=>document.querySelector('#viewTitle')?.textContent?.trim()===expected,title);await page.waitForFunction(()=>document.querySelector('#viewHost')?.childElementCount>0);}
async function navigationDepth(page){return page.evaluate(()=>history.state?.gcExperience2Navigation?.depth??null);}
async function exercise(page,browserName){
  const response=await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:15_000});assert.ok(response?.ok());await waitForView(page,'Today');const back=page.locator('[data-app-back]');await back.waitFor({state:'attached'});assert.equal(await back.isHidden(),true);assert.equal(await navigationDepth(page),0);
  await page.locator('.mobile-dock [data-view="compass"]').click();await waitForView(page,'Compass');await page.waitForFunction(()=>history.state?.gcExperience2Navigation?.depth===1);assert.equal(await back.isVisible(),true);
  await page.locator('[data-compass-open="goals"]').first().click();await waitForView(page,'Direction');await page.waitForFunction(()=>history.state?.gcExperience2Navigation?.depth===2);
  await page.locator('.mobile-dock [data-view="patterns"]').click();await waitForView(page,'Patterns');await page.waitForFunction(()=>history.state?.gcExperience2Navigation?.depth===3);
  await page.evaluate(()=>history.back());await waitForView(page,'Direction');assert.equal(await navigationDepth(page),2,`${browserName}: back should restore nested Direction`);
  await page.evaluate(()=>history.back());await waitForView(page,'Compass');assert.equal(await navigationDepth(page),1,`${browserName}: repeated back should restore Compass`);
  await back.click();await waitForView(page,'Today');assert.equal(await navigationDepth(page),0);assert.equal(await back.isHidden(),true);
  await page.evaluate(()=>history.forward());await waitForView(page,'Compass');assert.equal(await navigationDepth(page),1);assert.equal(await back.isVisible(),true);
}
for(const [browserName,browserType] of BROWSERS){test(`${browserName} 375px keeps phone back navigation inside Experience 2 composition history`,async()=>{const browser=await browserType.launch();try{const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await exercise(await context.newPage(),browserName);await context.close();}finally{await browser.close();}});}
