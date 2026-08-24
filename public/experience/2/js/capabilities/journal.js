import { api } from '../core/api.js';

export const journalCapability=Object.freeze({
  list({q='',limit=80,includeArchived=false,archivedOnly=false}={}){const query=new URLSearchParams();if(q)query.set('q',q);query.set('limit',String(limit));if(includeArchived)query.set('include_archived','1');if(archivedOnly)query.set('archived_only','1');return api.get(`/v1/journal?${query}`);},
  create(input){return api.post('/v1/journal',input);},
  update(id,input){return api.put(`/v1/journal/${id}`,input);},
  archive(id){return api.delete(`/v1/journal/${id}`);},
  restore(id){return api.post(`/v1/journal/${id}/restore`,{});},
  remove(id){return api.delete(`/v1/journal/${id}/permanent`);}
});
