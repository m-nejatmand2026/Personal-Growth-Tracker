const MODULE_ID =
  /^[a-z][a-z0-9-]*$/;

const SLOT_ID =
  /^[a-z][a-z0-9-]*$/;

const EVENT_ID =
  /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;

function assertUniqueStrings(values, label, pattern) {
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== 'string' || !pattern.test(value)) {
      throw new Error(`${label} contains invalid value: ${value}`);
    }
    if (seen.has(value)) {
      throw new Error(`${label} contains duplicate value: ${value}`);
    }
    seen.add(value);
  }
}

function validateModule(module) {
  if (!module || typeof module !== 'object') {
    throw new Error(
      'Invalid frontend module manifest.'
    );
  }

  if (!MODULE_ID.test(module.id || '')) {
    throw new Error(
      `Invalid frontend module id: ${module?.id}`
    );
  }

  if (
    !Number.isInteger(module.contractVersion)
    || module.contractVersion < 1
  ) {
    throw new Error(
      `Frontend module ${module.id} must declare contractVersion.`
    );
  }

  if (typeof module.defaultEnabled !== 'boolean') {
    throw new Error(
      `Frontend module ${module.id} must declare boolean defaultEnabled.`
    );
  }

  if (!Array.isArray(module.dependsOn)) {
    throw new Error(
      `Frontend module ${module.id} dependsOn must be an array.`
    );
  }

  if (!Array.isArray(module.slots)) {
    throw new Error(
      `Frontend module ${module.id} slots must be an array.`
    );
  }

  for (const field of ['publishes', 'subscribes']) {
    if (!Array.isArray(module[field])) {
      throw new Error(
        `Frontend module ${module.id} ${field} must be an array.`
      );
    }
  }

  assertUniqueStrings(
    module.publishes,
    `Frontend module ${module.id} published events`,
    EVENT_ID
  );
  assertUniqueStrings(
    module.subscribes,
    `Frontend module ${module.id} subscriptions`,
    EVENT_ID
  );

  const dependencies = new Set();

  for (const dependency of module.dependsOn) {
    if (!MODULE_ID.test(dependency)) {
      throw new Error(
        `Frontend module ${module.id} has invalid dependency ${dependency}.`
      );
    }

    if (dependencies.has(dependency)) {
      throw new Error(
        `Frontend module ${module.id} has duplicate dependency ${dependency}.`
      );
    }

    dependencies.add(dependency);
  }

  const slots = new Set();

  for (const slot of module.slots) {
    if (
      !slot
      || !SLOT_ID.test(slot.name || '')
      || !Number.isFinite(Number(slot.order))
    ) {
      throw new Error(
        `Frontend module ${module.id} has invalid slot metadata.`
      );
    }

    if (slots.has(slot.name)) {
      throw new Error(
        `Frontend module ${module.id} contributes duplicate slot ${slot.name}.`
      );
    }

    slots.add(slot.name);
  }
}

function orderModules(modulesById) {
  const result = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;

    if (visiting.has(id)) {
      throw new Error(
        `Frontend module dependency cycle detected at ${id}.`
      );
    }

    visiting.add(id);

    const module = modulesById.get(id);

    for (const dependency of module.dependsOn) {
      if (!modulesById.has(dependency)) {
        throw new Error(
          `Frontend module ${id} depends on missing module ${dependency}.`
        );
      }

      visit(dependency);
    }

    visiting.delete(id);
    visited.add(id);
    result.push(module);
  }

  for (const id of modulesById.keys()) {
    visit(id);
  }

  return result;
}

export function createFrontendModuleRegistry(
  modules
) {
  if (!Array.isArray(modules)) {
    throw new Error(
      'Frontend module catalog must be an array.'
    );
  }

  const modulesById = new Map();
  const publishedEventOwners = new Map();

  for (const module of modules) {
    validateModule(module);

    if (modulesById.has(module.id)) {
      throw new Error(
        `Duplicate frontend module id: ${module.id}`
      );
    }

    modulesById.set(
      module.id,
      Object.freeze(module)
    );

    for (const event of module.publishes) {
      if (publishedEventOwners.has(event)) {
        throw new Error(
          `Frontend event ${event} has multiple publishers: `
          + `${publishedEventOwners.get(event)} and ${module.id}.`
        );
      }
      publishedEventOwners.set(event, module.id);
    }
  }

  for (const module of modulesById.values()) {
    for (const event of module.subscribes) {
      const publisher = publishedEventOwners.get(event);
      if (!publisher) {
        throw new Error(
          `Frontend module ${module.id} subscribes to unpublished event ${event}.`
        );
      }
      if (publisher !== module.id && !module.dependsOn.includes(publisher)) {
        throw new Error(
          `Frontend module ${module.id} subscribes to ${event} without depending on ${publisher}.`
        );
      }
    }
  }

  const ordered =
    Object.freeze(orderModules(modulesById));

  function enabled(overrides = {}) {
    const memo = new Map();

    function isEnabled(id) {
      if (memo.has(id)) {
        return memo.get(id);
      }

      const module = modulesById.get(id);

      if (!module) return false;

      const requested =
        Object.prototype.hasOwnProperty.call(
          overrides,
          id
        )
          ? Boolean(overrides[id])
          : module.defaultEnabled;

      if (!requested) {
        memo.set(id, false);
        return false;
      }

      const dependenciesReady =
        module.dependsOn.every(isEnabled);

      memo.set(id, dependenciesReady);

      return dependenciesReady;
    }

    return ordered.filter(
      (module) => isEnabled(module.id)
    );
  }

  return Object.freeze({
    modules: ordered,

    has(id) {
      return modulesById.has(id);
    },

    get(id) {
      return modulesById.get(id) || null;
    },

    eventPublisher(event) {
      return publishedEventOwners.get(event) || null;
    },

    enabled,

    forSlot(slot, overrides = {}) {
      return enabled(overrides).filter(
        (module) =>
          module.slots.some(
            (item) => item.name === slot
          )
      );
    }
  });
}
