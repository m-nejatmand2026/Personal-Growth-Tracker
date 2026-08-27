const RETRYABLE_D1_ERRORS=Object.freeze([
  'Network connection lost',
  'storage caused object to be reset',
  'reset because its code was updated',
  'D1 DB storage operation exceeded timeout',
  'Cannot resolve D1 DB due to transient issue'
]);

export function isRetryableD1Error(error){
  const message=String(error?.message||error||'');
  return RETRYABLE_D1_ERRORS.some(fragment=>message.includes(fragment));
}

function sleep(ms){return ms>0?new Promise(resolve=>setTimeout(resolve,ms)):Promise.resolve();}

/**
 * Retries only idempotent D1 operations after documented transient transport/storage resets.
 * Callers must not wrap non-idempotent inserts unless they provide their own deduplication key.
 */
export async function runRetryableD1Operation(operation,{maxRetries=3,initialDelayMs=25,maxDelayMs=250,random=Math.random}={}){
  let attempt=0;
  let delay=Math.max(0,Number(initialDelayMs)||0);
  while(true){
    try{return await operation();}
    catch(error){
      if(!isRetryableD1Error(error)||attempt>=maxRetries)throw error;
      const jitter=delay>0?delay*Math.max(0,Number(random?.())||0):0;
      await sleep(Math.min(maxDelayMs,delay+jitter));
      delay=Math.min(maxDelayMs,Math.max(1,delay*2));
      attempt+=1;
    }
  }
}

export const runIdempotentD1Write=runRetryableD1Operation;
export const runIdempotentD1Read=runRetryableD1Operation;
