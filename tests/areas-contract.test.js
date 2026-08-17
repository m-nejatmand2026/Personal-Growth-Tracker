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
  'Areas is a self-owned root capability',
  () => {
    const workerRegistry =
      createModuleRegistry(
        platformModules
      );

    const frontendRegistry =
      createFrontendModuleRegistry(
        frontendModules
      );

    const workerArea =
      workerRegistry.get('areas');

    const frontendArea =
      frontendRegistry.get('areas');

    assert.ok(workerArea);
    assert.ok(frontendArea);

    assert.deepEqual(
      workerArea.dependsOn,
      []
    );

    assert.deepEqual(
      frontendArea.dependsOn,
      []
    );

    assert.deepEqual(
      workerArea.ownsTables,
      [
        'area_templates',
        'areas'
      ]
    );

    assert.deepEqual(
      workerArea.compatibilityTables,
      []
    );
  }
);

test(
  'Areas owns backend and frontend implementation files',
  async () => {
    assert.equal(
      await exists(
        new URL(
          '../worker/data/areas.js',
          import.meta.url
        )
      ),
      false
    );

    assert.equal(
      await exists(
        new URL(
          '../worker/routes/areas.js',
          import.meta.url
        )
      ),
      false
    );

    assert.equal(
      await exists(
        new URL(
          '../public/js/features/plan/areas.js',
          import.meta.url
        )
      ),
      false
    );

    assert.equal(
      await exists(
        new URL(
          '../worker/modules/areas/data.js',
          import.meta.url
        )
      ),
      true
    );

    assert.equal(
      await exists(
        new URL(
          '../worker/modules/areas/routes.js',
          import.meta.url
        )
      ),
      true
    );

    assert.equal(
      await exists(
        new URL(
          '../worker/modules/areas/public.js',
          import.meta.url
        )
      ),
      true
    );

    assert.equal(
      await exists(
        new URL(
          '../public/js/modules/areas/ui.js',
          import.meta.url
        )
      ),
      true
    );
  }
);

test(
  'Areas persistence never reads Goals or Activities internals',
  async () => {
    const data =
      await readFile(
        new URL(
          '../worker/modules/areas/data.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.doesNotMatch(
      data,
      /\b(?:FROM|JOIN)\s+goals\b/i
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
  'Goals references Areas only through Areas public contract',
  async () => {
    const routes =
      await readFile(
        new URL(
          '../worker/modules/goals/routes.js',
          import.meta.url
        ),
        'utf8'
      );

    const data =
      await readFile(
        new URL(
          '../worker/modules/goals/data.js',
          import.meta.url
        ),
        'utf8'
      );

    assert.match(
      routes,
      /areasContractV1/
    );

    assert.doesNotMatch(
      routes,
      /data\/areas\.js/
    );

    assert.doesNotMatch(
      data,
      /\b(?:FROM|JOIN)\s+areas\b/i
    );

    assert.doesNotMatch(
      data,
      /\bgoal_activities\b/i
    );
  }
);

test(
  'Areas frontend owns its UI and does not infer Goal analytics',
  async () => {
    const moduleSource =
      await readFile(
        new URL(
          '../public/js/modules/areas/module.js',
          import.meta.url
        ),
        'utf8'
      );

    const ui =
      await readFile(
        new URL(
          '../public/js/modules/areas/ui.js',
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
      /features\/plan\/areas/
    );

    assert.doesNotMatch(
      ui,
      /goal_count/
    );

    assert.doesNotMatch(
      ui,
      /models\.goals/
    );
  }
);
