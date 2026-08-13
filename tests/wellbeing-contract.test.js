import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

const data = await readFile(new URL('../worker/modules/wellbeing/data.js', import.meta.url), 'utf8');
const publicContract = await readFile(new URL('../worker/modules/wellbeing/public.js', import.meta.url), 'utf8');
const migration = await readFile(new URL('../migrations/0007_wellbeing_energy.sql', import.meta.url), 'utf8');
const legacyEnergyRoute = await readFile(new URL('../worker/routes/energy.js', import.meta.url), 'utf8');
const historyRoute = await readFile(new URL('../worker/routes/history.js', import.meta.url), 'utf8');
const bootstrap = await readFile(new URL('../worker/compatibility/legacy-beta/bootstrap.js', import.meta.url), 'utf8');
const weekCompatibility = await readFile(new URL('../worker/compatibility/legacy-beta/progress.js', import.meta.url), 'utf8');
const today = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const settings = await readFile(new URL('../public/js/features/settings.js', import.meta.url), 'utf8');
const targetsRoute = await readFile(new URL('../worker/routes/targets.js', import.meta.url), 'utf8');


test('Wellbeing owns profile-scoped Version 1 observation tables', () => {
  const module = createModuleRegistry(platformModules).get('wellbeing');
  assert.ok(module);
  assert.deepEqual(module.dependsOn, []);
  assert.deepEqual(module.ownsTables, [
    'energy_logs_v1',
    'sleep_logs_v1',
    'day_context_logs_v1'
  ]);
  assert.deepEqual(module.compatibilityTables, ['energy_logs']);
});

test('Wellbeing energy migration is additive and preserves legacy observations', () => {
  assert.match(migration, /Module-Owner:\s*wellbeing/i);
  assert.match(migration, /Compatibility-Tables:\s*energy_logs/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS energy_logs_v1/i);
  assert.match(migration, /profile_id TEXT NOT NULL/i);
  assert.match(migration, /INSERT OR IGNORE INTO energy_logs_v1/i);
  assert.match(migration, /FROM energy_logs/i);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM energy_logs/i);
});

test('Wellbeing persistence is isolated to owned observation tables', () => {
  for (const table of ['energy_logs_v1', 'sleep_logs_v1', 'day_context_logs_v1']) {
    assert.match(data, new RegExp(`\\b${table}\\b`));
  }
  assert.doesNotMatch(data, /\bFROM\s+goals\b|\bFROM\s+progress_records\b|\bFROM\s+sessions\b/i);
});

test('Wellbeing public contract is SQL-free', () => {
  assert.match(publicContract, /wellbeingContractV1/);
  assert.match(publicContract, /exportWellbeingV1/);
  assert.doesNotMatch(publicContract, /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i);
});

test('Legacy energy endpoint forwards writes to Wellbeing V1 only', () => {
  assert.match(legacyEnergyRoute, /wellbeingContractV1/);
  assert.match(legacyEnergyRoute, /recordEnergy/);
  assert.doesNotMatch(legacyEnergyRoute, /INSERT\s+INTO\s+energy_logs\b/i);
});

test('History and bootstrap consume Wellbeing through its public contract', () => {
  assert.match(historyRoute, /wellbeingContractV1/);
  assert.match(bootstrap, /wellbeingContractV1/);
  assert.doesNotMatch(historyRoute, /FROM\s+energy_logs/i);
  assert.doesNotMatch(bootstrap, /FROM\s+energy_logs/i);
});

test('Runtime weekly direction comes from Plans and Progress rather than legacy targets', async () => {
  assert.match(weekCompatibility, /plansContractV1/);
  assert.match(weekCompatibility, /progressContractV1/);
  assert.doesNotMatch(weekCompatibility, /weekly_targets|getTargets/);
  assert.doesNotMatch(bootstrap, /getTargets|momente_lessons|roadmap_items/);
  assert.equal(
    await exists(new URL('../worker/data/targets.js', import.meta.url)),
    false
  );
});

test('Today contains no founder-specific fixed schedule ontology', async () => {
  assert.doesNotMatch(today, /config\/schedule|\bTASKS\b/);
  assert.doesNotMatch(today, /calisthen|german|guitar|reading|Momente|catch-up/i);
  assert.equal(
    await exists(new URL('../public/js/config/schedule.js', import.meta.url)),
    false
  );
});

test('Legacy target mutation is retired and Settings points planning back to Plan', () => {
  assert.match(targetsRoute, /410/);
  assert.doesNotMatch(targetsRoute, /weekly_targets|UPDATE\s+weekly_targets/i);
  assert.doesNotMatch(settings, /\/api\/targets|data-target=|data-minimum=/);
  assert.match(settings, /managed in Plan/i);
});
