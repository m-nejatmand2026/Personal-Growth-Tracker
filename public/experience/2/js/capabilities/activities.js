import { api } from '../core/api.js';

function activityPath(id){const value=Number(id);if(!Number.isInteger(value)||value<=0)throw new Error('Invalid Activity id.');return `/v1/activities/${value}`;}

export const activitiesCapability=Object.freeze({
  async list({goalId=null,includeArchived=false}={}){
    const params=new URLSearchParams();
    if(goalId!=null){const value=Number(goalId);if(!Number.isInteger(value)||value<=0)throw new Error('Invalid Goal id.');params.set('goal_id',String(value));}
    if(includeArchived)params.set('include_archived','1');
    const query=params.toString();
    return (await api.get(`/v1/activities${query?`?${query}`:''}`)).items||[];
  },
  async creationContext(){
    const response=await api.get('/v1/goals');
    return {goals:(response.items||[]).filter(goal=>goal.status!=='archived').map(goal=>({id:Number(goal.id),name:goal.name,status:goal.status}))};
  },
  async create(input){return (await api.post('/v1/activities',input)).item;},
  async update(id,input){return (await api.put(activityPath(id),input)).item;},
  async archive(id){return (await api.delete(activityPath(id))).item;},
  async restore(id){return (await api.post(`${activityPath(id)}/restore`,{})).item;},
  async remove(id){return api.delete(`${activityPath(id)}/permanent`);}
});
