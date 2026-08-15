import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.GC_E2E_BASE_URL || 'http://127.0.0.1:8787';
const SCREENSHOT_DIR = process.env.GC_E2E_SCREENSHOT_DIR || '';
const BROWSERS = [['Chromium', chromium], ['WebKit', webkit]];

async function capture(page, browserName, viewport, state) {
  if (!SCREENSHOT_DIR) return;
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${browserName.toLowerCase()}-${viewport}-${state}-product-rebuild.png`, fullPage: false, animations: 'disabled' });
}

async function assertNoHorizontalOverflow(page, browserName, viewport, state) {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const documentWidth = document.documentElement.scrollWidth;
    const offenders = [...document.querySelectorAll('body *')].filter((element) => { const style=getComputedStyle(element);if(style.display==='none'||style.visibility==='hidden')return false;const rect=element.getBoundingClientRect();return rect.right>viewportWidth+1||rect.left<-1; }).slice(0,12).map((element)=>{const rect=element.getBoundingClientRect();return{tag:element.tagName.toLowerCase(),id:element.id||'',className:typeof element.className==='string'?element.className:'',left:Math.round(rect.left*10)/10,right:Math.round(rect.right*10)/10,width:Math.round(rect.width*10)/10};});
    return { viewportWidth, documentWidth, offenders };
  });
  assert.ok(result.documentWidth <= result.viewportWidth + 1, `${browserName} ${viewport} ${state}: Product Rebuild must not overflow horizontally; viewport=${result.viewportWidth}, document=${result.documentWidth}, offenders=${JSON.stringify(result.offenders)}`);
}

async function assertLoggerCloseIsTopmost(page, browserName, viewport) {
  const hit = await page.locator('#loggerHost .logger-close').evaluate((button) => {
    const rect = button.getBoundingClientRect();
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return target === button || button.contains(target);
  });
  assert.equal(hit, true, `${browserName} ${viewport}: Add Activity close control must remain above global navigation controls`);
}

async function loadProductUi(page, browserName, viewport) {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  assert.ok(response?.ok(), `expected ${BASE_URL} to return a successful document`);
  await page.locator('link[href="/css/product-rebuild.css"]').waitFor({ state: 'attached' });
  await page.locator('link[href="/css/product-rebuild-pages.css"]').waitFor({ state: 'attached' });
  await page.locator('#todayView .gc-today-rebuild').waitFor({ state: 'visible', timeout: 15_000 });
  const state = await page.evaluate(() => ({ bodyDisplay:getComputedStyle(document.body).display, background:getComputedStyle(document.documentElement).backgroundColor, interactiveCount:[...document.querySelectorAll('a,button,input,select,textarea,summary,[role="button"],[tabindex]')].filter((element)=>element.getClientRects().length>0).length, title:document.title }));
  assert.notEqual(state.bodyDisplay,'none',`${browserName} ${viewport}: application body must render`);
  assert.equal(state.background,'rgb(5, 20, 36)',`${browserName} ${viewport}: Growth Compass canvas must render`);
  assert.ok(state.interactiveCount>4,`${browserName} ${viewport}: UI must expose interactive controls`);
  assert.match(state.title,/^Today — Growth Compass$/);
  await assertNoHorizontalOverflow(page,browserName,viewport,'today');
}

async function assertMobileHeaderClear(page, browserName) {
  const overlap = await page.evaluate(() => {
    const heading=document.querySelector('#todayView h2');const more=document.querySelector('#topMore > summary');if(!heading||!more)return null;const a=heading.getBoundingClientRect();const b=more.getBoundingClientRect();return !(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom);
  });
  assert.equal(overlap,false,`${browserName} mobile: More control must not collide with Today heading`);
}

async function assertDesktop(page,browserName) {
  await loadProductUi(page,browserName,'desktop');
  await page.locator('.app-rail').waitFor({state:'visible'});assert.equal(await page.locator('.bottom-nav').isVisible(),false);
  assert.equal(await page.locator('.rail-brand').innerText(),'Growth Compass');
  await page.locator('#todayView .gc-now-card').waitFor({state:'visible'});await page.locator('#todayView .gc-add-activity').waitFor({state:'visible'});
  await page.locator('.rail-log-btn').click();await page.locator('#loggerHost .gc-add-activity-sheet').waitFor({state:'visible'});assert.equal(await page.locator('input[name="loggerEntryMode"]').count(),3);await assertLoggerCloseIsTopmost(page,browserName,'desktop');await page.keyboard.press('Escape');
  await page.locator('.rail-nav-btn[data-view="plan"]').click();await page.locator('#planView .gc-plan-rebuild').waitFor({state:'visible'});await assertNoHorizontalOverflow(page,browserName,'desktop','plan');
  await page.locator('.rail-nav-btn[data-view="progress"]').click();await page.locator('#progressView .gc-progress-rebuild').waitFor({state:'visible'});await assertNoHorizontalOverflow(page,browserName,'desktop','progress');
  await page.locator('.rail-nav-btn[data-view="wellness-boost"]').click();await page.locator('#wellness-boostView .wellness-boost-library-view').waitFor({state:'visible'});
  await page.locator('.rail-nav-btn[data-view="insights"]').click();await page.locator('#insightsView .gc-insights-rebuild').waitFor({state:'visible'});await assertNoHorizontalOverflow(page,browserName,'desktop','insights');
  await capture(page,browserName,'desktop','insights');
}

async function assertMobile(page,browserName) {
  await loadProductUi(page,browserName,'mobile');
  assert.equal(await page.locator('.app-rail').isVisible(),false);await page.locator('.bottom-nav').waitFor({state:'visible'});assert.equal(await page.locator('.bottom-nav .nav-btn').count(),5);assert.equal((await page.locator('#quickAddBtn').innerText()).trim().includes('Add'),true);await assertMobileHeaderClear(page,browserName);await capture(page,browserName,'mobile','today');
  await page.locator('#quickAddBtn').click();await page.locator('#loggerHost .gc-add-activity-sheet').waitFor({state:'visible'});await page.locator('#loggerActivityQuery').waitFor({state:'visible'});assert.equal(await page.locator('input[name="loggerEntryMode"]').count(),3);await assertLoggerCloseIsTopmost(page,browserName,'mobile');await assertNoHorizontalOverflow(page,browserName,'mobile','add');await capture(page,browserName,'mobile','add');await page.keyboard.press('Escape');
  await page.locator('.nav-btn[data-view="plan"]').click();await page.locator('#planView .gc-plan-rebuild').waitFor({state:'visible'});await assertNoHorizontalOverflow(page,browserName,'mobile','plan');await capture(page,browserName,'mobile','plan');
  await page.locator('.nav-btn[data-view="progress"]').click();await page.locator('#progressView .gc-progress-rebuild').waitFor({state:'visible'});await assertNoHorizontalOverflow(page,browserName,'mobile','progress');await capture(page,browserName,'mobile','progress');
  await page.locator('.nav-btn[data-view="wellness-boost"]').click();await page.locator('#wellness-boostView .wellness-boost-library-view').waitFor({state:'visible'});await assertNoHorizontalOverflow(page,browserName,'mobile','wellness');
  await page.locator('#topMore > summary').click();await page.locator('#insightsBtn').click();await page.locator('#insightsView .gc-insights-rebuild').waitFor({state:'visible'});await assertNoHorizontalOverflow(page,browserName,'mobile','insights');await capture(page,browserName,'mobile','insights');
}

for (const [browserName,browserType] of BROWSERS) {
  test(`${browserName} desktop accepts Growth Compass Product Rebuild`,async()=>{const browser=await browserType.launch();try{const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();await assertDesktop(page,browserName);await context.close();}finally{await browser.close();}});
  test(`${browserName} 375px accepts Growth Compass Product Rebuild`,async()=>{const browser=await browserType.launch();try{const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});const page=await context.newPage();await assertMobile(page,browserName);await context.close();}finally{await browser.close();}});
}
