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
  'Capacity declares Plans as its only capability dependency',
  () => {
    const worker =
      createModuleRegistry(
        platformModules
      ).get('capacity');

    const frontend =
      createFrontendModuleRegistry(
        frontendModules
      ).get('capacity');

    assert.ok(worker);
    assert.ok(frontend);

    assert.deepEqual(
      worker.dependsOn,
      ['plans']
    );

    assert.deepEqual(
      frontend.dependsOn,
      ['plans']
    );

    assert.deepEqual(
      worker.ownsTables,
      ['capacity_commitments']
    );

    assert.deepEqual(
      worker.compatibilityTables,
      []
    );
  }
);

test(
  'Capacity owns persistence domain routes and frontend UI',
  async () => {
    for (const oldPath of [
      '../worker/data/capacity.js',
      '../worker/domain/capacity.js',
      '../worker/routes/capacity.js',
      '../public/js/features/plan/capacity.js'
    ]) {
      assert.equal(
        await exists(
          new URL(
            oldPath,
            import.meta.url
          )
        ),
        false
      );
    }

    for (const ownedPath of [
      '../worker/modules/capacity/data.js',
      '../worker/modules/capacity/domain.js',
      '../worker/modules/capacity/routes.js',
      '../worker/modules/capacity/public.js',
      '../public/js/modules/capacity/ui.js'
    ]) {
      assert.equal(
        await exists(
          new URL(
            ownedPath,
            import.meta.url
          )
        ),
        true
      );
    }
  }
);

test(
  'Capacity SQL accesses only capacity_commitments',
  async () => {
    const data =
      await readFile(
        new URL(
          '../worker/modules/capacity/data.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      data,
      /capacity_commitments/
    );

    assert.doesNotMatch(
      data,
      /\b(?:FROM|JOIN)\s+plan_versions\b/i
    );

    assert.doesNotMatch(
      data,
      /\b(?:FROM|JOIN)\s+goal_plan_values\b/i
    );

    assert.doesNotMatch(
      data,
      /\b(?:FROM|JOIN)\s+goals\b/i
    );
  }
);

test(
  'Capacity obtains Plan allocations only from Plans public contract',
  async () => {
    const data =
      await readFile(
        new URL(
          '../worker/modules/capacity/data.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      data,
      /plansContractV1/
    );

    assert.match(
      data,
      /from '\.\.\/plans\/public\.js'/
    );

    assert.doesNotMatch(
      data,
      /plans\/data\.js/
    );

    assert.doesNotMatch(
      data,
      /goalsContractV1/
    );

    assert.doesNotMatch(
      data,
      /goals\/public\.js/
    );
  }
);

test(
  'Plans public contract supplies Capacity allocation read model through declared Goals dependency',
  async () => {
    const source =
      await readFile(
        new URL(
          '../worker/modules/plans/public.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      source,
      /getActiveAllocationsForRange/
    );

    assert.match(
      source,
      /goalsContractV1/
    );

    assert.match(
      source,
      /from '\.\.\/goals\/public\.js'/
    );

    assert.doesNotMatch(
      source,
      /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i
    );
  }
);

test(
  'Capacity routes delegate persistence instead of embedding SQL',
  async () => {
    const source =
      await readFile(
        new URL(
          '../worker/modules/capacity/routes.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      source,
      /getCapacityCommitment/
    );

    assert.doesNotMatch(
      source,
      /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i
    );
  }
);

test(
  'Capacity public contract is narrow and SQL-free',
  async () => {
    const source =
      await readFile(
        new URL(
          '../worker/modules/capacity/public.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      source,
      /capacityContractV1/
    );

    assert.match(
      source,
      /getSummary/
    );

    assert.match(
      source,
      /listCommitments/
    );

    assert.doesNotMatch(
      source,
      /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i
    );
  }
);

test(
  'Capacity frontend owns its UI',
  async () => {
    const moduleSource =
      await readFile(
        new URL(
          '../public/js/modules/capacity/module.js',
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
      /features\/plan\/capacity/
    );
  }
);

test(
  'Disabling Plans disables Capacity without disabling unrelated capabilities',
  () => {
    const ids =
      createModuleRegistry(
        platformModules
      )
        .enabled({
          plans: false
        })
        .map(
          (module) => module.id
        );

    assert.equal(
      ids.includes('capacity'),
      false
    );

    assert.equal(
      ids.includes('daily-plan'),
      true
    );

    assert.equal(
      ids.includes('journal'),
      true
    );

    assert.equal(
      ids.includes('areas'),
      true
    );

    assert.equal(
      ids.includes('goals'),
      true
    );
  }
);
