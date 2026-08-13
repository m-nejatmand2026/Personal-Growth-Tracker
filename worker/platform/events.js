const EVENT_ID = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;

export function createEventDispatcher(modules) {
  const subscriptions = new Map();

  for (const module of modules) {
    for (const subscription of module.subscribes || []) {
      if (!EVENT_ID.test(subscription.event || '')) {
        throw new Error(`Module ${module.id} declares invalid event ${subscription.event}.`);
      }
      if (typeof subscription.handler !== 'function') {
        throw new Error(`Module ${module.id} has invalid handler for ${subscription.event}.`);
      }
      const items = subscriptions.get(subscription.event) || [];
      items.push(Object.freeze({ moduleId: module.id, handler: subscription.handler }));
      subscriptions.set(subscription.event, items);
    }

    for (const event of module.publishes || []) {
      if (!EVENT_ID.test(event)) throw new Error(`Module ${module.id} declares invalid published event ${event}.`);
    }
  }

  return Object.freeze({
    async emit(event, payload, context) {
      if (!EVENT_ID.test(event || '')) throw new Error(`Invalid event id: ${event}`);
      const handlers = subscriptions.get(event) || [];
      for (const subscription of handlers) {
        await subscription.handler({ event, payload, context, subscriberModuleId: subscription.moduleId });
      }
    }
  });
}
