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
  'Plans declares Goals as its only capability dependency',
  () => {
    const worker =
      createModuleRegistry(
        platformModules
      ).get('plans');

    const frontend =
      createFrontendModuleRegistry(
        frontendModules
      ).get('plans');

    assert.ok(worker);
    assert.ok(frontend);

    assert.deepEqual(
      worker.dependsOn,
      ['goals']
    );

    assert.deepEqual(
      frontend.dependsOn,
      ['goals']
    );

    assert.deepEqual(
      worker.ownsTables,
      [
        'plan_versions',
        'goal_plan_values'
      ]
    );

    assert.deepEqual(
      worker.compatibilityTables,
      []
    );
  }
);

test(
  'Plans owns backend and frontend implementation files',
  async () => {
    for (const oldPath of [
      '../worker/data/plans.js',
      '../worker/routes/plans.js',
      '../public/js/features/plan/budgets.js'
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
      '../worker/modules/plans/data.js',
      '../worker/modules/plans/routes.js',
      '../worker/modules/plans/public.js',
      '../public/js/modules/plans/ui.js'
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
  'Plans persistence reads and writes only Plans-owned tables',
  async () => {
    const data =
      await readFile(
        new URL(
          '../worker/modules/plans/data.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      data,
      /\bplan_versions\b/
    );

    assert.match(
      data,
      /\bgoal_plan_values\b/
    );

    assert.doesNotMatch(
      data,
      /\b(?:FROM|JOIN)\s+goals\b/i
    );

    assert.doesNotMatch(
      data,
      /\bareas\b/
    );

    assert.doesNotMatch(
      data,
      /domain\/capacity/
    );
  }
);

test(
  'Plans validates and enriches Goal references through Goals public contract only',
  async () => {
    const routes =
      await readFile(
        new URL(
          '../worker/modules/plans/routes.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      routes,
      /goalsContractV1/
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
      /\b(?:FROM|JOIN)\s+goals\b/i
    );
  }
);

test(
  'Plans uses platform date utilities rather than Capacity internals',
  async () => {
    const data =
      await readFile(
        new URL(
          '../worker/modules/plans/data.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      data,
      /core\/dates\.js/
    );

    assert.doesNotMatch(
      data,
      /capacity/
    );
  }
);

test(
  'Plans public contract is narrow and contains no SQL',
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
      /from '.\/data\.js'/
    );

    assert.match(
      source,
      /plansContractV1/
    );

    assert.match(
      source,
      /getForDate/
    );

    assert.doesNotMatch(
      source,
      /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i
    );
  }
);

test(
  'Plans frontend owns budget UI and receives Goals through composition',
  async () => {
    const moduleSource =
      await readFile(
        new URL(
          '../public/js/modules/plans/module.js',
          import.meta.url
        ),
        'utf8'
      );

    const ui =
      await readFile(
        new URL(
          '../public/js/modules/plans/ui.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      moduleSource,
      /from '.\/ui\.js'/
    );

    assert.match(
      moduleSource,
      /models\.goals/
    );

    assert.doesNotMatch(
      moduleSource,
      /features\/plan\/budgets/
    );

    assert.doesNotMatch(
      ui,
      /modules\/goals/
    );
  }
);

test(
  'Disabling Goals removes Plans and Capacity but leaves unrelated modules',
  () => {
    const ids =
      createModuleRegistry(
        platformModules
      )
        .enabled({
          goals: false
        })
        .map(
          (module) => module.id
        );

    assert.equal(
      ids.includes('plans'),
      false
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
  }
);
