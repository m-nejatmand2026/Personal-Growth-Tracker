import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const view=await readFile(new URL('../public/experience/2/js/views/journal.js',import.meta.url),'utf8');
const capability=await readFile(new URL('../public/experience/2/js/capabilities/journal.js',import.meta.url),'utf8');
const app=await readFile(new URL('../public/experience/2/js/app.js',import.meta.url),'utf8');
const html=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/journal.css',import.meta.url),'utf8');
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');

test('Experience 2 Journal replaces the placeholder with the independent Journal API',()=>{
  assert.match(app,/loadJournal,renderJournal,bindJournal/);
  assert.match(app,/current==='journal'/);
  assert.match(capability,/\/v1\/journal\?/);
  assert.match(capability,/api\.post\('\/v1\/journal'/);
  assert.match(capability,/api\.put\(`\/v1\/journal\/\$\{id\}`/);
  assert.match(capability,/api\.delete\(`\/v1\/journal\/\$\{id\}`/);
  assert.doesNotMatch(view,/\/v1\/progress|\/v1\/insights|\/v1\/wellbeing/);
});

test('Journal keeps writing first and metadata optional',()=>{
  assert.match(view,/Write first\. Prompts, tags, and structure stay optional/);
  assert.match(view,/One sentence is enough/);
  assert.match(view,/Title <small>optional/);
  assert.match(view,/Tags <small>optional/);
  for(const type of ['Free entry','Morning','Evening','Reflection'])assert.ok(view.includes(type));
});

test('Journal explicitly preserves the private reflection boundary',()=>{
  assert.match(view,/Saving one does not create Progress, Insights, or Wellbeing evidence/);
  assert.doesNotMatch(view,/progressCapability|wellbeingCapability|insightsCapability/);
  assert.match(view,/There is no streak and no score/);
});

test('Journal provides search create edit and delete through its own capability',()=>{
  assert.match(view,/data-journal-search/);
  assert.match(view,/journalCapability\.create\(payload\)/);
  assert.match(view,/journalCapability\.update\(id,payload\)/);
  assert.match(view,/journalCapability\.delete\(id\)/);
  assert.match(view,/model\.items\.find/);
});

test('Journal editor is modal keyboard-safe and restores focus',()=>{
  assert.match(view,/role="dialog" aria-modal="true" aria-labelledby="journalEditorTitle"/);
  assert.match(view,/event\.key==='Escape'/);
  assert.match(view,/event\.key!=='Tab'/);
  assert.match(view,/host\.onkeydown=null/);
  assert.match(view,/opener instanceof HTMLElement/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/@media\(max-width:760px\)/);
});

test('Journal assets are isolated and precached for Experience 2',()=>{
  assert.match(html,/\/experience\/2\/css\/journal\.css/);
  for(const asset of ['/experience/2/css/journal.css','/experience/2/js/views/journal.js','/experience/2/js/capabilities/journal.js'])assert.ok(sw.includes(`'${asset}'`),`${asset} must be precached`);
  assert.match(sw,/growth-compass-preview2-e2-v\d+/);
  assert.doesNotMatch(sw,/growth-compass-preview1|experience\/1/);
});
