import test from 'node:test';
import assert from 'node:assert/strict';

import {
  readFile
} from 'node:fs/promises';

import {
  createModuleRegistry
} from '../worker/platform/module-registry.js';

import {
  platformModules
} from '../worker/modules/catalog.js';

const data =
  await readFile(
    new URL(
      '../worker/modules/progress/data.js',
      import.meta.url
    ),
    'utf8'
  );

const publicContract =
  await readFile(
    new URL(
      '../worker/modules/progress/public.js',
      import.meta.url
    ),
    'utf8'
  );

const routes =
  await readFile(
    new URL(
      '../worker/modules/progress/routes.js',
      import.meta.url
    ),
    'utf8'
  );

const activitiesPublic =
  await readFile(
    new URL(
      '../worker/modules/activities/public.js',
      import.meta.url
    ),
    'utf8'
  );

const logger =
  await readFile(
    new URL(
      '../public/js/features/logger.js',
      import.meta.url
    ),
    'utf8'
  );

test(
  'Progress is a registered Activities-dependent Version 1 capability',
  () => {
    const progress =
      createModuleRegistry(
        platformModules
      ).get('progress');

    assert.ok(progress);

    assert.deepEqual(
      progress.dependsOn,
      ['activities']
    );

    assert.deepEqual(
      progress.ownsTables,
      ['progress_records']
    );

    assert.deepEqual(
      progress.compatibilityTables,
      ['sessions']
    );
  }
);

test(
  'Progress persistence owns canonical records and never creates legacy sessions',
  () => {
    assert.match(
      data,
      /\bINSERT\s+INTO\s+progress_records\b/i
    );

    assert.match(
      data,
      /\bFROM\s+progress_records\b/i
    );

    assert.match(
      data,
      /\bFROM\s+sessions\b/i
    );

    assert.doesNotMatch(
      data,
      /\bINSERT\s+INTO\s+sessions\b/i
    );

    assert.doesNotMatch(
      data,
      /\bUPDATE\s+sessions\b/i
    );
  }
);

test(
  'Legacy sessions are isolated to the original default profile',
  () => {
    assert.match(
      data,
      /profileId\s*!==\s*['"]default['"]/
    );

    assert.match(
      data,
      /return \[\]/
    );
  }
);

test(
  'Progress resolves Activity and Goal identity only through Activities public contract',
  () => {
    assert.match(
      publicContract,
      /activitiesContractV1/
    );

    assert.match(
      publicContract,
      /from '\.\.\/activities\/public\.js'/
    );

    assert.doesNotMatch(
      publicContract,
      /activities\/data\.js/
    );

    assert.doesNotMatch(
      publicContract,
      /\b(?:FROM|JOIN)\s+goal_activities\b/i
    );

    assert.doesNotMatch(
      publicContract,
      /\b(?:FROM|JOIN)\s+goals\b/i
    );
  }
);

test(
  'Activities public contract supports historical archived references',
  () => {
    assert.match(
      activitiesPublic,
      /includeArchived\s*=\s*false/
    );

    assert.match(
      activitiesPublic,
      /includeArchived/
    );
  }
);

test(
  'Progress API writes canonical factual records',
  () => {
    assert.match(
      routes,
      /createProgressRoute/
    );

    assert.match(
      routes,
      /progressContractV1/
    );

    assert.match(
      routes,
      /createFromActivityKey/
    );

    assert.match(
      routes,
      /deleteProgressRecord/
    );

    assert.doesNotMatch(
      routes,
      /\bINSERT\s+INTO\s+sessions\b/i
    );
  }
);

test(
  'Logger legacy Done path remains explicit debt until Stage 2',
  () => {
    assert.match(
      logger,
      /\/api\/session/
    );

    assert.doesNotMatch(
      logger,
      /\/api\/v1\/progress/
    );
  }
);

test(
  'Disabling Activities disables Progress without affecting independent modules',
  () => {
    const ids =
      createModuleRegistry(
        platformModules
      )
        .enabled({
          activities: false
        })
        .map(
          module => module.id
        );

    assert.equal(
      ids.includes('progress'),
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
