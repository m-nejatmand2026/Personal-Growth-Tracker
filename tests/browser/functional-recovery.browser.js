import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.GC_E2E_BASE_URL || 'http://127.0.0.1:8787';
const BROWSERS = [['Chromium', chromium], ['WebKit', webkit]];

async function load(page) {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  assert.ok(response?.ok(), `expected ${BASE_URL} to return a successful document`);
  await page.locator('link[href="/css/functional-recovery.css"]').waitFor({ state: 'attached' });
  await page.locator('link[href="/css/modules/activities.css"]').waitFor({ state: 'attached' });
  await page.locator('#todayView .gc-today-rebuild').waitFor({ state: 'visible', timeout: 15_000 });
}

async function assertNotBuriedInMore(page, selector, browserName, label) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible' });
  const buried = await locator.evaluate((node) => Boolean(node.closest('details.gc-today-more')));
  assert.equal(buried, false, `${browserName}: ${label} must be visible on Today without opening More detail`);
}

async function assertActivityLibrary(page, browserName) {
  const activitiesButton = page.locator('#planView button[data-plan-scroll="plan-module-activities"]').first();
  await activitiesButton.click();
  const disclosure = page.locator('#plan-module-activities');
  await disclosure.waitFor({ state: 'visible' });
  assert.equal(await disclosure.evaluate((node) => node.open), true, `${browserName}: Activities destination must open its module surface`);

  const panel = page.locator('#activitiesPanel');
  await panel.waitFor({ state: 'visible' });
  assert.match(await panel.innerText(), /Activities/);
  await page.locator('#activityEditor > summary').click();
  await page.locator('#activityManageName').waitFor({ state: 'visible' });

  const usableGoals = await page.locator('#activityManageGoal option').evaluateAll((options) => options.filter((option) => option.value).map((option) => option.value));
  assert.ok(usableGoals.length > 0, `${browserName}: seeded recovery environment needs an active Goal for Activity creation`);

  const activityName = `Recovery ${browserName} activity`;
  await page.locator('#activityManageName').fill(activityName);
  await page.locator('#activityManageGoal').selectOption(usableGoals[0]);
  await page.locator('#activityManageDescription').fill('Created by the isolated browser recovery gate');
  await page.locator('#activityManageSave').click();

  await page.locator('#activitiesPanel').waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByText(activityName, { exact: true }).waitFor({ state: 'visible', timeout: 15_000 });
}

async function assertRecovery(page, browserName) {
  await load(page);

  const tomorrow = page.locator('#todayView .gc-tomorrow-plan');
  await tomorrow.waitFor({ state: 'visible' });
  assert.match(await tomorrow.locator('summary').innerText(), /Tomorrow/);

  await assertNotBuriedInMore(page, '#todayDirectionTitle', browserName, 'Progress direction');
  await assertNotBuriedInMore(page, '#todayView [data-wellbeing-state]', browserName, 'Wellbeing state');
  await assertNotBuriedInMore(page, '#journalPreview', browserName, 'Journal entry point');
  assert.match(await page.locator('#todayDirectionTitle').innerText(), /Direction/);
  assert.match(await page.locator('#todayView [data-wellbeing-state]').innerText(), /Energy/);
  assert.match(await page.locator('#journalPreview').innerText(), /Journal/);

  await page.locator('#quickAddBtn').click();
  await page.locator('#loggerHost .gc-add-activity-sheet').waitFor({ state: 'visible' });
  assert.equal(await page.locator('input[name="loggerEntryMode"][value="done"]').isChecked(), true, `${browserName}: global Add must open factual Done by default`);
  assert.equal(await page.locator('input[name="loggerEntryMode"][value="planned"]').isChecked(), false, `${browserName}: global Add must not silently default to Plan`);
  await page.keyboard.press('Escape');

  await page.locator('.nav-btn[data-view="plan"]').click();
  await page.locator('#planView .gc-plan-working').waitFor({ state: 'visible', timeout: 15_000 });
  assert.match(await page.locator('#planDirectionTitle').innerText(), /What deserves attention/);
  assert.ok(await page.locator('#planView button[data-plan-scroll="commitmentEditor"]').count() >= 1, `${browserName}: Schedule must be directly reachable from Plan`);
  assert.ok(await page.locator('#planView button[data-plan-scroll="plan-module-activities"]').count() >= 1, `${browserName}: Activities must be directly reachable from Plan`);

  await assertActivityLibrary(page, browserName);

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
