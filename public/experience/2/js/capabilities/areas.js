import { api } from '../core/api.js';

function areaPath(id){const value=Number(id);if(!Number.isInteger(value)||value<=0)throw new Error('Invalid Life Area id.');return `/v1/areas/${value}`;}

export const areasCapability=Object.freeze({
  async list({includeArchived=false}={}){return (await api.get(`/v1/areas${includeArchived?'?include_archived=1':''}`)).items||[];},
  async create(input){return (await api.post('/v1/areas',input)).item;},
  async update(id,input){return (await api.put(areaPath(id),input)).item;},
  async archive(id){return (await api.delete(areaPath(id))).item;}
});
