import { api } from '../core/api.js';
import { areasCapability } from './areas.js';

function goalPath(id){const value=Number(id);if(!Number.isInteger(value)||value<=0)throw new Error('Invalid Goal id.');return `/v1/goals/${value}`;}
function goalQuery(includeArchived=false){return includeArchived?'?include_archived=1':'';}

export const goalsCapability=Object.freeze({
  dependsOn:Object.freeze(['areas']),
  async references({includeArchived=false}={}){const response=await api.get(`/v1/goals${goalQuery(includeArchived)}`);return (response.items||[]).map(goal=>({id:Number(goal.id),name:goal.name,status:goal.status}));},
  async load({includeArchived=false}={}){const [goalResponse,areas]=await Promise.all([api.get(`/v1/goals${goalQuery(includeArchived)}`),areasCapability.list()]);return {goals:goalResponse.items||[],areas};},
  async create(input){return (await api.post('/v1/goals',input)).item;},
  async update(id,input){return (await api.put(goalPath(id),input)).item;},
  async archive(id){return (await api.delete(goalPath(id))).item;},
  async restore(id,goal){return (await api.put(goalPath(id),{...goal,status:'active'})).item;},
  async remove(id){return api.delete(`${goalPath(id)}/permanent`);},
  async createArea(input){return areasCapability.create(input);}
});
