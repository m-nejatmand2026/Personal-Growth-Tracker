function validateModule(module) {
  if (!module || typeof module !== 'object') throw new Error('Invalid frontend module manifest.');
  if (!/^[a-z][a-z0-9-]*$/.test(module.id || '')) throw new Error(`Invalid frontend module id: ${module?.id}`);
  if (!Number.isInteger(module.contractVersion) || module.contractVersion < 1) {
    throw new Error(`Frontend module ${module.id} must declare contractVersion.`);
  }
  if (!Array.isArray(module.dependsOn)) throw new Error(`Frontend module ${module.id} dependsOn must be an array.`);
  if (!Array.isArray(module.slots)) throw new Error(`Frontend module ${module.id} slots must be an array.`);
}

function orderModules(modulesById) {
  const result = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Frontend module dependency cycle detected at ${id}.`);
    visiting.add(id);
    const module = modulesById.get(id);
    for (const dependency of module.dependsOn) {
      if (!modulesById.has(dependency)) throw new Error(`Frontend module ${id} depends on missing module ${dependency}.`);
      visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
    result.push(module);
  }

  for (const id of modulesById.keys()) visit(id);
  return result;
}

export function createFrontendModuleRegistry(modules) {
  const modulesById = new Map();
  for (const module of modules) {
    validateModule(module);
    if (modulesById.has(module.id)) throw new Error(`Duplicate frontend module id: ${module.id}`);
    modulesById.set(module.id, Object.freeze(module));
  }

  const ordered = Object.freeze(orderModules(modulesById));

  return Object.freeze({
    modules: ordered,
    has(id) {
      return modulesById.has(id);
    },
    get(id) {
      return modulesById.get(id) || null;
    },
    forSlot(slot) {
      return ordered.filter((module) => module.slots.some((item) => item.name === slot));
    }
  });
}
