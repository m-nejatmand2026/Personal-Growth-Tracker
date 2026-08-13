import { api } from '../../core/api.js';

function activityPath(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('Invalid Activity id.');
  }
  return `/api/v1/activities/${numericId}`;
}

export const activitiesModule = Object.freeze({
  id: 'activities',
  contractVersion: 1,
  dependsOn: ['goals'],
  defaultEnabled: true,
  slots: Object.freeze([]),

  async list({ goalId = null, includeArchived = false } = {}) {
    const params = new URLSearchParams();

    if (goalId != null) {
      const numericGoalId = Number(goalId);
      if (!Number.isInteger(numericGoalId) || numericGoalId <= 0) {
        throw new Error('Invalid Goal id.');
      }
      params.set('goal_id', String(numericGoalId));
    }

    if (includeArchived) params.set('include_archived', '1');

    const query = params.toString();
    const response = await api(
      `/api/v1/activities${query ? `?${query}` : ''}`
    );

    return response.items || [];
  },

  async create(input) {
    const response = await api('/api/v1/activities', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return response.item;
  },

  async update(id, input) {
    const response = await api(activityPath(id), {
      method: 'PUT',
      body: JSON.stringify(input)
    });
    return response.item;
  },

  async archive(id) {
    const response = await api(activityPath(id), {
      method: 'DELETE'
    });
    return response.item;
  }
});
