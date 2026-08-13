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
  'Journal is an independent root capability',
  () => {
    const worker =
      createModuleRegistry(
        platformModules
      ).get('journal');

    const frontend =
      createFrontendModuleRegistry(
        frontendModules
      ).get('journal');

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
      ['journal_entries']
    );

    assert.deepEqual(
      worker.compatibilityTables,
      []
    );
  }
);

test(
  'Journal owns persistence domain routes and public contract',
  async () => {
    for (const oldPath of [
      '../worker/data/journal.js',
      '../worker/domain/journal.js',
      '../worker/routes/journal.js'
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
      '../worker/modules/journal/data.js',
      '../worker/modules/journal/domain.js',
      '../worker/modules/journal/routes.js',
      '../worker/modules/journal/public.js'
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
  'Journal persistence accesses journal_entries only',
  async () => {
    const data =
      await readFile(
        new URL(
          '../worker/modules/journal/data.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      data,
      /\bjournal_entries\b/
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

    assert.doesNotMatch(
      data,
      /\bgoal_activities\b/
    );
  }
);

test(
  'Journal public contract remains SQL-free',
  async () => {
    const source =
      await readFile(
        new URL(
          '../worker/modules/journal/public.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      source,
      /journalContractV1/
    );

    assert.match(
      source,
      /exportJournalV1/
    );

    assert.doesNotMatch(
      source,
      /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i
    );
  }
);

test(
  'Journal frontend does not couple to Progress Insights AI or private modules',
  async () => {
    const source =
      await readFile(
        new URL(
          '../public/js/modules/journal/module.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.doesNotMatch(
      source,
      /modules\/(?:goals|activities|plans|capacity|daily-plan)/
    );

    assert.doesNotMatch(
      source,
      /features\/(?:progress|insights|logger)/
    );

    assert.match(
      source,
      /not used by Progress, Insights or AI/
    );
  }
);

test(
  'Journal navigation request is event-based',
  async () => {
    const source =
      await readFile(
        new URL(
          '../public/js/modules/journal/module.js',
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
      source,
      /journal\.view-requested/
    );

    assert.match(
      source,
      /events\?\.publish/
    );

    assert.doesNotMatch(
      source,
      /openView/
    );

    assert.match(
      app,
      /eventBus\.subscribe\(\s*['"]journal\.view-requested['"]/s
    );
  }
);

test(
  'Disabling Journal leaves every unrelated capability available',
  () => {
    const ids =
      createModuleRegistry(
        platformModules
      )
        .enabled({
          journal: false
        })
        .map(
          module => module.id
        );

    assert.equal(
      ids.includes('journal'),
      false
    );

    for (const id of [
      'areas',
      'goals',
      'activities',
      'plans',
      'capacity',
      'daily-plan'
    ]) {
      assert.equal(
        ids.includes(id),
        true,
        `${id} should remain enabled`
      );
    }
  }
);
