import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
async function text(path){return readFile(new URL(path,root),'utf8');}

test('Experience 2 exposes the growth mental model instead of feature-module primary navigation',async()=>{
  const html=await text('public/experience/2/index.html');
  for(const label of ['Today','Compass','Patterns','Reflect'])assert.match(html,new RegExp(`>${label}<`));
  for(const view of ['today','compass','patterns','reflect'])assert.match(html,new RegExp(`data-view="${view}"[^>]*data-primary-nav`));
  for(const legacy of ['plan','goals','schedule','progress','insights','journal'])assert.doesNotMatch(html,new RegExp(`data-view="${legacy}"[^>]*data-primary-nav`),`${legacy} must remain a capability beneath the growth composition rather than a primary destination`);
  assert.match(html,/data-open-add/);
});

test('Experience 2 visual foundation is warm matte with a materially dark dark theme',async()=>{
  const css=await text('public/experience/2/css/foundation.css');
  assert.match(css,/--gc-canvas:#f3f0e8/);
  assert.match(css,/html\[data-theme="dark"\]\{--gc-canvas:#151714/);
  assert.match(css,/--font-editorial:Georgia/);
  assert.doesNotMatch(css,/radial-gradient/i);
  assert.doesNotMatch(css,/backdrop-filter/i);
});

test('Experience 2 authentication follows the editorial system and does not restore glassmorphism',async()=>{
  const css=await text('public/experience/2/css/auth.css');
  assert.match(css,/font-family:var\(--font-editorial\)/);
  assert.match(css,/background:var\(--gc-canvas\)/);
  assert.match(css,/border:1px solid var\(--gc-border-strong\)/);
  assert.doesNotMatch(css,/backdrop-filter/i);
  assert.doesNotMatch(css,/radial-gradient/i);
  assert.doesNotMatch(css,/linear-gradient/i);
  assert.doesNotMatch(css,/saturate\(/i);
});

test('Experience 2 PWA identity no longer advertises the retired Ambient Luxury direction',async()=>{
  const manifest=await text('public/experience/2/manifest.webmanifest');
  const selector=await text('public/selector/index.html');
  assert.doesNotMatch(manifest,/Ambient Luxury/i);
  assert.doesNotMatch(selector,/Ambient Luxury/i);
  assert.match(manifest,/Connect what matters with what you do/i);
});

test('Preview 2 guarded deploy captures rollback identity and D1 export before deployment',async()=>{
  const workflow=await text('.github/workflows/quality.yml');
  const backup=workflow.indexOf('Capture current Preview 2 rollback identity and D1 bookmark');
  const exportStep=workflow.indexOf('Export complete isolated Preview 2 D1 backup');
  const upload=workflow.indexOf('Upload recoverable pre-redesign Preview 2 backup');
  const migrate=workflow.indexOf('Apply only the explicitly authorized Preview 2 migration set');
  const deploy=workflow.indexOf('Deploy exact tested Preview 2 Worker only');
  assert.ok(backup>0&&exportStep>backup&&upload>exportStep,'backup identity, SQL export and artifact upload must all be present');
  assert.ok(upload<migrate,'backup must complete before any Preview 2 migration');
  assert.ok(migrate<deploy,'deployment remains after migration verification');
  assert.match(workflow,/preview2-ambient-luxury-2026-08-22/);
  assert.match(workflow,/retention-days: 90/);
});
