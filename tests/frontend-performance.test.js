import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const publicRoot=fileURLToPath(new URL('../public/',import.meta.url));
const app=await readFile(new URL('../public/js/app.js',import.meta.url),'utf8');
const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');

async function sourceFiles(directory){
  const entries=await readdir(directory,{withFileTypes:true});
  const files=[];
  for(const entry of entries){
    const path=join(directory,entry.name);
    if(entry.isDirectory()) files.push(...await sourceFiles(path));
    else if(/\.(?:js|css)$/.test(entry.name)) files.push(path);
  }
  return files;
}

test('independent Today composition reads do not create an avoidable serial waterfall',()=>{
  assert.match(app,/Promise\.allSettled\(\[\s*dailyPlan \? dailyPlan\.load/);
  assert.match(app,/journal \? journal\.loadPreview/);
});

test('frontend source stays within a deliberate lightweight no-bundler budget',async()=>{
  const files=[...await sourceFiles(join(publicRoot,'js')),...await sourceFiles(join(publicRoot,'css'))];
  const sizes=await Promise.all(files.map(async(path)=>({path,size:(await stat(path)).size})));
  const total=sizes.reduce((sum,item)=>sum+item.size,0);
  const largest=sizes.reduce((current,item)=>item.size>current.size?item:current,{path:'',size:0});

  assert.ok(total<=512*1024,`JS+CSS source budget exceeded: ${total} bytes`);
  assert.ok(largest.size<=40*1024,`single frontend source file is too large: ${largest.path} (${largest.size} bytes)`);
});

test('initial document does not depend on third-party script font or stylesheet origins',()=>{
  assert.doesNotMatch(index,/<script[^>]+src="https?:\/\//i);
  assert.doesNotMatch(index,/<link[^>]+(?:rel="stylesheet"|rel="preconnect"|rel="preload")[^>]+href="https?:\/\//i);
  assert.doesNotMatch(index,/fonts\.(?:googleapis|gstatic)\.com/i);
});
