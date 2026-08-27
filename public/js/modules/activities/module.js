import{api}from'../../core/api.js';import{activitiesPanelHtml,bindActivitiesPanel}from'./ui.js';
function activityPath(id){const n=Number(id);if(!Number.isInteger(n)||n<=0)throw new Error('Invalid Activity id.');return`/api/v1/activities/${n}`}
export const activitiesModule=Object.freeze({id:'activities',contractVersion:1,dependsOn:['goals'],defaultEnabled:true,publishes:Object.freeze([]),subscribes:Object.freeze([]),slots:Object.freeze([{name:'plan',order:15}]),
async list({goalId=null,includeArchived=false}={}){const p=new URLSearchParams();if(goalId!=null){const n=Number(goalId);if(!Number.isInteger(n)||n<=0)throw new Error('Invalid Goal id.');p.set('goal_id',String(n))}if(includeArchived)p.set('include_archived','1');const q=p.toString();return(await api(`/api/v1/activities${q?`?${q}`:''}`)).items||[]},
async creationContext(){const r=await api('/api/v1/goals');return{goals:(r.items||[]).filter(g=>g.status!=='archived').map(g=>({id:Number(g.id),name:g.name,status:g.status}))}},
async create(input){return(await api('/api/v1/activities',{method:'POST',body:JSON.stringify(input)})).item},
async update(id,input){return(await api(activityPath(id),{method:'PUT',body:JSON.stringify(input)})).item},
async archive(id){return(await api(activityPath(id),{method:'DELETE'})).item},
async load(){const[activities,context]=await Promise.all([this.list(),this.creationContext()]);return{activities,goals:context.goals||[]}},
render({model}){return activitiesPanelHtml(model)},
bind({model,reload}){bindActivitiesPanel(model,{create:input=>this.create(input),update:(id,input)=>this.update(id,input),archive:id=>this.archive(id),reload})}});
