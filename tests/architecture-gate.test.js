import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readFile,
  readdir,
  access
} from 'node:fs/promises';
import path from 'node:path';
import {
  fileURLToPath
} from 'node:url';

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

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const workerRegistry =
  createModuleRegistry(platformModules);

const frontendRegistry =
  createFrontendModuleRegistry(frontendModules);

async function exists(relative) {
  try {
    await access(path.join(root, relative));
    return true;
  } catch {
    return false;
  }
}

async function filesUnder(directory) {
  const absolute = path.join(root, directory);
  const entries = await readdir(
    absolute,
    { withFileTypes: true }
  );

  const files = [];

  for (const entry of entries) {
    const child =
      path.join(directory, entry.name)
        .replaceAll('\\', '/');

    if (entry.isDirectory()) {
      files.push(
        ...await filesUnder(child)
      );
    } else if (/\.(js|mjs|ts)$/.test(entry.name)) {
      files.push(child);
    }
  }

  return files;
}

function importedSpecifiers(source) {
  const results = [];

  const pattern =
    /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;

  let match;

  while ((match = pattern.exec(source))) {
    results.push(match[1]);
  }

  return results;
}

function sqlTables(source) {
  const tables = new Set();

  const patterns = [
    /\b(?:FROM|JOIN|INTO|DELETE\s+FROM)\s+["`\[]?([A-Za-z_][A-Za-z0-9_]*)/gi,

    // Real UPDATE statements only. SQLite UPSERT contains
    // "DO UPDATE SET", where SET is not a table.
    /\bUPDATE\s+(?!SET\b)(?:OR\s+(?:ROLLBACK|ABORT|REPLACE|FAIL|IGNORE)\s+)?["`\[]?([A-Za-z_][A-Za-z0-9_]*)/gi,

    /\bALTER\s+TABLE\s+["`\[]?([A-Za-z_][A-Za-z0-9_]*)/gi,
    /\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+["`\[]?([A-Za-z_][A-Za-z0-9_]*)/gi,
    /\bCREATE\s+(?:UNIQUE\s+)?INDEX[\s\S]*?\bON\s+["`\[]?([A-Za-z_][A-Za-z0-9_]*)/gi
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(source))) {
      tables.add(match[1]);
    }
  }

  return tables;
}

/**
 * Extract SQL-looking JavaScript template literals.
 *
 * Module source contains comments, UI copy and error messages that may
 * naturally contain words such as FROM, UPDATE or INTO. Those are not SQL
 * dependencies and must never affect the architecture gate.
 *
 * SQL in Growth Compass Worker modules is expressed using template literals,
 * including reusable fragments such as ACTIVITY_SELECT.
 */
function sqlTemplateLiterals(source) {
  const results = [];
  const templatePattern = /`((?:\\[\s\S]|[^`])*)`/g;

  let match;

  while ((match = templatePattern.exec(source))) {
    const candidate = match[1];

    if (
      /\b(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|ALTER\s+TABLE|CREATE\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX)\b/i
        .test(candidate)
    ) {
      results.push(candidate);
    }
  }

  return results;
}

function sqlTablesFromJavaScript(source) {
  const tables = new Set();

  for (const sql of sqlTemplateLiterals(source)) {
    for (const table of sqlTables(sql)) {
      tables.add(table);
    }
  }

  return tables;
}

test(
  'SQL ownership scanner distinguishes table UPDATE from UPSERT DO UPDATE SET',
  () => {
    assert.deepEqual(
      [...sqlTables(`
        INSERT INTO activities(key,name)
        VALUES('x','Example')
        ON CONFLICT(key) DO UPDATE SET
          name=excluded.name
      `)],
      ['activities']
    );

    assert.deepEqual(
      [...sqlTables(`
        UPDATE goal_activities
        SET name='Example'
        WHERE id=1
      `)],
      ['goal_activities']
    );

    assert.deepEqual(
      [...sqlTables(`
        UPDATE OR IGNORE goal_activities
        SET name='Example'
        WHERE id=1
      `)],
      ['goal_activities']
    );
  }
);

test(
  'JavaScript SQL scanner ignores prose and comments but detects SQL templates',
  () => {
    const source = `
      // Do not read the Goals table from Activities persistence.
      const explanation = 'FROM Activities is ordinary prose';

      const SQL = \`
        SELECT id, name
        FROM goal_activities
        WHERE active=1
      \`;
    `;

    assert.deepEqual(
      [...sqlTablesFromJavaScript(source)],
      ['goal_activities']
    );
  }
);

test(
  'Worker manifests have single table ownership and valid event ownership',
  () => {
    assert.equal(
      workerRegistry.tableOwner('areas'),
      'areas'
    );

    assert.equal(
      workerRegistry.tableOwner('goals'),
      'goals'
    );

    assert.equal(
      workerRegistry.tableOwner('goal_activities'),
      'activities'
    );

    assert.equal(
      workerRegistry.tableOwner('plan_versions'),
      'plans'
    );

    assert.equal(
      workerRegistry.tableOwner('capacity_commitments'),
      'capacity'
    );

    assert.equal(
      workerRegistry.tableOwner('daily_plan_items'),
      'daily-plan'
    );

    assert.equal(
      workerRegistry.tableOwner('journal_entries'),
      'journal'
    );

    assert.equal(
      workerRegistry.eventPublisher(
        'activity.created'
      ),
      'activities'
    );
  }
);

test(
  'Disabling a required module disables dependent modules but not unrelated modules',
  () => {
    const workerIds =
      workerRegistry
        .enabled({ goals: false })
        .map((module) => module.id);

    assert.equal(
      workerIds.includes('goals'),
      false
    );

    assert.equal(
      workerIds.includes('activities'),
      false
    );

    assert.equal(
      workerIds.includes('plans'),
      false
    );

    assert.equal(
      workerIds.includes('capacity'),
      false
    );

    assert.equal(
      workerIds.includes('areas'),
      true
    );

    assert.equal(
      workerIds.includes('daily-plan'),
      true
    );

    assert.equal(
      workerIds.includes('journal'),
      true
    );

    const frontendIds =
      frontendRegistry
        .enabled({ goals: false })
        .map((module) => module.id);

    assert.equal(
      frontendIds.includes('goals'),
      false
    );

    assert.equal(
      frontendIds.includes('activities'),
      false
    );

    assert.equal(
      frontendIds.includes('plans'),
      false
    );

    assert.equal(
      frontendIds.includes('capacity'),
      false
    );

    assert.equal(
      frontendIds.includes('areas'),
      true
    );
  }
);

test(
  'Cross-module imports use only declared public contracts',
  async () => {
    for (const base of [
      'worker/modules',
      'public/js/modules'
    ]) {
      for (const file of await filesUnder(base)) {
        if (file.endsWith('/catalog.js')) {
          continue;
        }

        const relative =
          file.replaceAll('\\', '/');

        const marker =
          base === 'worker/modules'
            ? 'worker/modules/'
            : 'public/js/modules/';

        const owner =
          relative
            .split(marker)[1]
            ?.split('/')[0];

        const registry =
          base === 'worker/modules'
            ? workerRegistry
            : frontendRegistry;

        const source = await readFile(
          path.join(root, file),
          'utf8'
        );

        for (
          const specifier
          of importedSpecifiers(source)
        ) {
          if (!specifier.startsWith('.')) {
            continue;
          }

          const resolved =
            path.resolve(
              path.dirname(
                path.join(root, file)
              ),
              specifier
            );

          const targetRelative =
            path.relative(root, resolved)
              .replaceAll('\\', '/');

          if (!targetRelative.startsWith(marker)) {
            continue;
          }

          const target =
            targetRelative
              .split(marker)[1]
              ?.split('/')[0];

          if (!target || target === owner) {
            continue;
          }

          const ownerModule =
            registry.get(owner);

          assert.ok(
            ownerModule,
            `${file} has no registered owner`
          );

          assert.equal(
            ownerModule.dependsOn.includes(target),
            true,
            `${file} uses undeclared dependency ${target}`
          );

          assert.equal(
            targetRelative,
            `${marker}${target}/public.js`,
            `${file} imports private implementation from ${target}`
          );
        }
      }
    }
  }
);

test(
  'Worker module SQL touches only owned, compatibility, or platform tables',
  async () => {
    const platformTables =
      new Set(['profiles']);

    for (
      const module
      of workerRegistry.modules
    ) {
      const directory =
        `worker/modules/${module.id}`;

      for (
        const file
        of await filesUnder(directory)
      ) {
        const source = await readFile(
          path.join(root, file),
          'utf8'
        );

        for (const table of sqlTablesFromJavaScript(source)) {
          const tableOwner =
            workerRegistry.tableOwner(table);

          const allowed =
            module.ownsTables.includes(table)
            || module.compatibilityTables
              .includes(table)
            || platformTables.has(table);

          assert.equal(
            allowed,
            true,
            `${file} illegally accesses table ${table}`
            + (
              tableOwner
                ? ` owned by ${tableOwner}`
                : ''
            )
          );
        }
      }
    }
  }
);

test(
  'New migrations declare module ownership and explicit compatibility exceptions',
  async () => {
    const migrationDir =
      path.join(root, 'migrations');

    const files =
      (await readdir(migrationDir))
        .filter((name) =>
          /^\d+_.*\.sql$/.test(name)
        )
        .sort();

    for (const name of files) {
      const number =
        Number(name.split('_')[0]);

      // Historical migrations 0001-0005 predate
      // the enforceable module-owned migration gate.
      if (number < 6) continue;

      const source = await readFile(
        path.join(migrationDir, name),
        'utf8'
      );

      const ownerMatch =
        source.match(
          /^-- Module-Owner:\s*([a-z][a-z0-9-]*)\s*$/mi
        );

      assert.ok(
        ownerMatch,
        `${name} must declare -- Module-Owner`
      );

      const owner =
        ownerMatch[1];

      const module =
        workerRegistry.get(owner);

      assert.ok(
        module,
        `${name} declares unknown module owner ${owner}`
      );

      const compatibilityMatch =
        source.match(
          /^-- Compatibility-Tables:\s*(.+)\s*$/mi
        );

      const migrationCompatibility =
        new Set(
          compatibilityMatch
            ? compatibilityMatch[1]
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            : []
        );

      const allowed =
        new Set([
          ...module.ownsTables,
          ...module.compatibilityTables,
          ...migrationCompatibility,
          'profiles'
        ]);

      for (const table of sqlTables(source)) {
        assert.equal(
          allowed.has(table),
          true,
          `${name} owned by ${owner} illegally touches ${table}`
        );
      }
    }
  }
);

test(
  'Shared Version 1 business internals are explicit architecture debt and cannot silently expand',
  async () => {
    const knownDebt = new Set([



    ]);

    for (const file of knownDebt) {
      assert.equal(
        await exists(file),
        true,
        `Architecture debt list is stale: ${file} no longer exists. Remove it from the list.`
      );
    }

    for (const base of [
      'worker/data',
      'worker/routes',
      'worker/domain'
    ]) {
      for (const file of await filesUnder(base)) {
        const stem =
          path.basename(file)
            .replace(/\.(js|mjs|ts)$/, '');

        if (!workerRegistry.has(stem)) {
          continue;
        }

        assert.equal(
          knownDebt.has(file),
          true,
          `${file} is untracked shared business logic. New module internals must live inside their module.`
        );
      }
    }

    assert.equal(
      await exists('worker/data/activities.js'),
      false
    );

    assert.equal(
      await exists('worker/routes/activities.js'),
      false
    );
  }
);
