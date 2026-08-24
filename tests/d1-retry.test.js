import test from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableD1Error, runIdempotentD1Write } from '../worker/core/d1-retry.js';

test('D1 retry boundary recognizes documented transient connection and storage reset errors', () => {
  assert.equal(isRetryableD1Error(new Error('D1_ERROR: Network connection lost.')), true);
  assert.equal(isRetryableD1Error(new Error('Internal error in D1 DB storage caused object to be reset.')), true);
  assert.equal(isRetryableD1Error(new Error('D1 DB storage operation exceeded timeout which caused object to be reset.')), true);
  assert.equal(isRetryableD1Error(new Error('SQLITE_CONSTRAINT: foreign key failed')), false);
});

test('idempotent D1 writes retry a transient failure and return the successful result', async () => {
  let calls=0;
  const result=await runIdempotentD1Write(async()=>{
    calls+=1;
    if(calls===1)throw new Error('D1_ERROR: Network connection lost.');
    return {ok:true};
  },{maxRetries:2,initialDelayMs:0,random:()=>0});
  assert.deepEqual(result,{ok:true});
  assert.equal(calls,2);
});

test('idempotent D1 writes never retry deterministic application errors', async () => {
  let calls=0;
  await assert.rejects(()=>runIdempotentD1Write(async()=>{
    calls+=1;
    throw new Error('SQLITE_CONSTRAINT: foreign key failed');
  },{maxRetries:3,initialDelayMs:0,random:()=>0}),/SQLITE_CONSTRAINT/);
  assert.equal(calls,1);
});

test('idempotent D1 writes stop after the configured transient retry budget', async () => {
  let calls=0;
  await assert.rejects(()=>runIdempotentD1Write(async()=>{
    calls+=1;
    throw new Error('Network connection lost');
  },{maxRetries:2,initialDelayMs:0,random:()=>0}),/Network connection lost/);
  assert.equal(calls,3);
});
