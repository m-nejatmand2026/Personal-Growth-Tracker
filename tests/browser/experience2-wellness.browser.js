import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const BASE_URL=process.env.GC_E2E_BASE_URL||'http://127.0.0.1:8787/experience/2/';
const BROWSERS=[['Chromium',chromium],['WebKit',webkit]];

async function waitForAppReady(page){
  // DOMContentLoaded is intentionally earlier than Experience 2 readiness:
  // auth-bootstrap must check account status and import app.js before the shell
  // is exposed. Keep this a bounded readiness wait so slow WebKit CI runners do
  // not turn that expected asynchronous boundary into a navigation race.
  await page.locator('html:not(.auth-checking):not(.auth-gated)').waitFor({state:'attached',timeout:45_000});
  await page.locator('#experience2App').waitFor({state:'visible',timeout:10_000});
}

async function exercise(page,browserName,viewport){
  const response=await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:15_000});
  assert.ok(response?.ok());
  await waitForAppReady(page);
  await page.locator('[data-view="wellness"]:visible').first().click();
  const view=page.locator('.wellness-view');
  await view.waitFor({state:'visible'});
  assert.match(await view.innerText(),/Nothing here is logged/);
  await page.locator('[data-wellness-open="steadier-breath"]').first().click();
  const ring=page.locator('[data-wellness-breath-start]');
  await ring.waitFor({state:'visible'});
  await ring.click();
  await page.waitForTimeout(250);
  assert.notEqual(await ring.getAttribute('data-phase'),'ready');
  const toggle=page.locator('[data-wellness-toggle]');
  await toggle.click();
  assert.match(await page.locator('[data-wellness-status]').innerText(),/Paused/);
  assert.ok(await page.locator('#viewHost').evaluate(node=>node.classList.contains('wellness-paused')));
  await toggle.click();
  assert.equal(await page.locator('#viewHost').evaluate(node=>node.classList.contains('wellness-paused')),false);
  await page.locator('[data-wellness-end]').click();
  assert.match(await page.locator('[data-wellness-status]').innerText(),/Nothing was logged/);
  assert.equal(await ring.isEnabled(),true);
  await ring.click();
  await page.waitForTimeout(150);
  assert.notEqual(await ring.getAttribute('data-phase'),'ready');
  await page.locator('[data-wellness-end]').click();
  const size=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth}));
  assert.ok(size.document<=size.viewport+1,`${browserName} ${viewport}: Wellness must not overflow horizontally; ${JSON.stringify(size)}`);
}

for(const [browserName,browserType] of BROWSERS){
  test(`${browserName} desktop accepts Experience 2 Wellness`,async()=>{
    const browser=await browserType.launch();
    try{
      const context=await browser.newContext({viewport:{width:1280,height:900}});
      await exercise(await context.newPage(),browserName,'desktop');
      await context.close();
    }finally{
      await browser.close();
    }
  });

  test(`${browserName} 375px accepts Experience 2 Wellness`,async()=>{
    const browser=await browserType.launch();
    try{
      const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
      await exercise(await context.newPage(),browserName,'375px');
      await context.close();
    }finally{
      await browser.close();
    }
  });
}
