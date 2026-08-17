import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const indexHtml = await readFile(new URL('public/index.html', root), 'utf8');
const designCss = await readFile(new URL('public/css/design-system.css', root), 'utf8');
const shellCss = await readFile(new URL('public/css/navigation-shell.css', root), 'utf8');
const recoveryCss = await readFile(new URL('public/css/functional-recovery.css', root), 'utf8');
const loggerCss = await readFile(new URL('public/css/modules/logger.css', root), 'utf8');
const journalCss = await readFile(new URL('public/css/journal.css', root), 'utf8');
const goalsCss = await readFile(new URL('public/css/modules/goals.css', root), 'utf8');
const wellbeingCss = await readFile(new URL('public/css/modules/wellbeing.css', root), 'utf8');
const wellbeingTodayCss = await readFile(new URL('public/css/modules/wellbeing-today-sanctuary.css', root), 'utf8');
const wellnessBoostCss = await readFile(new URL('public/css/modules/wellness-boost.css', root), 'utf8');
const wellnessRecoveryCss = await readFile(new URL('public/css/modules/wellness-recovery.css', root), 'utf8');
const wellnessBreathingCss = await readFile(new URL('public/css/modules/wellness-breathing.css', root), 'utf8');
const accessibilityCss = await readFile(new URL('public/css/accessibility-regression.css', root), 'utf8');

const retiredPresentationFiles = [
  'public/css/ux-reset.css',
  'public/css/living-canvas.css',
  'public/css/figma-current.css',
  'public/css/figma-current-live.css',
  'public/css/figma-current-semantics.css',
  'public/css/product-polish.css',
  'public/css/screenshot-recovery.css'
];

function stylesheetIndex(path) {
  return indexHtml.indexOf(`href="${path}"`);
}

function runtimeStylesheets() {
  return [...indexHtml.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((match) => match[1]);
}

function importantCount(source) {
  return (source.replace(/\/\*[\s\S]*?\*\//g, '').match(/!important/g) || []).length;
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
  const recovery = stylesheetIndex('/css/functional-recovery.css');
  const wellnessRecovery = stylesheetIndex('/css/modules/wellness-recovery.css');
  const motion = stylesheetIndex('/css/motion-system.css');
  const accessibility = stylesheetIndex('/css/accessibility-regression.css');
  assert.ok(design >= 0 && shell > design && rebuild > shell && pages > rebuild && recovery > pages && wellnessRecovery > recovery && motion > wellnessRecovery && accessibility > motion);
  assert.equal(runtimeStylesheets().at(-1), '/css/accessibility-regression.css');
});

test('canonical design system owns theme tokens instead of composition sheets', () => {
  assert.match(designCss, /color-scheme:\s*dark/);
  assert.match(designCss, /--gc-bg:\s*#051424/);
  assert.match(designCss, /--gc-surface-raised:\s*#122131/);
  assert.match(designCss, /--gc-text-on-brand:\s*#051424/);
});

test('remaining functional recovery debt is capped and must only shrink', () => {
  assert.ok(recoveryCss.length <= 8700, `functional recovery grew to ${recoveryCss.length} bytes`);
  assert.ok(importantCount(recoveryCss) <= 33, `functional recovery grew to ${importantCount(recoveryCss)} !important declarations`);
  assert.doesNotMatch(recoveryCss, /screenshot-recovery|figma-current|living-canvas/);
  assert.doesNotMatch(recoveryCss, /wellness-boost-library-view|living-wellness-hero|wellness-session-grid|wellness-session-tile/);
});

test('Logger owns recovered Add presentation without rebuilding specificity debt', () => {
  const recovery = stylesheetIndex('/css/functional-recovery.css');
  const logger = stylesheetIndex('/css/modules/logger.css');
  const motion = stylesheetIndex('/css/motion-system.css');
  assert.ok(recovery >= 0 && logger > recovery && motion > logger);
  assert.match(loggerCss, /\.gc-add-activity-sheet\{/);
  assert.match(loggerCss, /\.gc-intent-tabs \.logger-mode-choice\.selected>span\{/);
  assert.match(loggerCss, /\.logger-save\{/);
  assert.doesNotMatch(recoveryCss, /logger-backdrop|gc-add-activity-sheet|gc-intent-tabs|logger-activity-search|logger-save/);
  assert.ok(importantCount(loggerCss) <= 1, `logger specificity debt grew to ${importantCount(loggerCss)} !important declarations`);
});

test('navigation shell owns desktop Explore and confines transitional mobile specificity debt', () => {
  const transitionStart = shellCss.indexOf('/* Explore is a shell-owned destination control.');
  const desktopStart = shellCss.indexOf('@media (min-width:900px)');
  assert.ok(transitionStart >= 0 && desktopStart > transitionStart);
  assert.match(shellCss, /@media \(min-width:900px\)[\s\S]*\.topbar\{display:flex;position:fixed;z-index:95/);
  assert.match(shellCss, /@media \(min-width:900px\)[\s\S]*\.top-actions\{display:flex\}/);
  assert.doesNotMatch(accessibilityCss, /@media\(min-width:900px\)[\s\S]*\.topbar/);
  const outsideTransition = `${shellCss.slice(0, transitionStart)}${shellCss.slice(desktopStart)}`;
  assert.equal(importantCount(outsideTransition), 0);
  const transition = shellCss.slice(transitionStart, desktopStart);
  assert.match(transition, /\.os-shell \.topbar\{[^}]*width:88px!important;[^}]*height:44px!important/);
  assert.match(transition, /\.os-shell \.top-more>summary\{[^}]*height:44px!important/);
  assert.match(transition, /\.os-shell \.top-more>summary \.top-more-label\{[^}]*display:inline!important/);
  assert.ok(importantCount(transition) <= 48);
});

test('Journal owns the Today preview without rebuilding a specificity arms race', () => {
  assert.match(journalCss, /#todayView \.journal-preview\{/);
  assert.match(journalCss, /grid-template-columns:minmax\(0,1fr\);/);
  assert.match(journalCss, /#todayView \.journal-preview-actions button:first-child/);
  assert.ok(importantCount(journalCss) <= 8);
});

test('Goals owns the Plan goal launcher', () => {
  assert.match(goalsCss, /#planView \.goal-editor>summary\{/);
  assert.match(goalsCss, /min-height:48px!important/);
});

test('Wellbeing owns Energy presentation', () => {
  assert.match(wellbeingCss, /#todayView \.energy-drawer\{/);
  assert.match(wellbeingCss, /#todayView \.energy-grid\{/);
  assert.match(wellbeingCss, /#todayView \.energy-cell\.selected/);
});

test('Today wellbeing presentation is owned by Wellbeing', () => {
  assert.match(wellbeingTodayCss, /#todayView \.today-state-section\{/);
  assert.match(wellbeingTodayCss, /#todayView \.daily-state-grid\{/);
  assert.match(wellbeingTodayCss, /#todayView \.state-card\{/);
  assert.match(wellbeingTodayCss, /var\(--gc-surface-raised\)/);
  assert.doesNotMatch(wellbeingTodayCss, /background:#fff|color:#17202b|#e6e7e3/);
});

test('Wellness owns recovered sanctuary and session presentation', () => {
  const recovery = stylesheetIndex('/css/functional-recovery.css');
  const wellnessRecovery = stylesheetIndex('/css/modules/wellness-recovery.css');
  const breathing = stylesheetIndex('/css/modules/wellness-breathing.css');
  assert.ok(recovery >= 0 && wellnessRecovery > recovery && breathing > wellnessRecovery);
  assert.match(wellnessRecoveryCss, /\.living-wellness-hero\{/);
  assert.match(wellnessRecoveryCss, /\.wellness-session-grid\{/);
  assert.match(wellnessRecoveryCss, /\.wellness-session-tile\{/);
  assert.doesNotMatch(recoveryCss, /living-wellness-hero|wellness-session-grid|wellness-session-tile/);
});

test('Wellness owns mobile sanctuary alignment', () => {
  assert.match(wellnessBoostCss, /@media\(max-width:760px\)[\s\S]*#wellness-boostView \.living-wellness-hero/);
  assert.match(wellnessBoostCss, /#wellness-boostView \.wellness-sanctuary-copy p\{margin-inline:auto!important\}/);
});

test('wellness breathing owns breathing presentation after recovery and before accessibility', () => {
  const recovery = stylesheetIndex('/css/functional-recovery.css');
  const breathing = stylesheetIndex('/css/modules/wellness-breathing.css');
  const accessibility = stylesheetIndex('/css/accessibility-regression.css');
  assert.ok(recovery >= 0 && breathing > recovery && accessibility > breathing);
  assert.match(wellnessBreathingCss, /\.living-breathing-orb\{/);
  assert.match(wellnessBreathingCss, /@keyframes gc-breath-orb/);
  assert.match(wellnessBreathingCss, /@media\(prefers-reduced-motion:reduce\)[\s\S]*\.living-breathing-orb/);
});

test('runtime stylesheet count stays bounded while module-owned sheets remain independent', () => {
  const stylesheets = runtimeStylesheets();
  assert.ok(stylesheets.length <= 31, `runtime stylesheet count grew to ${stylesheets.length}`);
  assert.ok(stylesheets.filter((path) => path.startsWith('/css/modules/')).length >= 11);
});
