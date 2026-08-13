function routeKey(route) {
  const pattern = typeof route.pattern === 'string' ? route.pattern : route.pattern.toString();
  return `${route.method.toUpperCase()} ${pattern}`;
}

function validateModule(module) {
  if (!module || typeof module !== 'object') throw new Error('Invalid module manifest.');
  if (!/^[a-z][a-z0-9-]*$/.test(module.id || '')) throw new Error(`Invalid module id: ${module?.id}`);
  if (!Number.isInteger(module.contractVersion) || module.contractVersion < 1) {
    throw new Error(`Module ${module.id} must declare a positive integer contractVersion.`);
  }
  if (!Array.isArray(module.dependsOn)) throw new Error(`Module ${module.id} dependsOn must be an array.`);
  if (!Array.isArray(module.routes)) throw new Error(`Module ${module.id} routes must be an array.`);
  if (!Array.isArray(module.publishes)) throw new Error(`Module ${module.id} publishes must be an array.`);
  if (!Array.isArray(module.subscribes)) throw new Error(`Module ${module.id} subscribes must be an array.`);

  for (const route of module.routes) {
    if (!route || typeof route.handler !== 'function') throw new Error(`Module ${module.id} has an invalid route handler.`);
    if (!['GET','POST','PUT','PATCH','DELETE'].includes(String(route.method).toUpperCase())) {
      throw new Error(`Module ${module.id} has an invalid route method.`);
    }
    if (!(typeof route.pattern === 'string' || route.pattern instanceof RegExp)) {
      throw new Error(`Module ${module.id} has an invalid route pattern.`);
    }
  }
}

function assertAcyclic(modulesById) {
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Module dependency cycle detected at ${id}.`);
    visiting.add(id);
    const module = modulesById.get(id);
    for (const dependency of module.dependsOn) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of modulesById.keys()) visit(id);
}

export function createModuleRegistry(modules) {
  if (!Array.isArray(modules)) throw new Error('Module catalog must be an array.');

  const modulesById = new Map();
  const routeOwners = new Map();

  for (const module of modules) {
    validateModule(module);
    if (modulesById.has(module.id)) throw new Error(`Duplicate module id: ${module.id}`);
    modulesById.set(module.id, Object.freeze(module));
  }

  for (const module of modulesById.values()) {
    for (const dependency of module.dependsOn) {
      if (!modulesById.has(dependency)) throw new Error(`Module ${module.id} depends on missing module ${dependency}.`);
    }
    for (const route of module.routes) {
      const key = routeKey(route);
      if (routeOwners.has(key)) throw new Error(`Duplicate route registration: ${key}`);
      routeOwners.set(key, module.id);
    }
  }

  assertAcyclic(modulesById);

  const ordered = Object.freeze([...modulesById.values()]);

  return Object.freeze({
    modules: ordered,
    has(id) {
      return modulesById.has(id);
    },
    get(id) {
      return modulesById.get(id) || null;
    },
    match(method, path) {
      const normalizedMethod = String(method).toUpperCase();
      for (const module of ordered) {
        for (const route of module.routes) {
          if (String(route.method).toUpperCase() !== normalizedMethod) continue;
          const matches = typeof route.pattern === 'string'
            ? route.pattern === path
            : route.pattern.test(path);
          if (matches) return { module, route };
        }
      }
      return null;
    }
  });
}
