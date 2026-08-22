import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const BASE_URL=process.env.GC_E2E_BASE_URL||'http://127.0.0.1:8787/experience/2/';
const BROWSERS=[['Chromium',chromium],['WebKit',webkit]];

async function waitForView(page,title){
  await page.waitForFunction(expected=>document.querySelector('#viewTitle')?.textContent?.trim()===expected,title);
  await page.waitForFunction(()=>document.querySelector('#viewHost')?.childElementCount>0);
}

async function navigationDepth(page){return page.evaluate(()=>history.state?.gcExperience2Navigation?.depth??null);}

async function exercise(page,browserName){
  const response=await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:15_000});
  assert.ok(response?.ok());
  await waitForView(page,'Today');
  const back=page.locator('[data-app-back]');
  await back.waitFor({state:'attached'});
  assert.equal(await back.isHidden(),true,`${browserName}: app back control should stay hidden before an in-app page change`);
  assert.equal(await navigationDepth(page),0,`${browserName}: initial app history depth should be zero`);

  await page.locator('.mobile-dock [data-view="plan"]').click();
  await waitForView(page,'Plan');
  await page.waitForFunction(()=>history.state?.gcExperience2Navigation?.depth===1);
  assert.equal(await back.isVisible(),true,`${browserName}: app back control should appear after navigating to another page`);

  await page.locator('#mobileExploreToggle').click();
  await page.locator('#mobileSecondary [data-view="goals"]').click();
  await waitForView(page,'Direction');
  await page.waitForFunction(()=>history.state?.gcExperience2Navigation?.depth===2);

  await page.locator('.mobile-dock [data-view="progress"]').click();
  await waitForView(page,'Progress');
  await page.waitForFunction(()=>history.state?.gcExperience2Navigation?.depth===3);

  await page.evaluate(()=>history.back());
  await waitForView(page,'Direction');
  assert.equal(await navigationDepth(page),2,`${browserName}: phone/browser back should return to the previous in-app page`);

  await page.evaluate(()=>history.back());
  await waitForView(page,'Plan');
  assert.equal(await navigationDepth(page),1,`${browserName}: repeated phone/browser back should continue through in-app page history`);

  await back.click();
  await waitForView(page,'Today');
  assert.equal(await navigationDepth(page),0,`${browserName}: visible app back control should use the same page history`);
  assert.equal(await back.isHidden(),true,`${browserName}: app back control should hide again at the first in-app page`);

  await page.evaluate(()=>history.forward());
  await waitForView(page,'Plan');
  assert.equal(await navigationDepth(page),1,`${browserName}: browser forward should restore the in-app page`);
  assert.equal(await back.isVisible(),true);
}

for(const [browserName,browserType] of BROWSERS){
  test(`${browserName} 375px keeps phone back navigation inside Experience 2 page history`,async()=>{
    const browser=await browserType.launch();
    try{
      const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      await exercise(await context.newPage(),browserName);
      await context.close();
    }finally{await browser.close();}
  });
}
