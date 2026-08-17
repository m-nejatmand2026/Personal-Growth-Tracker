import { api } from '../core/api.js';

export const wellbeingCapability=Object.freeze({
  listEnergy({from,to,limit=300}={}){const query=new URLSearchParams();if(from)query.set('from',from);if(to)query.set('to',to);query.set('limit',String(limit));return api.get(`/v1/wellbeing/energy?${query}`);}
});
