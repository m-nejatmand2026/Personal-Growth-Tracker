import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('public/index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('public/manifest.webmanifest','utf8'));
const install=fs.readFileSync('public/js/platform/install-app.js','utf8');
const css=fs.readFileSync('public/css/install-app.css','utf8');

test('Growth Compass exposes iOS standalone metadata and a dedicated touch icon',()=>{
  assert.match(html,/apple-mobile-web-app-capable/);
  assert.match(html,/apple-mobile-web-app-title/);
  assert.match(html,/apple-touch-icon[^>]+icon-180\.png/);
  assert.match(html,/install-app\.js/);
});

test('manifest is installable and uses PNG icons alongside the SVG fallback',()=>{
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.scope,'/');
  assert.ok(manifest.icons.some(icon=>icon.src==='/icon-192.png'&&icon.type==='image/png'));
  assert.ok(manifest.icons.some(icon=>icon.src==='/icon-512.png'&&icon.type==='image/png'));
});

test('iPhone install help appears only when appropriate and never claims it can invoke Apples native prompt',()=>{
  assert.match(install,/isAppleMobile/);
  assert.match(install,/isStandalone/);
  assert.match(install,/Add to Home Screen/);
  assert.match(install,/Open as Web App/);
  assert.match(install,/setTimeout\(showBanner,700\)/);
  assert.doesNotMatch(install,/beforeinstallprompt|prompt\(\)/);
});

test('install prompt has large mobile controls and respects the bottom navigation safe area',()=>{
  assert.match(css,/min-height:44px/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
});
