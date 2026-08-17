import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');
const app=await readFile(new URL('../public/experience/2/js/app.js',import.meta.url),'utf8');

test('Experience 2 PWA precaches every static module imported by the app shell',()=>{const imports=[...app.matchAll(/from['"](\.\/.+?)['"]/g)].map(match=>`/experience/2/js/${match[1].replace(/^\.\//,'')}`);for(const path of imports)assert.match(sw,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`service worker must precache ${path}`)});

test('Experience 2 PWA precaches implemented Today and Plan presentation layers',()=>{for(const path of['/experience/2/css/today.css','/experience/2/css/plan.css','/experience/2/js/views/today.js','/experience/2/js/views/plan.js'])assert.match(sw,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))});

test('Experience 2 cache namespace remains isolated and is versioned for shell changes',()=>{assert.match(sw,/growth-compass-preview2-e2-v2/);assert.match(sw,/startsWith\('growth-compass-preview2-e2-'\)/);assert.doesNotMatch(sw,/growth-compass-preview1|experience\/1/)});
