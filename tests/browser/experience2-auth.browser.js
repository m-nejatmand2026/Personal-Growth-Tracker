import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const APP_URL = process.env.GC_AUTH_E2E_BASE_URL || 'http://127.0.0.1:8788/experience/2/';
const ORIGIN = new URL(APP_URL).origin;
const PASSWORD = 'correct-horse-battery-staple-42';
const OWNER_EMAIL = 'owner@example.test';
const OWNER_MARKER = 'Owner auth browser isolation marker';
const SCREENSHOT_DIR = process.env.GC_E2E_SCREENSHOT_DIR || '';

function cookieFrom(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return values
    .flatMap((value) => String(value).split(/,(?=[^;,]+=)/g))
    .map((value) => value.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

async function api(path, { method = 'GET', body, cookie, origin = false } = {}) {
  const headers = new Headers();
  if (body !== undefined) headers.set('content-type', 'application/json');
  if (cookie) headers.set('cookie', cookie);
  if (origin) headers.set('origin', ORIGIN);
  const response = await fetch(`${ORIGIN}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual'
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  return { response, data, cookie: cookieFrom(response) };
}

async function screenshot(page, label) {
  if (!SCREENSHOT_DIR) return;
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/experience2-auth-${label}.png`, fullPage: true });
}

async function openGate(page) {
  const response = await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  assert.ok(response?.ok(), `auth page failed with ${response?.status()}`);
  await page.locator('.auth-shell').waitFor({ state: 'visible', timeout: 10_000 });
}

async function signIn(page, email) {
  await openGate(page);
  await page.locator('#authEmail').fill(email);
  await page.locator('#authPassword').fill(PASSWORD);
  await page.locator('#authEmailSubmit').click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('auth-gated') && Boolean(document.querySelector('[data-account-open]')), undefined, { timeout: 15_000 });
}

async function createAccount(page, { name, email }) {
  await openGate(page);
  await page.locator('[data-auth-mode="signup"]').click();
  await page.locator('#authName').fill(name);
  await page.locator('#authEmail').fill(email);
  await page.locator('#authPassword').fill(PASSWORD);
  await page.locator('#authEmailSubmit').click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('auth-gated') && Boolean(document.querySelector('[data-account-open]')), undefined, { timeout: 15_000 });
}

async function privateAreas(page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/v1/areas?include_archived=1', { credentials: 'same-origin' });
    const body = await response.json();
    return { status: response.status, items: body.items || [] };
  });
}

async function accountRole(page) {
  return String(await page.locator('.account-role').textContent()).trim().toLowerCase();
}

async function assertNoHorizontalOverflow(page, label) {
  const size = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth
  }));
  assert.ok(size.document <= size.viewport + 1, `${label} must not overflow horizontally; ${JSON.stringify(size)}`);
}

async function openDesktopAccount(page) {
  await page.locator('.desktop-rail [data-account-open]').click();
  await page.locator('.account-panel').waitFor({ state: 'visible' });
}

async function openMobileAccount(page) {
  const trigger = page.locator('.mobile-header-actions [data-account-open]');
  await trigger.waitFor({ state: 'visible' });
  await trigger.click();
  await page.locator('.account-panel').waitFor({ state: 'visible' });
}

before(async () => {
  const status = await api('/api/account/status');
  assert.equal(status.response.status, 200);
  assert.equal(status.data.mode, 'enforced');
  assert.equal(status.data.configured, true);
  assert.equal(status.data.providers.email, true);

  const owner = await api('/api/auth/sign-up/email', {
    method: 'POST',
    origin: true,
    body: { name: 'Owner', email: OWNER_EMAIL, password: PASSWORD }
  });
  assert.ok([200, 201].includes(owner.response.status), JSON.stringify(owner.data));
  assert.ok(owner.cookie, 'auth browser fixture owner should have a session');

  const marker = await api('/api/v1/areas', {
    method: 'POST',
    cookie: owner.cookie,
    body: { name: OWNER_MARKER }
  });
  assert.equal(marker.response.status, 201, JSON.stringify(marker.data));

  for (const email of ['webkit-browser@example.test', 'chromium-mobile@example.test', 'mobile-browser@example.test']) {
    const invite = await api('/api/account/invites', {
      method: 'POST',
      cookie: owner.cookie,
      body: { email }
    });
    assert.equal(invite.response.status, 201, JSON.stringify(invite.data));
  }
});

test('Chromium desktop accepts owner sign-in, invitation UI, tester onboarding and workspace separation', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    await signIn(page, OWNER_EMAIL);
    const ownerAreas = await privateAreas(page);
    assert.equal(ownerAreas.status, 200);
    assert.ok(ownerAreas.items.some((item) => item.name === OWNER_MARKER));

    await openDesktopAccount(page);
    assert.equal(await accountRole(page), 'owner');
    await page.locator('#accountInviteEmail').fill('chromium-browser@example.test');
    await page.locator('#accountInviteForm button[type="submit"]').click();
    await page.locator('#accountInviteList').getByText('chromium-browser@example.test').waitFor({ state: 'visible' });
    await page.locator('#accountSignOut').click();
    await page.locator('.auth-shell').waitFor({ state: 'visible', timeout: 10_000 });

    await page.locator('[data-auth-mode="signup"]').click();
    await page.locator('#authName').fill('Chromium Tester');
    await page.locator('#authEmail').fill('chromium-browser@example.test');
    await page.locator('#authPassword').fill(PASSWORD);
    await page.locator('#authEmailSubmit').click();
    await page.waitForFunction(() => !document.documentElement.classList.contains('auth-gated') && Boolean(document.querySelector('[data-account-open]')), undefined, { timeout: 15_000 });

    const testerAreas = await privateAreas(page);
    assert.equal(testerAreas.status, 200);
    assert.equal(testerAreas.items.some((item) => item.name === OWNER_MARKER), false);
    assert.deepEqual(testerAreas.items, []);

    await openDesktopAccount(page);
    assert.equal(await accountRole(page), 'tester');
    assert.equal(await page.locator('#accountInviteForm').count(), 0);
    assert.equal(await page.locator('#accountResetWorkspace').isVisible(), true);
    await screenshot(page, 'chromium-desktop-tester-account');
    await assertNoHorizontalOverflow(page, 'Chromium desktop auth/account');
    await context.close();
  } finally {
    await browser.close();
  }
});

test('WebKit desktop accepts invited tester account creation and clean workspace', async () => {
  const browser = await webkit.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await createAccount(page, { name: 'WebKit Tester', email: 'webkit-browser@example.test' });
    const areas = await privateAreas(page);
    assert.equal(areas.status, 200);
    assert.deepEqual(areas.items, []);
    await openDesktopAccount(page);
    assert.equal(await accountRole(page), 'tester');
    assert.equal(await page.locator('#accountResetWorkspace').isVisible(), true);
    await screenshot(page, 'webkit-desktop-tester-account');
    await assertNoHorizontalOverflow(page, 'WebKit desktop auth/account');
    await context.close();
  } finally {
    await browser.close();
  }
});

test('Chromium 375px keeps sign-up and private account controls phone-safe', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await createAccount(page, { name: 'Chromium Mobile Tester', email: 'chromium-mobile@example.test' });
    const areas = await privateAreas(page);
    assert.equal(areas.status, 200);
    assert.deepEqual(areas.items, []);
    await openMobileAccount(page);
    assert.equal(await accountRole(page), 'tester');
    assert.equal(await page.locator('#accountResetWorkspace').isVisible(), true);
    await assertNoHorizontalOverflow(page, 'Chromium 375px account panel');
    await screenshot(page, 'chromium-375-tester-account');
    await context.close();
  } finally {
    await browser.close();
  }
});

test('WebKit 375px keeps sign-up and private account controls phone-safe', async () => {
  const browser = await webkit.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await openGate(page);
    await assertNoHorizontalOverflow(page, 'WebKit 375px auth gate');
    await page.locator('[data-auth-mode="signup"]').click();
    await page.locator('#authName').fill('Mobile Tester');
    await page.locator('#authEmail').fill('mobile-browser@example.test');
    await page.locator('#authPassword').fill(PASSWORD);
    await page.locator('#authEmailSubmit').click();
    await page.waitForFunction(() => !document.documentElement.classList.contains('auth-gated') && Boolean(document.querySelector('[data-account-open]')), undefined, { timeout: 15_000 });
    const areas = await privateAreas(page);
    assert.deepEqual(areas.items, []);
    await openMobileAccount(page);
    assert.equal(await accountRole(page), 'tester');
    assert.equal(await page.locator('#accountResetWorkspace').isVisible(), true);
    await assertNoHorizontalOverflow(page, 'WebKit 375px account panel');
    await screenshot(page, 'webkit-375-tester-account');
    await context.close();
  } finally {
    await browser.close();
  }
});
