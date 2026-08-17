import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../public/experience/2/',import.meta.url));
async function files(dir,extension){const entries=await readdir(dir,{withFileTypes:true});const out=[];for(const entry of entries){const path=join(dir,entry.name);if(entry.isDirectory())out.push(...await files(path,extension));else if(entry.name.endsWith(extension))out.push(path);}return out;}

test('every Experience 2 CSS custom property resolves through CSS or an explicit JS runtime value',async()=>{
  const cssFiles=await files(join(root,'css'),'.css');
  const jsFiles=await files(join(root,'js'),'.js');
  const defined=new Set();
  const used=new Map();
  for(const file of cssFiles){const source=await readFile(file,'utf8');for(const match of source.matchAll(/(--[a-z0-9-]+)\s*:/gi))defined.add(match[1]);for(const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)){const list=used.get(match[1])||[];list.push(file);used.set(match[1],list);}}
  for(const file of jsFiles){const source=await readFile(file,'utf8');for(const match of source.matchAll(/setProperty\(\s*['"](--[a-z0-9-]+)['"]/gi))defined.add(match[1]);}
  const unresolved=[...used].filter(([token])=>!defined.has(token)).map(([token,owners])=>`${token} (${[...new Set(owners)].map(file=>file.slice(root.length+1)).join(', ')})`);
  assert.deepEqual(unresolved,[],`Unresolved Experience 2 CSS custom properties:\n${unresolved.join('\n')}`);
});

test('legacy compatibility aliases resolve into semantic GC tokens rather than fixed theme colors',async()=>{const foundation=await readFile(join(root,'css','foundation.css'),'utf8');for(const [alias,target] of [['--text','--gc-text'],['--text-muted','--gc-text-muted'],['--muted','--gc-text-muted'],['--line','--gc-border'],['--surface','--gc-surface'],['--surface-strong','--gc-raised'],['--focus','--gc-primary'],['--gc-danger','--gc-risk']])assert.match(foundation,new RegExp(`${alias}:var\\(${target}\\)`),`${alias} must bridge to ${target}`);});
