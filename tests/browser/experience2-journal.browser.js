import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.GC_E2E_BASE_URL || 'http://127.0.0.1:8787/experience/2/';
const BROWSERS = [['Chromium', chromium], ['WebKit', webkit]];
const CASE_FILTER = String(process.env.GC_E2E_CASE || '').trim().toLowerCase();

function caseKey(browserName, viewport) {
  return `${browserName.toLowerCase()}-${viewport === '375px' ? '375' : 'desktop'}`;
}

function shouldRun(browserName, viewport) {
  return !CASE_FILTER || CASE_FILTER === caseKey(browserName, viewport);
}

function dateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function openJournal(page, viewport) {
  const root = viewport === '375px' ? '.mobile-dock' : '.desktop-rail';
  await page.locator(`${root} [data-view="reflect"]`).click();
  await page.locator('.reflect-view').waitFor({ state: 'visible' });
  await page.locator('[data-reflect-open-journal]').first().click();
}

async function archivedEntry(page, text) {
  const archive = page.locator('.journal-archive');
  await archive.waitFor({ state: 'visible' });
  if ((await archive.getAttribute('open')) === null) await archive.locator('summary').click();
  const entry = archive.locator('.journal-entry', { hasText: text });
  await entry.waitFor({ state: 'visible' });
  return entry;
}

async function noOverflow(page, label) {
  const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
  assert.ok(size.document <= size.viewport + 1, `${label}: Journal must not overflow horizontally; ${JSON.stringify(size)}`);
}

async function applyFilters(page, query, date) {
  await page.locator('#journalSearch').fill(query);
  await page.locator('#journalDateFilter').fill(date);
  await page.locator('[data-journal-filter]').evaluate(form => form.requestSubmit());
}

async function assertJournalEntryRemovedFromServer(page, id, token, date, label) {
  const result = await page.evaluate(async ({ id, token, date }) => {
    const query = new URLSearchParams({ q: token, from: date, to: date, limit: '100', include_archived: '1' });
    const response = await fetch(`/api/v1/journal?${query}`, { cache: 'no-store' });
    let data = null;
    try { data = await response.json(); } catch {}
    return { ok: response.ok, status: response.status, items: data?.items || [] };
  }, { id, token, date });
  assert.equal(result.ok, true, `${label}: Journal server verification must succeed; HTTP ${result.status}`);
  assert.equal(result.items.some(item => Number(item.id) === id), false, `${label}: permanently removed Journal entry must be absent from server state`);
}

async function exercise(page, browserName, viewport) {
  await page.addInitScript(() => localStorage.setItem('growth-compass:preview2:e2:tutorial-state-v1', 'complete'));
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  assert.ok(response?.ok());
  await openJournal(page, viewport);

  const view = page.locator('.journal-view');
  await view.waitFor({ state: 'visible' });
  assert.match(await view.innerText(), /Write first/);
  assert.equal(await page.locator('[data-return-parent="reflect"]').count(), 1, `${browserName} ${viewport}: Journal must retain a clear return to Reflect`);
  assert.equal(await page.locator('#journalDateFilter').count(), 1, `${browserName} ${viewport}: Journal must expose a compact date filter`);

  const token = `${browserName}-${viewport}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const createdBody = `Private reflection ${token}`;
  const editedBody = `${createdBody} edited`;
  const today = dateKey(0);
  const yesterday = dateKey(-1);

  await page.locator('[data-journal-new]').click();
  let dialog = page.locator('[data-journal-dialog]');
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await page.locator('body').evaluate(node => node.classList.contains('journal-modal-open')), true, `${browserName} ${viewport}: Journal editor must lock background scroll`);
  assert.ok(await dialog.getByText(/Saving one does not create Progress/).isVisible());
  await dialog.locator('input[name="title"]').fill(`Journal ${token}`);
  await dialog.locator('textarea[name="body"]').fill(createdBody);
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await page.locator('body').evaluate(node => node.classList.contains('journal-modal-open')), false, `${browserName} ${viewport}: Journal editor must release background scroll`);

  let entry = page.locator('.journal-entry', { hasText: createdBody }).filter({ has: page.locator('[data-journal-archive]') });
  await entry.waitFor({ state: 'visible', timeout: 10_000 });
  await noOverflow(page, `${browserName} ${viewport} create`);

  await entry.locator('[data-journal-edit]').click();
  dialog = page.locator('[data-journal-dialog]');
  await dialog.waitFor({ state: 'visible' });
  await dialog.locator('textarea[name="body"]').fill(editedBody);
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached' });
  entry = page.locator('.journal-entry', { hasText: editedBody }).filter({ has: page.locator('[data-journal-archive]') });
  await entry.waitFor({ state: 'visible', timeout: 10_000 });

  await applyFilters(page, token, today);
  entry = page.locator('.journal-entry', { hasText: editedBody }).filter({ has: page.locator('[data-journal-archive]') });
  await entry.waitFor({ state: 'visible' });
  assert.equal(await page.locator('#journalSearch').inputValue(), token);
  assert.equal(await page.locator('#journalDateFilter').inputValue(), today);

  await applyFilters(page, token, yesterday);
  await page.locator('.journal-empty').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.journal-entry', { hasText: editedBody }).count(), 0, `${browserName} ${viewport}: text search and date filter must combine`);

  await applyFilters(page, token, today);
  entry = page.locator('.journal-entry', { hasText: editedBody }).filter({ has: page.locator('[data-journal-archive]') });
  await entry.waitFor({ state: 'visible' });

  await entry.locator('[data-journal-archive]').click();
  await entry.waitFor({ state: 'detached' });
  let archived = await archivedEntry(page, editedBody);
  assert.match(await archived.innerText(), /Restore/);

  await archived.locator('[data-journal-restore]').click();
  await archived.waitFor({ state: 'detached' });
  entry = page.locator('.journal-entry', { hasText: editedBody }).filter({ has: page.locator('[data-journal-archive]') });
  await entry.waitFor({ state: 'visible' });

  await entry.locator('[data-journal-archive]').click();
  await entry.waitFor({ state: 'detached' });
  archived = await archivedEntry(page, editedBody);
  const removedId = Number(await archived.getAttribute('data-journal-archived-entry'));
  assert.ok(Number.isInteger(removedId) && removedId > 0, `${browserName} ${viewport}: archived Journal entry must expose its server id`);
  const removeButton = archived.locator('[data-journal-remove]');
  await removeButton.focus();
  await removeButton.click();
  const removeDialog = page.locator('.journal-delete-dialog');
  await removeDialog.waitFor({ state: 'visible' });
  assert.equal(await removeDialog.getAttribute('role'), 'dialog');
  assert.match(await removeDialog.innerText(), /cannot be undone/i);
  assert.equal(await page.locator('body').evaluate(node => node.classList.contains('journal-modal-open')), true);
  await page.keyboard.press('Escape');
  await removeDialog.waitFor({ state: 'detached' });
  assert.equal(await page.locator('body').evaluate(node => node.classList.contains('journal-modal-open')), false);
  assert.equal(await removeButton.evaluate(node => document.activeElement === node), true, `${browserName} ${viewport}: closing permanent-removal dialog must restore focus`);

  await removeButton.click();
  await page.locator('.journal-delete-dialog').waitFor({ state: 'visible' });
  await page.locator('[data-journal-remove-confirm]').click();
  await page.locator('.journal-delete-dialog').waitFor({ state: 'detached' });
  assert.equal(await page.locator('body').evaluate(node => node.classList.contains('journal-modal-open')), false);
  await archived.waitFor({ state: 'detached' });
  await assertJournalEntryRemovedFromServer(page, removedId, token, today, `${browserName} ${viewport}`);
  await noOverflow(page, `${browserName} ${viewport} remove`);
}

for (const [browserName, browserType] of BROWSERS) {
  if (shouldRun(browserName, 'desktop')) {
    test(`${browserName} desktop accepts Experience 2 Journal full lifecycle under Reflect`, async () => {
      const browser = await browserType.launch();
      try {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        await exercise(await context.newPage(), browserName, 'desktop');
        await context.close();
      } finally {
        await browser.close();
      }
    });
  }

  if (shouldRun(browserName, '375px')) {
    test(`${browserName} 375px accepts Experience 2 Journal full lifecycle under Reflect`, async () => {
      const browser = await browserType.launch();
      try {
        const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
        await exercise(await context.newPage(), browserName, '375px');
        await context.close();
      } finally {
        await browser.close();
      }
    });
  }
}
