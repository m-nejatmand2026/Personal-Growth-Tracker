import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.GC_E2E_BASE_URL || 'http://127.0.0.1:8787';
const SCREENSHOT_DIR = process.env.GC_E2E_SCREENSHOT_DIR || '';
const BROWSERS = [['Chromium', chromium], ['WebKit', webkit]];

async function capture(page, browserName, viewport) {
  if (!SCREENSHOT_DIR) return;
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${browserName.toLowerCase()}-${viewport}-figma-current.png`,
    fullPage: false,
    animations: 'disabled'
  });
}

async function assertNoHorizontalOverflow(page, browserName, viewport) {
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, documentWidth: document.documentElement.scrollWidth }));
  assert.ok(dimensions.documentWidth <= dimensions.viewport + 1, `${browserName} ${viewport}: current UI must not overflow horizontally`);
}

async function loadCurrentUi(page, browserName, viewport) {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  assert.ok(response?.ok(), `expected ${BASE_URL} to return a successful document`);
  await page.locator('link[href="/css/figma-current.css"]').waitFor({ state: 'attached' });
  await page.locator('link[href="/css/figma-current-live.css"]').waitFor({ state: 'attached' });
  await page.locator('#todayView .today-layout').waitFor({ state: 'visible', timeout: 15_000 });

  const state = await page.evaluate(() => ({
    bodyDisplay: getComputedStyle(document.body).display,
    background: getComputedStyle(document.documentElement).backgroundColor,
    interactiveCount: [...document.querySelectorAll('a,button,input,select,textarea,summary,[role="button"],[tabindex]')].filter((element) => element.getClientRects().length > 0).length,
    title: document.title
  }));
  assert.notEqual(state.bodyDisplay, 'none', `${browserName} ${viewport}: application body must render`);
  assert.equal(state.background, 'rgb(5, 20, 36)', `${browserName} ${viewport}: canonical Growth Compass canvas must render`);
  assert.ok(state.interactiveCount > 4, `${browserName} ${viewport}: current UI must expose interactive controls`);
  assert.match(state.title, /^Today — Growth Compass$/);
  await assertNoHorizontalOverflow(page, browserName, viewport);
}

async function assertDesktop(page, browserName) {
  await loadCurrentUi(page, browserName, 'desktop');
  await page.locator('.app-rail').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.bottom-nav').isVisible(), false, `${browserName} desktop: mobile bottom nav must be hidden`);
  assert.equal(await page.locator('.rail-brand').innerText(), 'Growth Compass');
  assert.equal(await page.locator('.today-current-metric').count(), 2);

  await page.locator('.rail-nav-btn[data-view="plan"]').click();
  await page.locator('#planView').waitFor({ state: 'visible' });
  assert.equal(await page.title(), 'Plan — Growth Compass');

  await page.locator('.rail-nav-btn[data-view="progress"]').click();
  await page.locator('#progressView .progress-current').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.progress-current-card').count(), 3);

  await page.locator('.rail-nav-btn[data-view="wellness-boost"]').click();
  await page.locator('#wellness-boostView .wellness-boost-library-view').waitFor({ state: 'visible' });

  await page.locator('.rail-nav-btn[data-view="insights"]').click();
  await page.locator('#insightsView .insights-current').waitFor({ state: 'visible' });
  await assertNoHorizontalOverflow(page, browserName, 'desktop');
  await capture(page, browserName, 'desktop');
}

async function assertMobile(page, browserName) {
  await loadCurrentUi(page, browserName, 'mobile');
  assert.equal(await page.locator('.app-rail').isVisible(), false, `${browserName} mobile: desktop rail must be hidden`);
  await page.locator('.bottom-nav').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.bottom-nav .nav-btn').count(), 5);
  await page.locator('#quickAddBtn').click();
  await page.locator('#loggerHost [role="dialog"]').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');

  await page.locator('.nav-btn[data-view="plan"]').click();
  await page.locator('#planView').waitFor({ state: 'visible' });
  await page.locator('.nav-btn[data-view="progress"]').click();
  await page.locator('#progressView .progress-current').waitFor({ state: 'visible' });
  await page.locator('.nav-btn[data-view="wellness-boost"]').click();
  await page.locator('#wellness-boostView .wellness-boost-library-view').waitFor({ state: 'visible' });

  await page.locator('#topMore > summary').click();
  await page.locator('#insightsBtn').click();
  await page.locator('#insightsView .insights-current').waitFor({ state: 'visible' });
  await assertNoHorizontalOverflow(page, browserName, 'mobile');
  await capture(page, browserName, 'mobile');
}

for (const [browserName, browserType] of BROWSERS) {
  test(`${browserName} desktop accepts canonical Figma current application`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await assertDesktop(page, browserName);
      await context.close();
    } finally {
      await browser.close();
    }
  });

  test(`${browserName} 375px accepts canonical Figma current application`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await assertMobile(page, browserName);
      await context.close();
    } finally {
      await browser.close();
    }
  });
}
