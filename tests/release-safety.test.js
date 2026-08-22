import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workflowDir=fileURLToPath(new URL('../.github/workflows/',import.meta.url));
const packageJson=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));

async function workflows(){
  const names=(await readdir(workflowDir)).filter((name)=>/\.ya?ml$/i.test(name));
  return Promise.all(names.map(async(name)=>({name,content:await readFile(join(workflowDir,name),'utf8')})));
}

test('no GitHub workflow automatically applies D1 migrations',async()=>{
  for(const workflow of await workflows()){
    assert.doesNotMatch(workflow.content,/d1\s+migrations\s+apply/i,`${workflow.name} must not apply D1 migrations automatically`);
  }
});

test('every Wrangler deploy command in GitHub workflows is explicitly preview-only',async()=>{
  for(const workflow of await workflows()){
    const commands=workflow.content.split('\n').filter((line)=>/wrangler@[^\s]+\s+deploy/.test(line));
    for(const command of commands){
      assert.match(command,/--env\s+preview/,`${workflow.name} contains a non-preview deploy command: ${command.trim()}`);
      assert.match(command,/--name\s+personal-growth-tracker-preview/,`${workflow.name} must pin the preview Worker name`);
    }
  }
});

test('local npm scripts make production intent explicit and expose no remote database-create shortcut',()=>{
  const scripts=packageJson.scripts||{};
  assert.equal(scripts.deploy,undefined);
  assert.equal(scripts['db:migrate:remote'],undefined);
  assert.equal(scripts['db:create'],undefined);
  assert.equal(scripts['deploy:preview'],'wrangler deploy --env preview');
  assert.equal(scripts['deploy:production'],'wrangler deploy');
  assert.equal(scripts['db:migrate:preview'],'wrangler d1 migrations apply DB --remote --env preview');
  assert.equal(scripts['db:migrate:production'],'wrangler d1 migrations apply DB --remote');
});
