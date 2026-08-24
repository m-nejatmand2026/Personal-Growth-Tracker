import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const onboarding=await readFile(new URL('../public/experience/2/js/onboarding-control.js',import.meta.url),'utf8');
const onboardingV2=await readFile(new URL('../public/experience/2/js/onboarding-v2.js',import.meta.url),'utf8');
const tutorial=await readFile(new URL('../public/experience/2/js/tutorial.js',import.meta.url),'utf8');
const coaching=await readFile(new URL('../public/experience/2/js/contextual-coaching.js',import.meta.url),'utf8');
const settings=await readFile(new URL('../public/experience/2/js/views/settings.js',import.meta.url),'utf8');
const bootstrap=await readFile(new URL('../public/experience/2/js/theme-bootstrap.js',import.meta.url),'utf8');
const tutorialCss=await readFile(new URL('../public/experience/2/css/tutorial.css',import.meta.url),'utf8');
const onboardingCss=await readFile(new URL('../public/experience/2/css/onboarding-control.css',import.meta.url),'utf8');
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');

test('first-run onboarding skip remains explicit and does not itself write business data',()=>{assert.match(onboarding,/Skip setup and explore/);assert.match(onboarding,/Resume setup/);assert.match(onboarding,/writePreference\(KEY,'skipped'\)/);assert.match(onboarding,/PREFERENCE_PREFIX/);assert.doesNotMatch(onboarding,/\/api\/|\/v1\/|goalsCapability|progressCapability|api\./);assert.match(onboardingCss,/@media\(max-width:700px\)/);});

test('zero-data setup creates real Direction and one Today action in three steps',()=>{assert.match(onboardingV2,/state=\{step:1/);assert.match(onboardingV2,/state\.step===2/);assert.match(onboardingV2,/state\.step===3/);assert.match(onboardingV2,/goalsCapability\.create/);assert.match(onboardingV2,/activitiesCapability\.create/);assert.match(onboardingV2,/api\.post\('\/v1\/daily-plan'/);assert.match(onboardingV2,/Routine setup can wait/);});

test('manual tutorial teaches the five useful shell actions and skip is terminal',()=>{for(const title of ['Today','Compass','Add','Patterns','Reflect'])assert.match(tutorial,new RegExp(`title:'${title}'`));assert.match(tutorial,/data-tutorial-skip/);assert.match(tutorial,/Skip tutorial/);assert.match(tutorial,/event\.key==='Escape'/);assert.match(tutorial,/writePreference\(TUTORIAL_KEY,state\)/);assert.match(tutorial,/stop\('skipped'\)/);assert.match(tutorial,/window\.__gcExperience2Navigate/);assert.doesNotMatch(tutorial,/\/api\/|\/v1\/|api\./);});

test('tutorial never auto-starts after skip and full tour remains manually replayable from Settings',()=>{assert.match(tutorial,/gc:start-tutorial/);assert.doesNotMatch(tutorial,/MutationObserver|eligibleForAutomaticStart|maybeStart|auth-checking|auth-gated|\.today-first-run/);assert.match(settings,/Open full tutorial/);assert.match(settings,/gc:start-tutorial/);assert.match(settings,/tutorial-state-v2/);});

test('contextual coaching teaches Compass immediately and Patterns only after evidence matures',()=>{assert.match(coaching,/coach-compass-seen-v1/);assert.match(coaching,/coach-patterns-seen-v1/);assert.match(coaching,/\.compass-view/);assert.match(coaching,/\.patterns-view:not\(\.is-baseline\)/);assert.match(coaching,/Treat them as evidence to investigate, not proof of cause/);});

test('tutorial and onboarding controls remain isolated Experience 2 presentation modules',()=>{assert.match(bootstrap,/\/experience\/2\/js\/onboarding-control\.js/);assert.match(bootstrap,/\/experience\/2\/js\/tutorial\.js/);assert.match(tutorialCss,/@media\(prefers-reduced-motion:reduce\)/);assert.match(tutorialCss,/pointer-events:none/);assert.match(tutorialCss,/pointer-events:auto/);assert.doesNotMatch(bootstrap,/experience\/1|preview1/);});

test('offline shell precaches onboarding tutorial and contextual teaching in the Experience 2 namespace',()=>{for(const asset of ['/experience/2/js/onboarding-control.js','/experience/2/js/onboarding-v2.js','/experience/2/js/contextual-coaching.js','/experience/2/css/onboarding-control.css','/experience/2/js/tutorial.js','/experience/2/css/tutorial.css'])assert.ok(sw.includes(`'${asset}'`),`${asset} must be precached`);assert.match(sw,/growth-compass-preview2-e2-v\d+/);assert.doesNotMatch(sw,/experience\/1|growth-compass-preview1/);});
