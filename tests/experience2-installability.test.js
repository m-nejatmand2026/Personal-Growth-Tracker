import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const html=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const helper=await readFile(new URL('../public/experience/2/js/install-app.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/install-app.css',import.meta.url),'utf8');
const manifest=JSON.parse(await readFile(new URL('../public/experience/2/manifest.webmanifest',import.meta.url),'utf8'));
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');

test('Experience 2 exposes iOS standalone metadata and a real touch icon',async()=>{assert.match(html,/apple-mobile-web-app-capable" content="yes"/);assert.match(html,/apple-mobile-web-app-title" content="Growth Compass"/);assert.match(html,/apple-touch-icon" sizes="180x180" href="\/icon-180\.png"/);await access(new URL('../public/icon-180.png',import.meta.url));});
test('Experience 2 manifest remains isolated and installable',()=>{assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/experience/2/');assert.equal(manifest.start_url,'/experience/2/');assert.ok(manifest.icons.some(icon=>icon.src==='/icon-192.png'&&icon.type==='image/png'));assert.ok(manifest.icons.some(icon=>icon.src==='/icon-512.png'&&icon.type==='image/png'));});
test('Experience 2 has an independent iPhone guidance path instead of importing frozen Experience 1',()=>{assert.match(html,/id="installAppHost"/);assert.match(html,/\/experience\/2\/css\/install-app\.css/);assert.match(html,/\/experience\/2\/js\/install-app\.js/);assert.doesNotMatch(html,/\/js\/platform\/install-app\.js/);assert.doesNotMatch(html,/\/experience\/1\//);assert.match(helper,/iPhone\|iPad\|iPod/);assert.match(helper,/display-mode: standalone/);assert.match(helper,/growth-compass:preview2:e2:ios-install-later/);assert.match(helper,/Add to Home Screen/);assert.match(helper,/Open as Web App/);assert.match(helper,/role="dialog" aria-modal="true"/);assert.doesNotMatch(helper,/beforeinstallprompt/);});
test('iPhone install banner remains phone-safe and uses Experience 2 semantic styling',()=>{assert.match(css,/\.install-app-banner\{/);assert.match(css,/var\(--gc-surface-glass\)/);assert.match(css,/env\(safe-area-inset-bottom\)/);assert.match(css,/@media\(max-width:520px\)/);assert.match(css,/\.install-help-close\{width:48px;height:48px/);});
test('offline Experience 2 shell includes its independent install guidance assets',()=>{assert.match(sw,/growth-compass-preview2-e2-v\d+/);assert.match(sw,/\/experience\/2\/css\/install-app\.css/);assert.match(sw,/\/experience\/2\/js\/install-app\.js/);});
