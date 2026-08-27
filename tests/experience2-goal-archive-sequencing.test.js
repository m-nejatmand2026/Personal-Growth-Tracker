import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const goals=await readFile(new URL('../public/experience/2/js/views/direction.js',import.meta.url),'utf8');

test('Direction archive confirmation releases modal UI before awaiting the network mutation',()=>{
  const handler=goals.slice(goals.indexOf("host.querySelector('[data-goal-archive-confirm]')"));
  const close=handler.indexOf('close();');
  const archive=handler.indexOf('await goalsCapability.archive(goal.id)');
  assert.ok(close>=0&&archive>close,'archive modal must close before the remote mutation can delay UI release');
  assert.match(handler,/catch\(error\)\{toast\(error\.message\|\|'Could not archive goal'\);await reload\?\.\(\);\}/);
});
