const EVENT_ID = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;

export function createEventBus() {
  const listeners = new Map();

  return Object.freeze({
    subscribe(event, handler) {
      if (!EVENT_ID.test(event || '')) throw new Error(`Invalid event id: ${event}`);
      if (typeof handler !== 'function') throw new Error('Event handler must be a function.');
      const handlers = listeners.get(event) || new Set();
      handlers.add(handler);
      listeners.set(event, handlers);
      return () => {
        handlers.delete(handler);
        if (!handlers.size) listeners.delete(event);
      };
    },
    async publish(event, payload) {
      if (!EVENT_ID.test(event || '')) throw new Error(`Invalid event id: ${event}`);
      const handlers = [...(listeners.get(event) || [])];
      for (const handler of handlers) await handler(payload);
    },
    clear() {
      listeners.clear();
    }
  });
}
