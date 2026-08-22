import test from 'node:test';
import assert from 'node:assert/strict';

import {
  access,
  readFile
} from 'node:fs/promises';

import {
  createModuleRegistry
} from '../worker/platform/module-registry.js';

import {
  platformModules
} from '../worker/modules/catalog.js';

import {
  createFrontendModuleRegistry
} from '../public/js/platform/module-registry.js';

import {
  frontendModules
} from '../public/js/modules/catalog.js';

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

test(
  'Goals declares Areas as its only capability dependency',
  () => {
    const workerRegistry =
      createModuleRegistry(platformModules);

    const frontendRegistry =
      createFrontendModuleRegistry(
        frontendModules
      );

    const worker =
      workerRegistry.get('goals');

    const frontend =
      frontendRegistry.get('goals');

    assert.ok(worker);
    assert.ok(frontend);

    assert.deepEqual(
      worker.dependsOn,
      ['areas']
    );

    assert.deepEqual(
      frontend.dependsOn,
      ['areas']
    );

    assert.deepEqual(
      worker.ownsTables,
      ['goals']
    );

    assert.deepEqual(
      worker.compatibilityTables,
      []
    );
  }
);

test(
  'Goals owns all current Version 1 implementation files',
  async () => {
    for (const oldPath of [
      '../worker/data/goals.js',
      '../worker/routes/goals.js',
      '../public/js/features/plan/goals.js'
    ]) {
      assert.equal(
        await exists(
          new URL(
            oldPath,
            import.meta.url
          )
        ),
        false,
        `${oldPath} must not remain`
      );
    }

    for (const ownedPath of [
      '../worker/modules/goals/data.js',
      '../worker/modules/goals/routes.js',
      '../worker/modules/goals/public.js',
      '../public/js/modules/goals/module.js',
      '../public/js/modules/goals/ui.js'
    ]) {
      assert.equal(
        await exists(
          new URL(
            ownedPath,
            import.meta.url
          )
        ),
        true,
        `${ownedPath} must exist`
      );
    }
  }
);

test(
  'Goals persistence accesses only its owned Goals table',
  async () => {
    const data =
      await readFile(
        new URL(
          '../worker/modules/goals/data.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      data,
      /\bFROM\s+goals\b/i
    );

    assert.doesNotMatch(
      data,
      /\b(?:FROM|JOIN)\s+areas\b/i
    );

    assert.doesNotMatch(
      data,
      /\bgoal_activities\b/i
    );

    assert.doesNotMatch(
      data,
      /\bprogress_records\b/i
    );

    assert.doesNotMatch(
      data,
      /\bsessions\b/i
    );
  }
);

test(
  'Goals reaches Areas only through Areas public contract',
  async () => {
    const routes =
      await readFile(
        new URL(
          '../worker/modules/goals/routes.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      routes,
      /areasContractV1/
    );

    assert.match(
      routes,
      /from '\.\.\/areas\/public\.js'/
    );

    assert.doesNotMatch(
      routes,
      /areas\/data\.js/
    );

    assert.doesNotMatch(
      routes,
      /areas\/routes\.js/
    );

    assert.doesNotMatch(
      routes,
      /\b(?:FROM|JOIN)\s+areas\b/i
    );
  }
);

test(
  'Goals public contract is narrow and contains no SQL',
  async () => {
    const contract =
      await readFile(
        new URL(
          '../worker/modules/goals/public.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      contract,
      /from '.\/data\.js'/
    );

    assert.match(
      contract,
      /goalsContractV1/
    );

    assert.match(
      contract,
      /getReference/
    );

    assert.match(
      contract,
      /listReferences/
    );

    assert.doesNotMatch(
      contract,
      /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i
    );
  }
);

test(
  'Activities consumes Goals public contract only',
  async () => {
    const routes =
      await readFile(
        new URL(
          '../worker/modules/activities/routes.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      routes,
      /from '\.\.\/goals\/public\.js'/
    );

    assert.doesNotMatch(
      routes,
      /goals\/data\.js/
    );

    assert.doesNotMatch(
      routes,
      /goals\/routes\.js/
    );

    assert.doesNotMatch(
      routes,
      /goals\/module\.js/
    );
  }
);

test(
  'Goals frontend owns its UI and receives Areas through composition',
  async () => {
    const moduleSource =
      await readFile(
        new URL(
          '../public/js/modules/goals/module.js',
          import.meta.url
        ),
        'utf8'
      );

    const ui =
      await readFile(
        new URL(
          '../public/js/modules/goals/ui.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      moduleSource,
      /from '.\/ui\.js'/
    );

    assert.doesNotMatch(
      moduleSource,
      /features\/plan\/goals/
    );

    assert.doesNotMatch(
      moduleSource,
      /modules\/areas/
    );

    assert.doesNotMatch(
      ui,
      /modules\/areas/
    );

    // The composition root supplies the already-loaded
    // Areas model. Goals does not import Areas UI internals.
    assert.match(
      moduleSource,
      /models\.areas/
    );
  }
);

test(
  'Goals frontend bind contract matches its owned UI',
  async () => {
    const moduleSource =
      await readFile(
        new URL(
          '../public/js/modules/goals/module.js',
          import.meta.url
        ),
        'utf8'
      );

    const ui =
      await readFile(
        new URL(
          '../public/js/modules/goals/ui.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      ui,
      /bindGoalsPanel\s*\(\s*model\s*,\s*\{\s*reloadPlatform\s*\}/s
    );

    assert.match(
      moduleSource,
      /bindGoalsPanel\s*\(\s*model\s*,\s*\{\s*reloadPlatform:\s*reload\s*\}/s
    );
  }
);

test(
  'Disabling Areas removes Goals dependency chain but leaves unrelated capabilities',
  () => {
    const workerRegistry =
      createModuleRegistry(
        platformModules
      );

    const ids =
      workerRegistry
        .enabled({
          areas: false
        })
        .map(
          (module) => module.id
        );

    for (const disabled of [
      'areas',
      'goals',
      'activities',
      'plans',
      'capacity'
    ]) {
      assert.equal(
        ids.includes(disabled),
        false,
        `${disabled} should be unavailable`
      );
    }

    assert.equal(
      ids.includes('daily-plan'),
      true
    );

    assert.equal(
      ids.includes('journal'),
      true
    );
  }
);
