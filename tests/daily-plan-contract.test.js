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
  'Daily Plan is an independent root capability',
  () => {
    const worker =
      createModuleRegistry(
        platformModules
      ).get('daily-plan');

    const frontend =
      createFrontendModuleRegistry(
        frontendModules
      ).get('daily-plan');

    assert.ok(worker);
    assert.ok(frontend);

    assert.deepEqual(
      worker.dependsOn,
      []
    );

    assert.deepEqual(
      frontend.dependsOn,
      []
    );

    assert.deepEqual(
      worker.ownsTables,
      ['daily_plan_items']
    );

    assert.deepEqual(
      worker.compatibilityTables,
      []
    );
  }
);

test(
  'Daily Plan owns backend persistence domain and routes',
  async () => {
    for (const oldPath of [
      '../worker/data/daily-plan.js',
      '../worker/domain/daily-plan.js',
      '../worker/routes/daily-plan.js'
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
      '../worker/modules/daily-plan/data.js',
      '../worker/modules/daily-plan/domain.js',
      '../worker/modules/daily-plan/routes.js',
      '../worker/modules/daily-plan/public.js'
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
  'Daily Plan persistence touches only daily_plan_items',
  async () => {
    const data =
      await readFile(
        new URL(
          '../worker/modules/daily-plan/data.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      data,
      /daily_plan_items/
    );

    assert.doesNotMatch(
      data,
      /\bgoal_activities\b/
    );

    assert.doesNotMatch(
      data,
      /\bprogress_records\b/
    );

    assert.doesNotMatch(
      data,
      /\bsessions\b/
    );

    assert.doesNotMatch(
      data,
      /\bgoals\b/
    );
  }
);

test(
  'Daily Plan public contract is narrow and SQL-free',
  async () => {
    const source =
      await readFile(
        new URL(
          '../worker/modules/daily-plan/public.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      source,
      /dailyPlanContractV1/
    );

    assert.match(
      source,
      /from '.\/data\.js'/
    );

    assert.match(
      source,
      /getReference/
    );

    assert.match(
      source,
      /listForDate/
    );

    assert.doesNotMatch(
      source,
      /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i
    );
  }
);

test(
  'Daily Plan does not depend on Activities Logger or Progress',
  async () => {
    const workerFiles = [
      '../worker/modules/daily-plan/data.js',
      '../worker/modules/daily-plan/domain.js',
      '../worker/modules/daily-plan/routes.js',
      '../worker/modules/daily-plan/public.js'
    ];

    for (const file of workerFiles) {
      const source =
        await readFile(
          new URL(
            file,
            import.meta.url
          ),
          'utf8'
        );

      assert.doesNotMatch(
        source,
        /modules\/activities/
      );

      assert.doesNotMatch(
        source,
        /modules\/progress/
      );

      assert.doesNotMatch(
        source,
        /sessions/
      );
    }

    const frontend =
      await readFile(
        new URL(
          '../public/js/modules/daily-plan/module.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.doesNotMatch(
      frontend,
      /features\/logger/
    );

    assert.doesNotMatch(
      frontend,
      /openLogger/
    );

    assert.doesNotMatch(
      frontend,
      /modules\/activities/
    );
  }
);

test(
  'Daily Plan completion uses a named fact event instead of Logger callback coupling',
  async () => {
    const frontend =
      await readFile(
        new URL(
          '../public/js/modules/daily-plan/module.js',
          import.meta.url
        ),
        'utf8'
      );

    const app =
      await readFile(
        new URL(
          '../public/js/app.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      frontend,
      /daily-plan\.completion-requested/
    );

    assert.match(
      frontend,
      /events\?\.publish/
    );

    assert.doesNotMatch(
      frontend,
      /openLogger/
    );

    assert.match(
      app,
      /createEventBus/
    );

    assert.match(
      app,
      /eventBus\.subscribe\(\s*['"]daily-plan\.completion-requested['"]/s
    );

    assert.match(
      app,
      /logger\.open\(input\)/
    );
  }
);

test(
  'Daily Plan activity fields remain optional snapshots not module dependency',
  async () => {
    const domain =
      await readFile(
        new URL(
          '../worker/modules/daily-plan/domain.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      domain,
      /activity_key/
    );

    assert.match(
      domain,
      /activity_label/
    );

    assert.doesNotMatch(
      domain,
      /activity.*required/i
    );

    assert.doesNotMatch(
      domain,
      /activitiesContractV1/
    );
  }
);

test(
  'Disabling Daily Plan does not disable unrelated capabilities',
  () => {
    const ids =
      createModuleRegistry(
        platformModules
      )
        .enabled({
          'daily-plan': false
        })
        .map(
          (module) => module.id
        );

    assert.equal(
      ids.includes('daily-plan'),
      false
    );

    assert.equal(
      ids.includes('areas'),
      true
    );

    assert.equal(
      ids.includes('goals'),
      true
    );

    assert.equal(
      ids.includes('plans'),
      true
    );

    assert.equal(
      ids.includes('capacity'),
      true
    );

    assert.equal(
      ids.includes('journal'),
      true
    );
  }
);
