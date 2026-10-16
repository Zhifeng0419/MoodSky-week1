const test = require('node:test');
const assert = require('node:assert/strict');
const { createRouter, ACTIONS } = require('../cloudfunctions/moodsky/router');
const request = (action, payload = {}) => ({
  apiVersion: '1',
  requestId: 'req_router_001',
  action,
  payload,
});

test('health is usable without querying a private account', async () => {
  const router = createRouter({
    resolveAccount: async () => {
      throw new Error('must not query');
    },
  });
  const result = await router(request('system.health'));
  assert.equal(result.ok, true);
  assert.equal(result.data.app, 'MoodSky');
  assert.equal(result.data.stage, 'foundation');
});
test('every private and operator action rejects missing trusted identity', async () => {
  for (const [action, definition] of Object.entries(ACTIONS)) {
    if (['private', 'operator'].includes(definition.access)) {
      const result = await createRouter()(request(action));
      assert.equal(result.error.code, 'UNAUTHENTICATED', action);
      assert.equal(result.ok, false);
    }
  }
});
test('disabled internal accounts cannot use any private or operator action', async () => {
  const router = createRouter({
    resolveAccount: async () => ({ id: 'account_a', status: 'disabled' }),
  });
  for (const [action, definition] of Object.entries(ACTIONS)) {
    if (['private', 'operator'].includes(definition.access)) {
      const result = await router(request(action), { OPENID: 'trusted-openid' });
      assert.equal(result.error.code, 'ACCOUNT_DISABLED', action);
    }
  }
});
test('identity lookup uses trusted invocation context; payload spoofing is rejected', async () => {
  const calls = [];
  const router = createRouter({
    resolveAccount: async (openid) => {
      calls.push(openid);
      return { id: 'internal_a', status: 'active' };
    },
  });
  assert.equal(
    (await router(request('journal.get'), { OPENID: 'trusted-a' })).error.code,
    'NOT_IMPLEMENTED',
  );
  assert.deepEqual(calls, ['trusted-a']);
  assert.equal(
    (await router(request('journal.get', { ownerId: 'other' }), { OPENID: 'trusted-b' })).error
      .code,
    'INVALID_REQUEST',
  );
  assert.deepEqual(calls, ['trusted-a']);
});
test('operator permission is server resolved; active students cannot maintain data', async () => {
  const router = createRouter({
    resolveAccount: async () => ({ id: 'a', status: 'active' }),
    resolveOperatorRoles: async () => [],
  });
  assert.equal(
    (await router(request('admin.updatePlace'), { OPENID: 'trusted' })).error.code,
    'FORBIDDEN',
  );
});
test('unconfigured adapters and domain stubs never claim a private write succeeded', async () => {
  const unconfigured = await createRouter()(request('account.close'), { OPENID: 'trusted' });
  assert.equal(unconfigured.error.code, 'NOT_IMPLEMENTED');
  const configured = createRouter({ resolveAccount: async () => ({ id: 'a', status: 'active' }) });
  const save = await configured(
    request('journal.upsert', {
      date: '2026-10-11',
      weather: 'RAINY',
      expectedVersion: 0,
    }),
    { OPENID: 'trusted' },
  );
  assert.equal(save.error.code, 'NOT_IMPLEMENTED');
  assert.equal(save.ok, false);
});
test('cleanup receipt cannot act as private login and requires restricted permission', async () => {
  const router = createRouter({ resolveCleanupReceipt: async () => ({ permission: 'export' }) });
  assert.equal(
    (await router(request('account.cleanupStatus', { receipt: 'receipt-test' }))).error.code,
    'FORBIDDEN',
  );
  assert.equal(
    (await router(request('journal.get', { receipt: 'receipt-test' }))).error.code,
    'UNAUTHENTICATED',
  );
});
test('fixed simulation is explicit and never queries account or journal data', async () => {
  const router = createRouter({
    resolveAccount: async () => {
      throw new Error('no private query');
    },
  });
  const result = await router(request('campus.weatherPreview'));
  assert.equal(result.ok, true);
  assert.equal(result.data.simulated, true);
  assert.deepEqual(Object.keys(result.data).sort(), ['description', 'label', 'simulated']);
});
test('unexpected server failures are scrubbed; invalid correlation IDs are not echoed', async () => {
  const router = createRouter({
    resolveAccount: async () => {
      throw new Error('private identity and writing');
    },
  });
  const result = await router(request('journal.get'), { OPENID: 'private-context' });
  assert.equal(result.error.code, 'INTERNAL_ERROR');
  assert.doesNotMatch(JSON.stringify(result), /private identity|private-context|writing/);
  const invalid = await router({ ...request('system.health'), requestId: 'secret\nbad' });
  assert.equal(invalid.requestId, null);
  assert.equal(invalid.error.code, 'INVALID_REQUEST');
});
