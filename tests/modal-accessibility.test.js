import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const modal=await readFile(new URL('../public/js/platform/modal.js',import.meta.url),'utf8');
const sheetsCss=await readFile(new URL('../public/css/module-sheets.css',import.meta.url),'utf8');
const planCss=await readFile(new URL('../public/css/daily-plan.css',import.meta.url),'utf8');
const journalCss=await readFile(new URL('../public/css/journal.css',import.meta.url),'utf8');
const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');

test('generic modal controller traps focus closes with Escape and restores focus',()=>{
  assert.match(modal,/event\.key === 'Escape'|event\.key==='Escape'/);
  assert.match(modal,/event\.key !== 'Tab'|event\.key!=='Tab'/);
  assert.match(modal,/event\.shiftKey/);
  assert.match(modal,/previousFocus/);
  assert.match(modal,/previousFocus\.focus\(\)/);
});

test('modal controller isolates background and excludes hidden or inert controls',()=>{
  assert.match(modal,/\[hidden\],\[aria-hidden="true"\],\[inert\]/);
  assert.match(modal,/element\.inert = true/);
  assert.match(modal,/restoreBackground/);
  assert.match(modal,/setAttribute\('aria-modal', 'true'\)/);
  assert.match(modal,/setAttribute\('tabindex', '-1'\)/);
  assert.match(modal,/gc-modal-open/);
});

test('mobile module sheets and frequent controls use large touch targets',()=>{
  assert.match(sheetsCss,/min-height:\s*44px/);
  assert.match(planCss,/min-height:\s*44px/);
  assert.match(journalCss,/min-height:\s*44px/);
});

test('primary mobile navigation remains unchanged while Journal is secondary',()=>{
  for(const label of ['Today','Plan','Progress','Insights'])assert.match(index,new RegExp(`>${label}<|<b>${label}</b>`));
  assert.match(index,/id="quickAddBtn"/);
  assert.match(index,/id="journalBtn"/);
  assert.doesNotMatch(index,/data-view="journal" class="nav-btn/);
});
