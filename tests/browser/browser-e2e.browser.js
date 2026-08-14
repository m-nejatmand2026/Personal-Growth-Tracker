import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.GC_E2E_BASE_URL || 'http://127.0.0.1:8787';
const BROWSERS = [
  ['Chromium', chromium],
  ['WebKit', webkit]
];

async function openApp(page) {
  const started = Date.now();
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  assert.ok(response?.ok(), `expected ${BASE_URL} to return a successful document`);
  await page.locator('#todayView').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const root = document.querySelector('#todayView');
    return Boolean(root && !root.hasAttribute('aria-busy') && root.textContent.trim().length > 0);
  });
  assert.ok(Date.now() - started < 10_000, 'local app should become usable within the browser smoke budget');
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  assert.ok(metrics.documentWidth <= metrics.viewport + 1, `${label}: document must not overflow horizontally`);
  assert.ok(metrics.bodyWidth <= metrics.viewport + 1, `${label}: body must not overflow horizontally`);
}

async function selectView(page, view, expectedTitle, selectorPrefix = '.rail-nav-btn') {
  await page.locator(`${selectorPrefix}[data-view="${view}"]`).click();
  await page.locator('#pageTitle').filter({ hasText: expectedTitle }).waitFor();
  const target = page.locator(`#${view}View`);
  await target.waitFor({ state: 'visible' });
  assert.equal(await target.getAttribute('hidden'), null);
  assert.equal(await page.title(), `${expectedTitle} — Growth Compass`);
}

async function exerciseDesktop(browserType, browserName) {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await openApp(page);

    assert.equal(await page.locator('#pageTitle').textContent(), 'Today');
    assert.equal(await page.title(), 'Today — Growth Compass');
    await assertNoHorizontalOverflow(page, `${browserName} desktop Today`);

    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    assert.equal((await focused.textContent())?.trim(), 'Skip to main content');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.id === 'mainContent');

    for (const [view, title] of [
      ['plan', 'Plan'],
      ['progress', 'Progress'],
      ['insights', 'Insights'],
      ['wellness-boost', 'Wellness Boost']
    ]) {
      await selectView(page, view, title);
      await assertNoHorizontalOverflow(page, `${browserName} desktop ${title}`);
    }

    const opener = page.locator('[data-open-logger]:visible').first();
    await opener.focus();
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'What do you want to do?' });
    await dialog.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'loggerActivityQuery');
    assert.equal(await dialog.getAttribute('aria-modal'), 'true');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.activeElement?.hasAttribute('data-open-logger'));

    await context.close();
  } finally {
    await browser.close();
  }
}

async function exerciseMobile(browserType, browserName) {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();
    await openApp(page);
    await assertNoHorizontalOverflow(page, `${browserName} 375px Today`);

    const bottomNav = page.locator('.bottom-nav');
    await bottomNav.waitFor({ state: 'visible' });
    const buttons = bottomNav.locator('button:visible');
    const count = await buttons.count();
    assert.ok(count >= 5, 'mobile primary navigation should expose the five frequent actions');
    for (let index = 0; index < count; index += 1) {
      const box = await buttons.nth(index).boundingBox();
      assert.ok(box && box.height >= 44, `mobile nav button ${index + 1} should meet the 44px touch target`);
    }

    await selectView(page, 'plan', 'Plan', '.bottom-nav .nav-btn');
    await assertNoHorizontalOverflow(page, `${browserName} 375px Plan`);
    await selectView(page, 'progress', 'Progress', '.bottom-nav .nav-btn');
    await assertNoHorizontalOverflow(page, `${browserName} 375px Progress`);
    await selectView(page, 'wellness-boost', 'Wellness Boost', '.bottom-nav .nav-btn');
    await assertNoHorizontalOverflow(page, `${browserName} 375px Wellness Boost`);

    const quickAdd = page.locator('#quickAddBtn');
    await quickAdd.click();
    const dialog = page.getByRole('dialog', { name: 'What do you want to do?' });
    await dialog.waitFor({ state: 'visible' });
    const dialogBox = await dialog.boundingBox();
    assert.ok(dialogBox && dialogBox.x >= -1 && dialogBox.x + dialogBox.width <= 376, 'mobile Logger must fit the 375px viewport');
    await page.waitForFunction(() => document.activeElement?.id === 'loggerActivityQuery');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await assertNoHorizontalOverflow(page, `${browserName} 375px after Logger`);

    await context.close();
  } finally {
    await browser.close();
  }
}

for (const [browserName, browserType] of BROWSERS) {
  test(`${browserName} desktop validates navigation keyboard modal and reflow contracts`, async () => {
    await exerciseDesktop(browserType, browserName);
  });

  test(`${browserName} 375px validates touch navigation Logger fit and reflow contracts`, async () => {
    await exerciseMobile(browserType, browserName);
  });
}
