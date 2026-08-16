import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../public/css/accessibility-regression.css',import.meta.url),'utf8');
const design=await readFile(new URL('../public/css/design-system.css',import.meta.url),'utf8');
const framework=await readFile(new URL('../public/css/experience-framework.css',import.meta.url),'utf8');
const app=await readFile(new URL('../public/js/app.js',import.meta.url),'utf8');
const charts=await readFile(new URL('../public/js/platform/charts.js',import.meta.url),'utf8');
const insights=await readFile(new URL('../public/js/modules/insights/ui.js',import.meta.url),'utf8');
const install=await readFile(new URL('../public/js/platform/install-app.js',import.meta.url),'utf8');

function token(source,name){const match=source.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));assert.ok(match,`missing color token ${name}`);return match[1]}
function rgb(hex){const value=Number.parseInt(hex.slice(1),16);return [(value>>16)&255,(value>>8)&255,value&255]}
function luminance(hex){const linear=rgb(hex).map((channel)=>{const value=channel/255;return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4});return 0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2]}
function contrast(a,b){const first=luminance(a);const second=luminance(b);return (Math.max(first,second)+0.05)/(Math.min(first,second)+0.05)}
function assertNormalTextContrast(foreground,background,label){assert.ok(contrast(foreground,background)>=4.5,`${label} must keep at least 4.5:1 contrast`)}

test('final accessibility stylesheet loads after all Product Rebuild presentation layers',()=>{const accessibility=index.indexOf('/css/accessibility-regression.css');const rebuild=index.indexOf('/css/product-rebuild.css');const pages=index.indexOf('/css/product-rebuild-pages.css');assert.ok(accessibility>pages&&pages>rebuild&&rebuild>=0)});
test('375px acceptance layer prevents horizontal shell overflow without imposing a desktop minimum width',()=>{assert.match(css,/@media\s*\(max-width:\s*375px\)/);assert.match(css,/overflow-x:\s*clip/);assert.match(css,/min-inline-size:\s*0/);assert.match(css,/max-inline-size:\s*100%/);assert.match(css,/100dvh/);assert.doesNotMatch(css,/min-(?:inline-)?size:\s*(?:4\d\d|[5-9]\d\d|\d{4,})px/)});
test('motion focus and modal safeguards remain global platform concerns',()=>{assert.match(design,/prefers-reduced-motion:\s*reduce/);assert.match(design,/:focus-visible/);assert.match(css,/body\.gc-modal-open/);assert.match(css,/prefers-reduced-motion:\s*reduce/)});
test('SPA navigation has a keyboard bypass target and inactive views are hidden',()=>{assert.match(index,/<body>\s*<a class="gc-skip-link" href="#mainContent">Skip to main content<\/a>/);assert.match(index,/id="mainContent" class="workspace" tabindex="-1"/);for(const view of ['plan','progress','insights','wellness-boost','journal','settings'])assert.match(index,new RegExp(`id="${view}View"[^>]*hidden`));assert.match(app,/view\.hidden\s*=\s*!isCurrent/)});
test('SPA exposes loading state updates title and safely escapes runtime errors',()=>{assert.match(app,/setAttribute\('aria-busy',\s*'true'\)/);assert.match(app,/removeAttribute\('aria-busy'\)/);assert.match(app,/document\.title\s*=\s*`\$\{viewTitles\[name\]\} — Growth Compass`/);assert.match(index,/<title>Today — Growth Compass<\/title>/);assert.match(app,/escapeHtml\(error\?\.message\s*\|\|\s*'Other parts of Today still work\.'\)/)});
test('canonical muted copy and shared category tones keep normal-text contrast',()=>{const surface=token(design,'--gc-surface');const background=token(design,'--gc-bg');const muted=token(design,'--gc-text-muted');assertNormalTextContrast(muted,surface,'muted copy on surface');assertNormalTextContrast(muted,background,'muted copy on app background');for(const tone of ['reset','calm','focus','restore']){const toneBackground=token(framework,`--gc-tone-${tone}-bg`);const toneInk=token(framework,`--gc-tone-${tone}-ink`);assertNormalTextContrast(toneInk,toneBackground,`${tone} tone ink`)}});
test('threshold graphics expose equivalent Actual Minimum Target text',()=>{assert.match(charts,/accessibleSummary/);assert.match(charts,/Actual \$\{actualText\}; Minimum \$\{minimumText\}; Target \$\{targetText\}/);assert.match(charts,/role="group"/);assert.match(charts,/gc-sr-only/)});
test('Insights exposes current evidence stage and sample sizes as semantic text',()=>{assert.match(insights,/<h2 id="insightsCurrentTitle">Insights<\/h2>/);assert.match(insights,/Evidence readiness/);assert.match(insights,/aria-current="step"/);assert.match(insights,/\$\{trackedDays\}<small>tracked \$\{trackedDays === 1 \? 'day' : 'days'\}<\/small>/);assert.match(insights,/progress records/);assert.match(insights,/energy check-ins/);assert.match(insights,/No defensible matched pattern yet/);assert.doesNotMatch(insights,/N=/)});
test('iPhone installation instructions use the shared modal accessibility controller',()=>{assert.match(install,/activateModal/);assert.match(install,/role="dialog" aria-modal="true" aria-labelledby="installAppTitle"/);assert.match(install,/Add to Home Screen/);assert.doesNotMatch(install,/beforeinstallprompt|\.prompt\(\)/)});
