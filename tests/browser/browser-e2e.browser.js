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
  await page.waitForFunction(() => {
    const app = document.querySelector('#app');
    return app && getComputedStyle(app).display === 'none';
  });

  const state = await page.evaluate(() => {
    const visibleElements = [...document.body.querySelectorAll('*')].filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity || 1) !== 0 &&
        rect.width > 0 &&
        rect.height > 0;
    });

    const visibleInteractive = visibleElements.filter((element) =>
      element.matches('a,button,input,select,textarea,summary,[role="button"],[tabindex]')
    );

    return {
      visibleCount: visibleElements.length,
      interactiveCount: visibleInteractive.length,
      visibleText: document.body.innerText.trim(),
      appDisplay: getComputedStyle(document.querySelector('#app')).display,
      background: getComputedStyle(document.body).backgroundColor,
      viewport: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    };
  });

  assert.equal(state.visibleCount, 0, `${browserName} ${viewport}: Preview must contain no visible UI elements`);
  assert.equal(state.interactiveCount, 0, `${browserName} ${viewport}: Preview must contain no visible interactive controls`);
  assert.equal(state.visibleText, '', `${browserName} ${viewport}: Preview must contain no visible product copy`);
  assert.equal(state.appDisplay, 'none', `${browserName} ${viewport}: legacy app shell must be disabled`);
  assert.equal(state.background, 'rgb(255, 255, 255)', `${browserName} ${viewport}: reset canvas should be neutral white`);
  assert.ok(state.documentWidth <= state.viewport + 1, `${browserName} ${viewport}: blank canvas must not overflow horizontally`);
  assert.ok(state.bodyWidth <= state.viewport + 1, `${browserName} ${viewport}: blank body must not overflow horizontally`);

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
