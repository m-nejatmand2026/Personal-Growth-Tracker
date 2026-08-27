import { api } from '../core/api.js';

export const dailyPlanCapability=Object.freeze({
  list:async(date)=>{
    const response=await api.get(`/v1/daily-plan?date=${encodeURIComponent(date)}`);
    return Array.isArray(response?.items)?response.items:[];
  }
});
