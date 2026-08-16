import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.GC_E2E_BASE_URL || 'http://127.0.0.1:8787';
const SCREENSHOT_DIR = process.env.GC_E2E_SCREENSHOT_DIR || '';
const BROWSERS = [['Chromium', chromium], ['WebKit', webkit]];

async function shot(page, browser, state) {
  if (!SCREENSHOT_DIR) return;
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${browser.toLowerCase()}-375-breath-${state}.png`, fullPage: false });
}

async function ringWidth(guide) {
  return guide.locator('i').evaluate((node) => node.getBoundingClientRect().width);
}

async function waitPhase(page, phase, timeout) {
  await page.waitForFunction((wanted) => document.querySelector('[data-wb-breath-start]')?.dataset.breathPhase === wanted, phase, { timeout });
}

async function runBreathingVisual(page, browser) {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  assert.ok(response?.ok());
  await page.locator('#todayView .gc-today-rebuild').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('.nav-btn[data-view="wellness-boost"]').click();
  const sanctuary = page.locator('.living-wellness-hero .living-breathing-orb');
  await sanctuary.waitFor({ state: 'visible' });
  await sanctuary.click();

  const guide = page.locator('[data-wb-breath-start]');
  await guide.waitFor({ state: 'visible' });
  const sound = page.locator('[data-wb-breath-sound]');
  if ((await sound.getAttribute('aria-pressed')) === 'true') await sound.click();

  const targetBefore = await guide.boundingBox();
  const ready = await ringWidth(guide);
  await shot(page, browser, 'ready');

  await guide.click();
  await waitPhase(page, 'inhale', 1500);
  await page.waitForTimeout(1900);
  const inhaleMid = await ringWidth(guide);
  await shot(page, browser, 'inhale-mid');
  assert.ok(inhaleMid >= ready * 1.35, `${browser}: ring must visibly open during inhale; ready=${ready}, mid=${inhaleMid}`);

  await waitPhase(page, 'hold-in', 3500);
  const open = await ringWidth(guide);
  await shot(page, browser, 'open-hold');
  assert.ok(open >= inhaleMid * 1.18, `${browser}: ring must finish opening before hold; mid=${inhaleMid}, open=${open}`);

  await waitPhase(page, 'exhale', 3500);
  await page.waitForTimeout(3900);
  const exhaleMid = await ringWidth(guide);
  await shot(page, browser, 'exhale-mid');
  assert.ok(exhaleMid <= open * .82, `${browser}: ring must visibly close during exhale; open=${open}, mid=${exhaleMid}`);

  await waitPhase(page, 'hold-out', 5200);
  const closed = await ringWidth(guide);
  await shot(page, browser, 'closed-hold');
  assert.ok(closed <= exhaleMid * .82, `${browser}: ring must finish closing before final hold; mid=${exhaleMid}, closed=${closed}`);
  assert.ok(open >= closed * 2.2, `${browser}: open/closed contrast must be unmistakable; open=${open}, closed=${closed}`);

  const targetAfter = await guide.boundingBox();
  assert.ok(targetBefore && targetAfter && Math.abs(targetBefore.width - targetAfter.width) <= 1 && Math.abs(targetBefore.height - targetAfter.height) <= 1, `${browser}: touch target must stay fixed while ring breathes`);
  await page.locator('[data-wb-breath-end]').click();
}

for (const [browser, type] of BROWSERS) {
  test(`${browser} visibly opens and closes the breathing ring`, async () => {
    const instance = await type.launch();
    try {
      const context = await instance.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await runBreathingVisual(page, browser);
      await context.close();
    } finally {
      await instance.close();
    }
  });
}
