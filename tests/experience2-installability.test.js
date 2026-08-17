import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const html=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const manifest=JSON.parse(await readFile(new URL('../public/experience/2/manifest.webmanifest',import.meta.url),'utf8'));

test('Experience 2 exposes iOS standalone metadata and a real touch icon',async()=>{assert.match(html,/apple-mobile-web-app-capable" content="yes"/);assert.match(html,/apple-mobile-web-app-title" content="Growth Compass"/);assert.match(html,/apple-touch-icon" sizes="180x180" href="\/icon-180\.png"/);await access(new URL('../public/icon-180.png',import.meta.url));});
test('Experience 2 manifest remains isolated and installable',()=>{assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/experience/2/');assert.equal(manifest.start_url,'/experience/2/');assert.ok(manifest.icons.some(icon=>icon.src==='/icon-192.png'&&icon.type==='image/png'));assert.ok(manifest.icons.some(icon=>icon.src==='/icon-512.png'&&icon.type==='image/png'));});
test('Experience 2 does not import the frozen Experience 1 install helper',()=>{assert.doesNotMatch(html,/\/js\/platform\/install-app\.js/);assert.doesNotMatch(html,/\/experience\/1\//);});
