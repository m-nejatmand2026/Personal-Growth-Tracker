import { api } from '../core/api.js';

export const wellbeingCapability=Object.freeze({
  day(date){return api.get(`/v1/wellbeing/day?date=${encodeURIComponent(date)}`);},
  listEnergy({from,to,limit=300}={}){const query=new URLSearchParams();if(from)query.set('from',from);if(to)query.set('to',to);query.set('limit',String(limit));return api.get(`/v1/wellbeing/energy?${query}`);},
  recordEnergy(input){return api.post('/v1/wellbeing/energy',input);},
  recordSleep(input){return api.post('/v1/wellbeing/sleep',input);},
  recordContext(input){return api.post('/v1/wellbeing/context',input);}
});
