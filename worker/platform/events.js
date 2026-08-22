const EVENT_ID = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;

/**
 * Build the Worker-side event dispatcher from manifest-declared subscriptions.
 *
 * Manifests contain event IDs only. Runtime handlers are injected separately so
 * importing a module manifest has no hidden side effects and publishers never
 * know their subscribers.
 *
 * handlers shape:
 * {
 *   'subscriber-module': {
 *     'domain.fact': async ({ event, payload, context, subscriberModuleId }) => {}
 *   }
 * }
 */
export function createEventDispatcher(modules, handlers = {}) {
  const subscriptions = new Map();

  for (const module of modules) {
    for (const event of module.subscribes || []) {
      if (!EVENT_ID.test(event || '')) {
        throw new Error(`Module ${module.id} declares invalid event ${event}.`);
      }

      const handler = handlers?.[module.id]?.[event];

      if (typeof handler !== 'function') {
        throw new Error(
          `Module ${module.id} has no runtime handler for declared subscription ${event}.`
        );
      }

      const items = subscriptions.get(event) || [];
      items.push(Object.freeze({ moduleId: module.id, handler }));
      subscriptions.set(event, items);
    }

    for (const event of module.publishes || []) {
      if (!EVENT_ID.test(event)) {
        throw new Error(`Module ${module.id} declares invalid published event ${event}.`);
      }
    }
  }

  return Object.freeze({
    async emit(event, payload, context) {
      if (!EVENT_ID.test(event || '')) {
        throw new Error(`Invalid event id: ${event}`);
      }

      const eventHandlers = subscriptions.get(event) || [];

      for (const subscription of eventHandlers) {
        await subscription.handler({
          event,
          payload,
          context,
          subscriberModuleId: subscription.moduleId
        });
      }
    }
  });
}
