import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.GC_E2E_BASE_URL || 'http://127.0.0.1:8787';
const SCREENSHOT_DIR = process.env.GC_E2E_SCREENSHOT_DIR || '';
const BROWSERS = [['Chromium', chromium], ['WebKit', webkit]];

async function capture(page, browser, state) {
  if (!SCREENSHOT_DIR) return;
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${browser.toLowerCase()}-375-${state}-recovery.png`, fullPage: false, animations: 'disabled' });
}

async function load(page) {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  assert.ok(response?.ok());
  for (const href of ['/css/functional-recovery.css', '/css/screenshot-recovery.css', '/css/modules/activities.css']) {
    await page.locator(`link[href="${href}"]`).waitFor({ state: 'attached' });
  }
  await page.locator('#todayView .gc-today-rebuild').waitFor({ state: 'visible', timeout: 15000 });
}

async function notBuried(page, selector, browser, label) {
  const node = page.locator(selector);
  await node.waitFor({ state: 'visible' });
  assert.equal(await node.evaluate((element) => Boolean(element.closest('details.gc-today-more'))), false, `${browser}: ${label} must stay visible on Today`);
}

async function assertTomorrow(page, browser) {
  const tomorrow = page.locator('.gc-tomorrow-plan');
  await tomorrow.waitFor({ state: 'visible' });
  await tomorrow.locator(':scope > summary').click();
  await tomorrow.locator('.gc-tomorrow-plan-body').waitFor({ state: 'visible' });
  await tomorrow.locator('[data-plan-capture="planned"][data-plan-date]').waitFor({ state: 'visible' });
  assert.match(await tomorrow.innerText(), /Tomorrow/i, `${browser}: Tomorrow planning must be one tap away`);
  await capture(page, browser, 'tomorrow-open');
}

async function createActivity(page, browser) {
  const activityButton = page.locator('#planView button[data-plan-scroll="plan-module-activities"]').first();
  await activityButton.click();
  const disclosure = page.locator('#plan-module-activities');
  await disclosure.waitFor({ state: 'visible' });
  assert.equal(await disclosure.evaluate((node) => node.open), true);
  await page.locator('#activityEditor > summary').click();
  const goals = await page.locator('#activityManageGoal option').evaluateAll((options) => options.filter((option) => option.value).map((option) => option.value));
  assert.ok(goals.length > 0, `${browser}: active Goal required`);
  const name = `Recovery ${browser} activity`;
  await page.locator('#activityManageName').fill(name);
  await page.locator('#activityManageGoal').selectOption(goals[0]);
  await page.locator('#activityManageDescription').fill('Created by isolated browser recovery gate');
  await page.locator('#activityManageSave').click();
  await page.getByText(name, { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  return name;
}

async function assertGoalTiles(page, browser) {
  const tile = page.locator('#planView .gc-plan-goal-focus').first();
  await tile.waitFor({ state: 'visible' });
  assert.equal(await tile.evaluate((node) => node.tagName), 'BUTTON', `${browser}: whole Goal surface must be the button`);
  assert.equal(await tile.locator('button').count(), 0, `${browser}: Goal tile must not contain detached action buttons`);
  assert.doesNotMatch(await tile.innerText(), /\bOpen\b/, `${browser}: rejected Open label must be gone`);
  assert.ok((await tile.getAttribute('class')).includes('gc-live-tile'));
  const before = await tile.evaluate((node) => getComputedStyle(node).backgroundImage);
  await tile.focus();
  const focused = await tile.evaluate((node) => ({ outline: getComputedStyle(node).outlineStyle, background: getComputedStyle(node).backgroundImage }));
  assert.notEqual(focused.outline, 'none');
  assert.ok(focused.background || before);
}

async function assertSettingsContrast(page, browser) {
  const summary = page.locator('#topMore > summary');
  await summary.click();
  assert.match((await summary.innerText()).trim(), /Explore/i);
  await page.locator('#settingsBtn').click();
  await page.locator('#settingsView .gc-settings-rebuild').waitFor({ state: 'visible' });
  const style = await page.locator('#settingsView .gc-settings-note').evaluate((node) => ({ background: getComputedStyle(node).backgroundImage, color: getComputedStyle(node).color }));
  assert.notEqual(style.background, 'none', `${browser}: Settings note must use dark surface styling`);
  assert.doesNotMatch(style.background, /rgb\(255, 255, 255\)/, `${browser}: Settings must not regress to white blocks`);
  assert.equal(await page.locator('#settingsView .gc-settings-note p').evaluate((node) => getComputedStyle(node).opacity), '1');
  await capture(page, browser, 'settings-dark');
}

async function assertWellness(page, browser) {
  await page.locator('.nav-btn[data-view="wellness-boost"]').click();
  await page.locator('#wellness-boostView .wellness-boost-library-view').waitFor({ state: 'visible' });
  const tiles = page.locator('.wellness-session-tile');
  assert.equal(await tiles.count(), 4);
  const layout = await tiles.evaluateAll((nodes) => nodes.map((node) => { const rect = node.getBoundingClientRect(); return { left: rect.left, width: rect.width }; }));
  assert.ok(Math.max(...layout.map((item) => item.width)) - Math.min(...layout.map((item) => item.width)) <= 1, `${browser}: Wellness tiles must align to equal widths`);
  assert.ok(Math.max(...layout.map((item) => item.left)) - Math.min(...layout.map((item) => item.left)) <= 1, `${browser}: mobile Wellness tiles must share one grid edge`);
  const centers = await page.evaluate(() => {
    const hero = document.querySelector('.living-wellness-hero')?.getBoundingClientRect();
    const orb = document.querySelector('.living-breathing-orb')?.getBoundingClientRect();
    return hero && orb ? { hero: hero.left + hero.width / 2, orb: orb.left + orb.width / 2 } : null;
  });
  assert.ok(centers && Math.abs(centers.hero - centers.orb) <= 5, `${browser}: breathing orb must align with sanctuary on mobile`);
  await capture(page, browser, 'wellness-aligned');
}

async function startAndAssertTimer(page, browser, activityName) {
  await page.locator('#quickAddBtn').click();
  await page.locator('#loggerHost .gc-add-activity-sheet').waitFor({ state: 'visible' });
  await page.locator('.logger-mode-choice').filter({ hasText: 'Start now' }).click();
  await page.locator('#loggerActivityQuery').fill(activityName);
  const option = page.locator('.logger-activity-option').filter({ hasText: activityName }).first();
  await option.waitFor({ state: 'visible' });
  await option.click();
  await page.locator('#loggerDuration').fill('30');
  await page.locator('#loggerSaveButton').click();

  const session = page.locator('#activeSessionHost .gc-active-session');
  await session.waitFor({ state: 'visible', timeout: 15000 });
  assert.match(await session.innerText(), new RegExp(activityName));
  const clock = page.locator('[data-session-elapsed]');
  const first = await clock.innerText();
  await page.waitForTimeout(1200);
  const second = await clock.innerText();
  assert.notEqual(second, first, `${browser}: live timer must visibly advance`);
  await capture(page, browser, 'live-timer');

  // Finish through the real factual Done path instead of cancelling the sheet.
  // This proves the timer lifecycle closes and prevents one browser engine from
  // leaving an active session behind for the next engine in the shared local D1.
  await page.locator('[data-session-done]').click();
  const doneSheet = page.locator('#loggerHost .gc-add-activity-sheet');
  await doneSheet.waitFor({ state: 'visible' });
  assert.equal(await page.locator('input[name="loggerEntryMode"][value="done"]').isChecked(), true);
  assert.ok(Number(await page.locator('#loggerDuration').inputValue()) >= 1);
  await page.locator('#loggerSaveButton').click();
  await doneSheet.waitFor({ state: 'hidden', timeout: 15000 });
  await session.waitFor({ state: 'hidden', timeout: 15000 });
}

async function assertRecovery(page, browser) {
  await load(page);
  await notBuried(page, '#todayDirectionTitle', browser, 'Progress direction');
  await notBuried(page, '#todayView [data-wellbeing-state]', browser, 'Wellbeing state');
  await notBuried(page, '#journalPreview', browser, 'Journal');
  await assertTomorrow(page, browser);

  const explore = page.locator('#topMore > summary');
  assert.match(await explore.innerText(), /Explore/i);
  const box = await explore.boundingBox();
  assert.ok(box?.width >= 78, `${browser}: Explore must stay labeled on mobile`);

  await page.locator('#quickAddBtn').click();
  await page.locator('#loggerHost .gc-add-activity-sheet').waitFor({ state: 'visible' });
  assert.equal(await page.locator('input[name="loggerEntryMode"][value="done"]').isChecked(), true);
  await page.keyboard.press('Escape');

  await page.locator('.nav-btn[data-view="plan"]').click();
  await page.locator('#planView .gc-plan-working').waitFor({ state: 'visible' });
  await assertGoalTiles(page, browser);
  const activityName = await createActivity(page, browser);
  await capture(page, browser, 'plan-live-tiles');

  await page.locator('#planView button[data-plan-scroll="commitmentEditor"]').first().click();
  const commitment = page.locator('#commitmentEditor');
  await commitment.waitFor({ state: 'visible' });
  assert.equal(await commitment.evaluate((node) => node.open), true);
  assert.equal(await page.locator('#plan-module-capacity').evaluate((node) => node.open), true);
  assert.equal(await page.locator('#planView .plan-loading').count(), 0);

  await assertSettingsContrast(page, browser);
  await assertWellness(page, browser);
  await startAndAssertTimer(page, browser, activityName);
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
