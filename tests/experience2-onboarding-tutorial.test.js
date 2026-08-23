import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const onboarding=await readFile(new URL('../public/experience/2/js/onboarding-control.js',import.meta.url),'utf8');
const tutorial=await readFile(new URL('../public/experience/2/js/tutorial.js',import.meta.url),'utf8');
const settings=await readFile(new URL('../public/experience/2/js/views/settings.js',import.meta.url),'utf8');
const bootstrap=await readFile(new URL('../public/experience/2/js/theme-bootstrap.js',import.meta.url),'utf8');
const tutorialCss=await readFile(new URL('../public/experience/2/css/tutorial.css',import.meta.url),'utf8');
const onboardingCss=await readFile(new URL('../public/experience/2/css/onboarding-control.css',import.meta.url),'utf8');
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');

test('first-run onboarding is explicitly skippable and resumable without writing business data',()=>{assert.match(onboarding,/Skip setup and explore/);assert.match(onboarding,/Resume setup/);assert.match(onboarding,/writePreference\(KEY,'skipped'\)/);assert.match(onboarding,/PREFERENCE_PREFIX/);assert.match(onboarding,/openView\('compass'\)/);assert.match(onboarding,/data-onboarding-open-add/);assert.doesNotMatch(onboarding,/\/api\/|\/v1\/|goalsCapability|progressCapability|api\./);assert.match(onboardingCss,/@media\(max-width:700px\)/);});

test('interactive tutorial teaches the real five-part shell and permits skip at every step',()=>{for(const title of ['Today','Compass','Add','Patterns','Reflect'])assert.match(tutorial,new RegExp(`title:'${title}'`));assert.match(tutorial,/data-tutorial-skip/);assert.match(tutorial,/Skip tutorial/);assert.match(tutorial,/event\.key==='Escape'/);assert.match(tutorial,/writePreference\(TUTORIAL_KEY,state\)/);assert.match(tutorial,/window\.__gcExperience2Navigate/);assert.match(tutorial,/document\.querySelectorAll\(selector\)/);assert.match(tutorial,/gc-tutorial-target/);assert.doesNotMatch(tutorial,/\/api\/|\/v1\/|api\./);});

test('tutorial defers to authentication and first-run setup and can be replayed from Settings',()=>{assert.match(tutorial,/auth-checking/);assert.match(tutorial,/auth-gated/);assert.match(tutorial,/\.today-first-run/);assert.match(tutorial,/gc:start-tutorial/);assert.match(settings,/Replay tutorial/);assert.match(settings,/gc:start-tutorial/);assert.match(settings,/tutorial-state-v1/);});

test('tutorial and onboarding controls load early but remain isolated Experience 2 presentation modules',()=>{assert.match(bootstrap,/\/experience\/2\/js\/onboarding-control\.js/);assert.match(bootstrap,/\/experience\/2\/js\/tutorial\.js/);assert.match(tutorialCss,/@media\(prefers-reduced-motion:reduce\)/);assert.match(tutorialCss,/pointer-events:none/);assert.match(tutorialCss,/pointer-events:auto/);assert.doesNotMatch(bootstrap,/experience\/1|preview1/);});

test('offline shell precaches optional onboarding and tutorial modules in the Experience 2 namespace',()=>{for(const asset of ['/experience/2/js/onboarding-control.js','/experience/2/css/onboarding-control.css','/experience/2/js/tutorial.js','/experience/2/css/tutorial.css'])assert.ok(sw.includes(`'${asset}'`),`${asset} must be precached`);assert.match(sw,/growth-compass-preview2-e2-v106/);assert.doesNotMatch(sw,/experience\/1|growth-compass-preview1/);});
