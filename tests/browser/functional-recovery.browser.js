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
  for (const href of ['/css/navigation-shell.css', '/css/functional-recovery.css', '/css/motion-system.css', '/css/modules/wellness-breathing.css', '/css/modules/activities.css']) {
    await page.locator(`link[href="${href}"]`).waitFor({ state: 'attached' });
  }
  await page.locator('#todayView .gc-today-rebuild').waitFor({ state: 'visible', timeout: 15000 });
}

async function assertToday(page, browser) {
  for (const [selector, label] of [['#todayDirectionTitle', 'Progress direction'], ['#todayView [data-wellbeing-state]', 'Wellbeing state'], ['#journalPreview', 'Journal']]) {
    const node = page.locator(selector);
    await node.waitFor({ state: 'visible' });
    assert.equal(await node.evaluate((element) => Boolean(element.closest('details.gc-today-more'))), false, `${browser}: ${label} must stay visible on Today`);
  }
  const stateCard = page.locator('#todayView .state-card').first();
  const stateStyle = await stateCard.evaluate((node) => ({ background: getComputedStyle(node).backgroundColor, color: getComputedStyle(node).color }));
  assert.notEqual(stateStyle.background, 'rgb(255, 255, 255)');
  assert.notEqual(stateStyle.color, 'rgb(23, 32, 43)');
  await page.locator('#todayView [data-open-wellbeing-energy]').click();
  const energy = page.locator('#todayView [data-wellbeing-details]');
  await energy.waitFor({ state: 'visible' });
  assert.equal(await energy.evaluate((node) => node.open), true);
  assert.equal(await page.locator('#todayView [data-wellbeing-energy-cell]').count(), 36);
  await capture(page, browser, 'today-energy-map');
  await energy.evaluate((node) => { node.open = false; });
  const journal = page.locator('#journalPreview h2');
  assert.ok((await journal.boundingBox())?.width >= 220);
  assert.equal(await journal.evaluate((node) => getComputedStyle(node).wordBreak), 'normal');
  const pseudo = await page.locator('#topMore .top-more-label').evaluate((node) => getComputedStyle(node, '::before').content);
  assert.ok(['none', 'normal', '""'].includes(pseudo));
  const tomorrow = page.locator('.gc-tomorrow-plan');
  await tomorrow.locator(':scope > summary').click();
  await tomorrow.locator('.gc-tomorrow-plan-body').waitFor({ state: 'visible' });
  await tomorrow.locator('[data-plan-capture="planned"][data-plan-date]').waitFor({ state: 'visible' });
  await capture(page, browser, 'tomorrow-open');
  const explore = page.locator('#topMore > summary');
  assert.match(await explore.innerText(), /Explore/i);
  const box = await explore.boundingBox();
  assert.ok(box?.width >= 78 && box.width <= 96);
}

async function assertGoalTiles(page, browser) {
  const tile = page.locator('#planView .gc-plan-goal-focus').first();
  await tile.waitFor({ state: 'visible' });
  assert.equal(await tile.evaluate((node) => node.tagName), 'BUTTON');
  assert.equal(await tile.locator('button').count(), 0);
  assert.doesNotMatch(await tile.innerText(), /\bOpen\b/);
  assert.ok((await tile.getAttribute('class')).includes('gc-live-tile'));
  await tile.focus();
  assert.notEqual(await tile.evaluate((node) => getComputedStyle(node).outlineStyle), 'none', `${browser}: Goal tile needs visible focus`);
  const goals = page.locator('#plan-module-goals');
  if (await goals.count()) {
    if (!(await goals.evaluate((node) => node.open))) await goals.locator(':scope > summary').click();
    const addGoal = page.locator('#goalEditor > summary');
    await addGoal.waitFor({ state: 'visible' });
    assert.notEqual(await addGoal.evaluate((node) => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)');
  }
}

async function createActivity(page, browser) {
  await page.locator('#planView button[data-plan-scroll="plan-module-activities"]').first().click();
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

async function assertPlan(page, browser) {
  await page.locator('.nav-btn[data-view="plan"]').click();
  await page.locator('#planView .gc-plan-working').waitFor({ state: 'visible' });
  await assertGoalTiles(page, browser);
  const activityName = await createActivity(page, browser);
  await capture(page, browser, 'plan-live-tiles');
  await page.locator('#planView button[data-plan-scroll="commitmentEditor"]').first().click();
  const commitment = page.locator('#commitmentEditor');
  await commitment.waitFor({ state: 'visible' });
  assert.equal(await commitment.evaluate((node) => node.open), true);
  await page.locator('#planView button[data-plan-scroll="capacityPanel"]').first().click();
  const capacity = page.locator('#capacityPanel');
  await capacity.waitFor({ state: 'visible' });
  assert.equal(await capacity.evaluate((node) => Boolean(node.closest('details')?.open)), true);
  assert.equal(await page.locator('#planView .plan-loading').count(), 0);
  return activityName;
}

async function assertSettings(page, browser) {
  await page.locator('#topMore > summary').click();
  await page.locator('#settingsBtn').click();
  await page.locator('#settingsView .gc-settings-rebuild').waitFor({ state: 'visible' });
  const note = page.locator('#settingsView .gc-settings-note');
  const style = await note.evaluate((node) => ({ background: getComputedStyle(node).backgroundImage, opacity: getComputedStyle(node.querySelector('p')).opacity }));
  assert.notEqual(style.background, 'none');
  assert.doesNotMatch(style.background, /rgb\(255, 255, 255\)/);
  assert.equal(style.opacity, '1');
  await capture(page, browser, 'settings-dark');
}

async function assertWellness(page, browser) {
  await page.locator('.nav-btn[data-view="wellness-boost"]').click();
  await page.locator('#wellness-boostView .wellness-boost-library-view').waitFor({ state: 'visible' });
  const tiles = page.locator('.wellness-session-tile');
  assert.equal(await tiles.count(), 4);
  const layout = await tiles.evaluateAll((nodes) => nodes.map((node) => { const rect = node.getBoundingClientRect(); return { left: rect.left, width: rect.width }; }));
  assert.ok(Math.max(...layout.map((item) => item.width)) - Math.min(...layout.map((item) => item.width)) <= 1);
  assert.ok(Math.max(...layout.map((item) => item.left)) - Math.min(...layout.map((item) => item.left)) <= 1);
  const orb = page.locator('.living-wellness-hero .living-breathing-orb');
  const style = await orb.evaluate((node) => ({ animation: getComputedStyle(node).animationName, transform: getComputedStyle(node).transform, inner: getComputedStyle(node.querySelector('i')).animationName, image: getComputedStyle(node).backgroundImage, color: getComputedStyle(node).backgroundColor }));
  assert.equal(style.animation, 'none');
  assert.ok(style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)');
  assert.notEqual(style.inner, 'none');
  assert.notEqual(style.color, 'rgb(255, 255, 255)');
  assert.notEqual(style.image, 'none');
  const centers = await page.evaluate(() => {
    const hero = document.querySelector('.living-wellness-hero')?.getBoundingClientRect();
    const breathing = document.querySelector('.living-wellness-hero .living-breathing-orb')?.getBoundingClientRect();
    return hero && breathing ? { hero: hero.left + hero.width / 2, orb: breathing.left + breathing.width / 2 } : null;
  });
  assert.ok(centers && Math.abs(centers.hero - centers.orb) <= 5);
  await capture(page, browser, 'wellness-aligned');
  await orb.click();
  await page.locator('#wellness-boostView .wellness-boost-player-view').waitFor({ state: 'visible' });
  const guide = page.locator('[data-wb-breath-start]');
  const sound = page.locator('[data-wb-breath-sound]');
  if ((await sound.getAttribute('aria-pressed')) === 'true') await sound.click();
  const before = await guide.boundingBox();
  await guide.click();
  await page.waitForFunction(() => document.querySelector('[data-wb-breath-start]')?.dataset.breathPhase === 'inhale');
  assert.ok(Math.abs(parseFloat(await guide.locator('i').evaluate((node) => getComputedStyle(node).transitionDuration)) - 4) <= .2);
  await page.waitForTimeout(300);
  const during = await guide.boundingBox();
  assert.ok(before && during && Math.abs(before.width - during.width) <= 1 && Math.abs(before.height - during.height) <= 1);
  await page.waitForFunction(() => document.querySelector('[data-wb-breath-start]')?.dataset.breathPhase === 'exhale', null, { timeout: 9000 });
  assert.ok(Math.abs(parseFloat(await guide.locator('i').evaluate((node) => getComputedStyle(node).transitionDuration)) - 8) <= .2);
  await page.locator('[data-wb-breath-end]').click();
  await page.locator('[data-wb-back]').click();
}

async function assertTimer(page, browser, activityName) {
  await page.locator('#quickAddBtn').click();
  await page.locator('#loggerHost .gc-add-activity-sheet').waitFor({ state: 'visible' });
  await page.locator('.logger-mode-choice').filter({ hasText: 'Start now' }).click();
  await page.locator('#loggerActivityQuery').fill(activityName);
  await page.locator('.logger-activity-option').filter({ hasText: activityName }).first().click();
  await page.locator('#loggerDuration').fill('30');
  await page.locator('#loggerSaveButton').click();
  const session = page.locator('#activeSessionHost .gc-active-session');
  await session.waitFor({ state: 'visible', timeout: 15000 });
  const clock = page.locator('[data-session-elapsed]');
  const first = await clock.innerText();
  await page.waitForTimeout(1200);
  assert.notEqual(await clock.innerText(), first, `${browser}: live timer must visibly advance`);
  await capture(page, browser, 'live-timer');
  await page.locator('[data-session-done]').click();
  const done = page.locator('#loggerHost .gc-add-activity-sheet');
  await done.waitFor({ state: 'visible' });
  assert.equal(await page.locator('input[name="loggerEntryMode"][value="done"]').isChecked(), true);
  assert.ok(Number(await page.locator('#loggerDuration').inputValue()) >= 1);
  await page.locator('#loggerSaveButton').click();
  await done.waitFor({ state: 'hidden', timeout: 15000 });
  await session.waitFor({ state: 'hidden', timeout: 15000 });
}

async function assertRecovery(page, browser) {
  await load(page);
  await assertToday(page, browser);
  await page.locator('#quickAddBtn').click();
  await page.locator('#loggerHost .gc-add-activity-sheet').waitFor({ state: 'visible' });
  assert.equal(await page.locator('input[name="loggerEntryMode"][value="done"]').isChecked(), true);
  await page.keyboard.press('Escape');
  const activityName = await assertPlan(page, browser);
  await assertSettings(page, browser);
  await assertWellness(page, browser);
  await assertTimer(page, browser, activityName);
}

for (const [browserName, browserType] of BROWSERS) {
  test(`${browserName} 375px accepts functional recovery`, async () => {
    const browser = await browserType.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
      await assertRecovery(await context.newPage(), browserName);
      await context.close();
    } finally {
      await browser.close();
    }
  });
}
