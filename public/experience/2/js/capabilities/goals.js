import { api } from '../core/api.js';
import { areasCapability } from './areas.js';

function goalPath(id){const value=Number(id);if(!Number.isInteger(value)||value<=0)throw new Error('Invalid Goal id.');return `/v1/goals/${value}`;}

export const goalsCapability=Object.freeze({
  dependsOn:Object.freeze(['areas']),
  async load(){const [goalResponse,areas]=await Promise.all([api.get('/v1/goals'),areasCapability.list()]);return {goals:goalResponse.items||[],areas};},
  async create(input){return (await api.post('/v1/goals',input)).item;},
  async update(id,input){return (await api.put(goalPath(id),input)).item;},
  async archive(id){return (await api.delete(goalPath(id))).item;},
  async createArea(input){return areasCapability.create(input);}
});
