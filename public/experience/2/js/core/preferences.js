export const PREFERENCE_PREFIX='growth-compass:preview2:e2:';
export function readPreference(key,fallback=null){try{const value=localStorage.getItem(PREFERENCE_PREFIX+key);return value===null?fallback:value}catch{return fallback}}
export function writePreference(key,value){try{localStorage.setItem(PREFERENCE_PREFIX+key,String(value))}catch{}}
