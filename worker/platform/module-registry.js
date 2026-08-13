const MODULE_ID =
  /^[a-z][a-z0-9-]*$/;

const EVENT_ID =
  /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;

const TABLE_ID =
  /^[a-z][a-z0-9_]*$/;

function routeKey(route) {
  const pattern =
    typeof route.pattern === 'string'
      ? route.pattern
      : route.pattern.toString();

  return `${route.method.toUpperCase()} ${pattern}`;
}

function assertUniqueStrings(values, label, pattern) {
  const seen = new Set();

  for (const value of values) {
    if (
      typeof value !== 'string'
      || !pattern.test(value)
    ) {
      throw new Error(
        `${label} contains invalid value: ${value}`
      );
    }

    if (seen.has(value)) {
      throw new Error(
        `${label} contains duplicate value: ${value}`
      );
    }

    seen.add(value);
  }
}

function validateModule(module) {
  if (!module || typeof module !== 'object') {
    throw new Error('Invalid module manifest.');
  }

  if (!MODULE_ID.test(module.id || '')) {
    throw new Error(
      `Invalid module id: ${module?.id}`
    );
  }

  if (
    !Number.isInteger(module.contractVersion)
    || module.contractVersion < 1
  ) {
    throw new Error(
      `Module ${module.id} must declare a positive integer contractVersion.`
    );
  }

  if (typeof module.defaultEnabled !== 'boolean') {
    throw new Error(
      `Module ${module.id} must declare boolean defaultEnabled.`
    );
  }

  for (const field of [
    'dependsOn',
    'routes',
    'publishes',
    'subscribes',
    'ownsTables',
    'compatibilityTables'
  ]) {
    if (!Array.isArray(module[field])) {
      throw new Error(
        `Module ${module.id} ${field} must be an array.`
      );
    }
  }

  assertUniqueStrings(
    module.dependsOn,
    `Module ${module.id} dependencies`,
    MODULE_ID
  );

  assertUniqueStrings(
    module.publishes,
    `Module ${module.id} published events`,
    EVENT_ID
  );

  assertUniqueStrings(
    module.subscribes,
    `Module ${module.id} subscriptions`,
    EVENT_ID
  );

  assertUniqueStrings(
    module.ownsTables,
    `Module ${module.id} owned tables`,
    TABLE_ID
  );

  assertUniqueStrings(
    module.compatibilityTables,
    `Module ${module.id} compatibility tables`,
    TABLE_ID
  );

  for (const table of module.compatibilityTables) {
    if (module.ownsTables.includes(table)) {
      throw new Error(
        `Module ${module.id} cannot both own and mark ${table} as compatibility-only.`
      );
    }
  }

  for (const route of module.routes) {
    if (
      !route
      || typeof route.handler !== 'function'
    ) {
      throw new Error(
        `Module ${module.id} has an invalid route handler.`
      );
    }

    if (
      !['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
        .includes(String(route.method).toUpperCase())
    ) {
      throw new Error(
        `Module ${module.id} has an invalid route method.`
      );
    }

    if (
      !(
        typeof route.pattern === 'string'
        || route.pattern instanceof RegExp
      )
    ) {
      throw new Error(
        `Module ${module.id} has an invalid route pattern.`
      );
    }

    if (
      route.pattern instanceof RegExp
      && (route.pattern.global || route.pattern.sticky)
    ) {
      throw new Error(
        `Module ${module.id} route regex cannot use global/sticky state.`
      );
    }
  }
}

function assertAcyclic(modulesById) {
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;

    if (visiting.has(id)) {
      throw new Error(
        `Module dependency cycle detected at ${id}.`
      );
    }

    visiting.add(id);

    const module = modulesById.get(id);

    for (const dependency of module.dependsOn) {
      visit(dependency);
    }

    visiting.delete(id);
    visited.add(id);
  }

  for (const id of modulesById.keys()) {
    visit(id);
  }
}

export function createModuleRegistry(modules) {
  if (!Array.isArray(modules)) {
    throw new Error(
      'Module catalog must be an array.'
    );
  }

  const modulesById = new Map();
  const routeOwners = new Map();
  const tableOwners = new Map();
  const publishedEventOwners = new Map();

  for (const module of modules) {
    validateModule(module);

    if (modulesById.has(module.id)) {
      throw new Error(
        `Duplicate module id: ${module.id}`
      );
    }

    modulesById.set(
      module.id,
      Object.freeze(module)
    );
  }

  for (const module of modulesById.values()) {
    for (const dependency of module.dependsOn) {
      if (!modulesById.has(dependency)) {
        throw new Error(
          `Module ${module.id} depends on missing module ${dependency}.`
        );
      }
    }

    for (const route of module.routes) {
      const key = routeKey(route);

      if (routeOwners.has(key)) {
        throw new Error(
          `Duplicate route registration: ${key}`
        );
      }

      routeOwners.set(key, module.id);
    }

    for (const table of module.ownsTables) {
      if (tableOwners.has(table)) {
        throw new Error(
          `Database table ${table} has multiple owners: `
          + `${tableOwners.get(table)} and ${module.id}.`
        );
      }

      tableOwners.set(table, module.id);
    }

    for (const event of module.publishes) {
      if (publishedEventOwners.has(event)) {
        throw new Error(
          `Domain event ${event} has multiple publishers: `
          + `${publishedEventOwners.get(event)} and ${module.id}.`
        );
      }

      publishedEventOwners.set(
        event,
        module.id
      );
    }
  }

  for (const module of modulesById.values()) {
    for (
      const table
      of module.compatibilityTables
    ) {
      const owner = tableOwners.get(table);

      if (owner && owner !== module.id) {
        throw new Error(
          `Module ${module.id} marks owned table ${table} as compatibility-only; `
          + `real owner is ${owner}.`
        );
      }
    }
  }

  assertAcyclic(modulesById);

  const ordered =
    Object.freeze([...modulesById.values()]);

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

    tableOwner(table) {
      return tableOwners.get(table) || null;
    },

    eventPublisher(event) {
      return publishedEventOwners.get(event) || null;
    },

    enabled,

    match(
      method,
      path,
      { overrides = {} } = {}
    ) {
      const normalizedMethod =
        String(method).toUpperCase();

      const enabledIds = new Set(
        enabled(overrides).map(
          (module) => module.id
        )
      );

      for (const module of ordered) {
        if (!enabledIds.has(module.id)) {
          continue;
        }

        for (const route of module.routes) {
          if (
            String(route.method).toUpperCase()
            !== normalizedMethod
          ) {
            continue;
          }

          const matches =
            typeof route.pattern === 'string'
              ? route.pattern === path
              : route.pattern.test(path);

          if (matches) {
            return {
              module,
              route
            };
          }
        }
      }

      return null;
    }
  });
}
