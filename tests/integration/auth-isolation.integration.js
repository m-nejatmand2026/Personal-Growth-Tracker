import test, { after, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestHarness } from 'wrangler';

const WORKER_NAME = 'personal-growth-tracker-auth-test';
const server = createTestHarness({
  workers: [{ configPath: './wrangler.auth-test.jsonc' }]
});

function worker() {
  return server.getWorker(WORKER_NAME);
}

function cookieFrom(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return values
    .flatMap((value) => String(value).split(/,(?=[^;,]+=)/g))
    .map((value) => value.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers || {});
  if (init.body != null && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await server.fetch(path, { ...init, headers });
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  return { response, body, cookie: cookieFrom(response) };
}

async function signUp(email, name = 'Test User') {
  return request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
    body: JSON.stringify({
      email,
      name,
      password: 'correct-horse-battery-staple-42'
    })
  });
}

before(async () => {
  await server.listen();
});

beforeEach(async () => {
  await worker().applyD1Migrations('DB');
});

afterEach(async () => {
  await server.reset();
});

after(async () => {
  await server.close();
});

test('enforced auth keeps owner data private and gives invited tester a clean workspace', async () => {
  const status = await request('/api/account/status');
  assert.equal(status.response.status, 200);
  assert.equal(status.body.mode, 'enforced');
  assert.equal(status.body.invite_only, true);
  assert.equal(status.body.providers.email, true);

  const anonymous = await request('/api/v1/areas');
  assert.equal(anonymous.response.status, 401);

  const uninvited = await signUp('not-invited@example.test', 'Not Invited');
  assert.equal(uninvited.response.status, 403);
  assert.match(JSON.stringify(uninvited.body), /invite-only/i);

  const owner = await signUp('owner@example.test', 'Owner');
  assert.ok([200, 201].includes(owner.response.status), JSON.stringify(owner.body));
  assert.ok(owner.cookie, 'owner sign-up should establish a session cookie');

  const ownerMe = await request('/api/account/me', { headers: { cookie: owner.cookie } });
  assert.equal(ownerMe.response.status, 200);
  assert.equal(ownerMe.body.workspace.profile_id, 'default');
  assert.equal(ownerMe.body.workspace.role, 'owner');

  const ownerAreas = await request('/api/v1/areas?include_archived=1', { headers: { cookie: owner.cookie } });
  assert.equal(ownerAreas.response.status, 200);
  assert.ok(ownerAreas.body.items.some((item) => item.name === 'Health & Fitness'));

  const ownerPrivate = await request('/api/v1/areas', {
    method: 'POST',
    headers: { cookie: owner.cookie },
    body: JSON.stringify({ name: 'Owner private isolation marker' })
  });
  assert.equal(ownerPrivate.response.status, 201);
  const ownerAreaId = Number(ownerPrivate.body.item.id);

  const invite = await request('/api/account/invites', {
    method: 'POST',
    headers: { cookie: owner.cookie },
    body: JSON.stringify({ email: 'tester@example.test' })
  });
  assert.equal(invite.response.status, 201);
  assert.equal(invite.body.item.status, 'pending');

  const tester = await signUp('tester@example.test', 'Tester');
  assert.ok([200, 201].includes(tester.response.status), JSON.stringify(tester.body));
  assert.ok(tester.cookie, 'tester sign-up should establish a session cookie');

  const testerMe = await request('/api/account/me', { headers: { cookie: tester.cookie } });
  assert.equal(testerMe.response.status, 200);
  assert.equal(testerMe.body.workspace.role, 'tester');
  assert.notEqual(testerMe.body.workspace.profile_id, 'default');
  assert.equal(testerMe.body.workspace.can_reset, true);

  const testerAreas = await request('/api/v1/areas?include_archived=1', { headers: { cookie: tester.cookie } });
  assert.equal(testerAreas.response.status, 200);
  assert.deepEqual(testerAreas.body.items, []);

  const spoofAttempt = await request('/api/v1/areas?include_archived=1', {
    headers: {
      cookie: tester.cookie,
      'x-growth-profile-id': 'default',
      'x-growth-auth-role': 'owner'
    }
  });
  assert.equal(spoofAttempt.response.status, 200);
  assert.deepEqual(spoofAttempt.body.items, []);

  const crossProfileUpdate = await request(`/api/v1/areas/${ownerAreaId}`, {
    method: 'PUT',
    headers: { cookie: tester.cookie },
    body: JSON.stringify({ name: 'Tester must never overwrite owner data' })
  });
  assert.equal(crossProfileUpdate.response.status, 404);

  const testerCreated = await request('/api/v1/areas', {
    method: 'POST',
    headers: { cookie: tester.cookie },
    body: JSON.stringify({ name: 'Tester private area' })
  });
  assert.equal(testerCreated.response.status, 201);
  assert.equal(testerCreated.body.item.profile_id, testerMe.body.workspace.profile_id);

  const ownerAfterTester = await request('/api/v1/areas?include_archived=1', { headers: { cookie: owner.cookie } });
  assert.equal(ownerAfterTester.body.items.some((item) => item.name === 'Tester private area'), false);

  const legacyForTester = await request('/api/bootstrap', { headers: { cookie: tester.cookie } });
  assert.equal(legacyForTester.response.status, 404);

  const testerExport = await request('/api/export', { headers: { cookie: tester.cookie } });
  assert.equal(testerExport.response.status, 200);
  assert.equal(testerExport.body.profile.id, testerMe.body.workspace.profile_id);
  assert.deepEqual(testerExport.body.legacy_beta.activities, []);
  assert.equal(testerExport.body.version_one.areas.some((item) => item.name === 'Owner private isolation marker'), false);

  const reset = await request('/api/account/reset-workspace', {
    method: 'POST',
    headers: { cookie: tester.cookie },
    body: JSON.stringify({ confirm: 'RESET' })
  });
  assert.equal(reset.response.status, 200);
  assert.equal(reset.body.reset, true);

  const testerAfterReset = await request('/api/v1/areas?include_archived=1', { headers: { cookie: tester.cookie } });
  assert.deepEqual(testerAfterReset.body.items, []);

  const ownerAfterReset = await request('/api/v1/areas?include_archived=1', { headers: { cookie: owner.cookie } });
  assert.ok(ownerAfterReset.body.items.some((item) => item.name === 'Owner private isolation marker'));

  const ownerReset = await request('/api/account/reset-workspace', {
    method: 'POST',
    headers: { cookie: owner.cookie },
    body: JSON.stringify({ confirm: 'RESET' })
  });
  assert.equal(ownerReset.response.status, 403);
});

test('owner can revoke a pending invitation and revoked email cannot register', async () => {
  const owner = await signUp('owner@example.test', 'Owner');
  assert.ok(owner.cookie);

  const created = await request('/api/account/invites', {
    method: 'POST',
    headers: { cookie: owner.cookie },
    body: JSON.stringify({ email: 'revoked@example.test' })
  });
  assert.equal(created.response.status, 201);

  const revoked = await request('/api/account/invites/revoke', {
    method: 'POST',
    headers: { cookie: owner.cookie },
    body: JSON.stringify({ email: 'revoked@example.test' })
  });
  assert.equal(revoked.response.status, 200);
  assert.equal(revoked.body.item.status, 'revoked');

  const signup = await signUp('revoked@example.test', 'Revoked');
  assert.equal(signup.response.status, 403);
});
