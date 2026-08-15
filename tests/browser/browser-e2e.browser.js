import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.GC_E2E_BASE_URL || 'http://127.0.0.1:8787';
const SCREENSHOT_DIR = process.env.GC_E2E_SCREENSHOT_DIR || '';
const BROWSERS = [
  ['Chromium', chromium],
  ['WebKit', webkit]
];

async function capture(page, browserName, viewport) {
  if (!SCREENSHOT_DIR) return;
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${browserName.toLowerCase()}-${viewport}-empty.png`,
    fullPage: false,
    animations: 'disabled'
  });
}

async function assertBlankCanvas(page, browserName, viewport) {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  assert.ok(response?.ok(), `expected ${BASE_URL} to return a successful document`);

  await page.locator('link[href="/css/preview-empty.css"]').waitFor({ state: 'attached' });
  await page.waitForFunction(() => getComputedStyle(document.body).display === 'none');

  const state = await page.evaluate(() => {
    const renderedElements = [...document.body.querySelectorAll('*')].filter((element) =>
      element.getClientRects().length > 0
    );
    const visibleInteractive = renderedElements.filter((element) =>
      element.matches('a,button,input,select,textarea,summary,[role="button"],[tabindex]')
    );

    return {
      visibleCount: renderedElements.length,
      interactiveCount: visibleInteractive.length,
      bodyDisplay: getComputedStyle(document.body).display,
      bodyRectCount: document.body.getClientRects().length,
      htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
      viewport: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth
    };
  });

  assert.equal(state.bodyDisplay, 'none', `${browserName} ${viewport}: legacy app shell must be disabled by the blank Preview ancestor`);
  assert.equal(state.bodyRectCount, 0, `${browserName} ${viewport}: body must have no rendered box`);
  assert.equal(state.visibleCount, 0, `${browserName} ${viewport}: Preview must contain no visible UI elements`);
  assert.equal(state.interactiveCount, 0, `${browserName} ${viewport}: Preview must contain no visible interactive controls`);
  assert.equal(state.htmlBackground, 'rgb(255, 255, 255)', `${browserName} ${viewport}: document canvas should be neutral white`);
  assert.ok(state.documentWidth <= state.viewport + 1, `${browserName} ${viewport}: blank canvas must not overflow horizontally`);

  await capture(page, browserName, viewport);
}

for (const [browserName, browserType] of BROWSERS) {
  test(`${browserName} desktop validates intentionally empty frontend canvas`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await assertBlankCanvas(page, browserName, 'desktop');
      await context.close();
    } finally {
      await browser.close();
    }
  });

  test(`${browserName} 375px validates intentionally empty frontend canvas`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true
      });
      const page = await context.newPage();
      await assertBlankCanvas(page, browserName, 'mobile');
      await context.close();
    } finally {
      await browser.close();
    }
  });
}
