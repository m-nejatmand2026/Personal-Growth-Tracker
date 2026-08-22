import { api } from '../core/api.js';

export const journalCapability=Object.freeze({
  list({q='',limit=80}={}){const query=new URLSearchParams();if(q)query.set('q',q);query.set('limit',String(limit));return api.get(`/v1/journal?${query}`);},
  create(input){return api.post('/v1/journal',input);},
  update(id,input){return api.put(`/v1/journal/${id}`,input);},
  delete(id){return api.delete(`/v1/journal/${id}`);}
});
