import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.GC_E2E_BASE_URL || 'http://127.0.0.1:8787';
const BROWSERS = [['Chromium', chromium], ['WebKit', webkit]];

async function load(page) {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  assert.ok(response?.ok(), `expected ${BASE_URL} to return a successful document`);
  await page.locator('link[href="/css/functional-recovery.css"]').waitFor({ state: 'attached' });
  await page.locator('#todayView .gc-today-rebuild').waitFor({ state: 'visible', timeout: 15_000 });
}

async function assertRecovery(page, browserName) {
  await load(page);

  const tomorrow = page.locator('#todayView .gc-tomorrow-plan');
  await tomorrow.waitFor({ state: 'visible' });
  assert.match(await tomorrow.locator('summary').innerText(), /Tomorrow/);

  await page.locator('#quickAddBtn').click();
  await page.locator('#loggerHost .gc-add-activity-sheet').waitFor({ state: 'visible' });
  assert.equal(await page.locator('input[name="loggerEntryMode"][value="done"]').isChecked(), true, `${browserName}: global Add must open factual Done by default`);
  assert.equal(await page.locator('input[name="loggerEntryMode"][value="planned"]').isChecked(), false, `${browserName}: global Add must not silently default to Plan`);
  await page.keyboard.press('Escape');

  await page.locator('.nav-btn[data-view="plan"]').click();
  await page.locator('#planView .gc-plan-working').waitFor({ state: 'visible', timeout: 15_000 });
  assert.match(await page.locator('#planDirectionTitle').innerText(), /What deserves attention/);
  assert.ok(await page.locator('#planView button[data-plan-scroll="commitmentEditor"]').count() >= 1, `${browserName}: Schedule must be directly reachable from Plan`);

  await page.locator('#planView button[data-plan-scroll="commitmentEditor"]').first().click();
  const commitmentEditor = page.locator('#commitmentEditor');
  await commitmentEditor.waitFor({ state: 'visible' });
  assert.equal(await commitmentEditor.evaluate((node) => node.open), true, `${browserName}: Schedule action must open the recurring-commitment editor`);
  assert.equal(await page.locator('#plan-module-capacity').evaluate((node) => node.open), true, `${browserName}: Schedule action must reveal its module container`);

  assert.equal(await page.locator('#planView .plan-loading').count(), 0, `${browserName}: rejected transient Plan loading card must never be rendered`);
}

for (const [browserName, browserType] of BROWSERS) {
  test(`${browserName} 375px accepts functional recovery`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await assertRecovery(page, browserName);
      await context.close();
    } finally {
      await browser.close();
    }
  });
}
