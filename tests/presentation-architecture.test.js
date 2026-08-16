import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const indexHtml = await readFile(new URL('public/index.html', root), 'utf8');
const designCss = await readFile(new URL('public/css/design-system.css', root), 'utf8');
const shellCss = await readFile(new URL('public/css/navigation-shell.css', root), 'utf8');
const screenshotRecoveryCss = await readFile(new URL('public/css/screenshot-recovery.css', root), 'utf8');
const journalCss = await readFile(new URL('public/css/journal.css', root), 'utf8');
const goalsCss = await readFile(new URL('public/css/modules/goals.css', root), 'utf8');
const wellbeingCss = await readFile(new URL('public/css/modules/wellbeing.css', root), 'utf8');
const wellbeingTodayCss = await readFile(new URL('public/css/modules/wellbeing-today-sanctuary.css', root), 'utf8');
const wellnessBreathingCss = await readFile(new URL('public/css/modules/wellness-breathing.css', root), 'utf8');
const accessibilityCss = await readFile(new URL('public/css/accessibility-regression.css', root), 'utf8');

const retiredPresentationFiles = [
  'public/css/ux-reset.css',
  'public/css/living-canvas.css',
  'public/css/figma-current.css',
  'public/css/figma-current-live.css',
  'public/css/figma-current-semantics.css',
  'public/css/product-polish.css'
];

function stylesheetIndex(path) {
  return indexHtml.indexOf(`href="${path}"`);
}

function runtimeStylesheets() {
  return [...indexHtml.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((match) => match[1]);
}

function importantCount(source) {
  return (source.match(/!important/g) || []).length;
}

test('retired presentation generations are physically absent and cannot return to runtime', async () => {
  for (const path of retiredPresentationFiles) {
    assert.doesNotMatch(indexHtml, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await assert.rejects(access(new URL(path, root)), undefined, `${path} must stay deleted`);
  }
});

test('runtime presentation follows foundation then design system then shell then composition then safeguards', () => {
  const design = stylesheetIndex('/css/design-system.css');
  const shell = stylesheetIndex('/css/navigation-shell.css');
  const rebuild = stylesheetIndex('/css/product-rebuild.css');
  const pages = stylesheetIndex('/css/product-rebuild-pages.css');
  const motion = stylesheetIndex('/css/motion-system.css');
  const accessibility = stylesheetIndex('/css/accessibility-regression.css');
  assert.ok(design >= 0 && shell > design && rebuild > shell && pages > rebuild && motion > pages && accessibility > motion);
  assert.equal(runtimeStylesheets().at(-1), '/css/accessibility-regression.css', 'accessibility safeguards must remain the final stylesheet');
});

test('canonical design system owns theme tokens instead of composition sheets', () => {
  assert.match(designCss, /color-scheme:\s*dark/);
  assert.match(designCss, /--gc-bg:\s*#051424/);
  assert.match(designCss, /--gc-surface-raised:\s*#122131/);
  assert.match(designCss, /--gc-text-on-brand:\s*#051424/);
});

test('navigation shell owns desktop Explore geometry without specificity escalation', () => {
  assert.match(shellCss, /@media \(min-width:900px\)[\s\S]*\.topbar\{display:flex;position:fixed;z-index:95/);
  assert.match(shellCss, /@media \(min-width:900px\)[\s\S]*\.top-actions\{display:flex\}/);
  assert.doesNotMatch(accessibilityCss, /@media\(min-width:900px\)[\s\S]*\.topbar/);
  assert.ok(importantCount(shellCss) <= 1, `navigation shell must not grow a specificity arms race; found ${importantCount(shellCss)} !important declarations`);
});

test('Journal owns the Today preview without rebuilding a specificity arms race', () => {
  assert.match(journalCss, /#todayView \.journal-preview\{/);
  assert.match(journalCss, /grid-template-columns:minmax\(0,1fr\);/);
  assert.match(journalCss, /#todayView \.journal-preview-actions button:first-child/);
  assert.doesNotMatch(screenshotRecoveryCss, /#todayView \.journal-preview/);
  assert.ok(importantCount(journalCss) <= 8, `Journal Today preview must keep shrinking legacy specificity debt; found ${importantCount(journalCss)} !important declarations`);
});

test('Goals owns the Plan goal launcher instead of the global device recovery layer', () => {
  assert.match(goalsCss, /#planView \.goal-editor>summary\{/);
  assert.match(goalsCss, /min-height:48px!important/);
  assert.doesNotMatch(screenshotRecoveryCss, /#planView \.goal-editor\s*>\s*summary/);
});

test('Wellbeing owns Energy presentation instead of the global device recovery layer', () => {
  assert.match(wellbeingCss, /#todayView \.energy-drawer\{/);
  assert.match(wellbeingCss, /#todayView \.energy-grid\{/);
  assert.match(wellbeingCss, /#todayView \.energy-cell\.selected/);
  assert.doesNotMatch(screenshotRecoveryCss, /#todayView \.energy-(?:drawer|grid|cell|axis)/);
});

test('Today wellbeing presentation is owned by Wellbeing instead of the global device recovery layer', () => {
  assert.match(wellbeingTodayCss, /#todayView \.today-state-section\{/);
  assert.match(wellbeingTodayCss, /#todayView \.daily-state-grid\{/);
  assert.match(wellbeingTodayCss, /#todayView \.state-card\{/);
  assert.match(wellbeingTodayCss, /var\(--gc-surface-raised\)/);
  assert.doesNotMatch(wellbeingTodayCss, /background:#fff|color:#17202b|#e6e7e3/);
  assert.doesNotMatch(screenshotRecoveryCss, /#todayView \.today-state-section|#todayView \.daily-state-grid|#todayView \.state-card(?:\s|\{|:|>)/);
});

test('wellness breathing owns breathing presentation after recovery layers', () => {
  const screenshotRecovery = stylesheetIndex('/css/screenshot-recovery.css');
  const breathing = stylesheetIndex('/css/modules/wellness-breathing.css');
  const accessibility = stylesheetIndex('/css/accessibility-regression.css');
  assert.ok(screenshotRecovery >= 0 && breathing > screenshotRecovery && accessibility > breathing, 'wellness breathing must graduate device fixes out of global recovery while accessibility stays final');
  assert.match(wellnessBreathingCss, /\.living-breathing-orb\{/);
  assert.match(wellnessBreathingCss, /@keyframes gc-breath-orb/);
  assert.match(wellnessBreathingCss, /@media\(prefers-reduced-motion:reduce\)[\s\S]*\.living-breathing-orb/);
  assert.doesNotMatch(screenshotRecoveryCss, /\.living-breathing-orb|gc-breath-orb|gc-breath-ring/);
});

test('runtime stylesheet count stays bounded while module-owned sheets remain independent', () => {
  const stylesheets = runtimeStylesheets();
  assert.ok(stylesheets.length <= 31, `runtime stylesheet count grew to ${stylesheets.length}; add styles to an existing owner instead of another global override layer`);
  assert.ok(stylesheets.filter((path) => path.startsWith('/css/modules/')).length >= 10, 'business modules should keep owning their presentation');
});
