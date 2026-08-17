import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fallback=await readFile(new URL('../public/experience/2/js/modal-accessibility.js',import.meta.url),'utf8');
const html=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');

test('Experience 2 provides a document-level Escape fallback for the pre-focus modal window',()=>{assert.match(fallback,/document\.addEventListener\('keydown'/);assert.match(fallback,/event\.key!=='Escape'\|\|event\.defaultPrevented/);assert.match(fallback,/#overlayHost/);assert.match(fallback,/\[role="dialog"\]\[aria-modal="true"\]/);assert.match(fallback,/button\[aria-label\^="Close"\]/);assert.match(fallback,/event\.preventDefault\(\);close\.click\(\)/);});
test('modal Escape fallback stays a separate shell accessibility boundary',()=>{assert.match(html,/\/experience\/2\/js\/modal-accessibility\.js/);assert.ok(html.indexOf('/experience/2/js/modal-accessibility.js')<html.indexOf('/experience/2/js/app.js'));assert.doesNotMatch(fallback,/goal|journal|activity|schedule|logger|today/i);});
test('offline Experience 2 shell includes the modal accessibility fallback',()=>{assert.match(sw,/growth-compass-preview2-e2-v\d+/);assert.match(sw,/\/experience\/2\/js\/modal-accessibility\.js/);});
