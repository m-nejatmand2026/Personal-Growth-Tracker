import { api } from '../core/api.js';

export const progressCapability=Object.freeze({
  list({from,to,limit=100}={}){const query=new URLSearchParams();if(from)query.set('from',from);if(to)query.set('to',to);query.set('limit',String(limit));return api.get(`/v1/progress?${query}`);},
  delete(id){return api.delete(`/v1/progress/${id}`);}
});
