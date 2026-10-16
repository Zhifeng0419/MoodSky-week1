const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRequest, validateJournalInput } = require('../miniprogram/shared/validation');
const { businessDate, canCreateEntry, isBusinessDate } = require('../miniprogram/shared/date');

const journal = (extra = {}) => ({
  date: '2026-10-11',
  weather: 'SUNNY',
  expectedVersion: 0,
  ...extra,
});
const request = (extra = {}) => ({
  apiVersion: '1',
  requestId: 'req_test_001',
  action: 'journal.upsert',
  payload: journal(),
  ...extra,
});

test('optional writing and tags stay empty; caller input is not mutated', () => {
  const input = journal();
  assert.deepEqual(validateJournalInput(input), { ...input, text: '', tags: [] });
  assert.equal(input.text, undefined);
  assert.equal(input.tags, undefined);
});
test('text limits count Unicode code points rather than UTF-16 units', () => {
  assert.equal(validateJournalInput(journal({ text: '🌦'.repeat(1000) })).text.length, 2000);
  assert.throws(() => validateJournalInput(journal({ text: '🌦'.repeat(1001) })), {
    code: 'INVALID_INPUT',
  });
});
test('only five distinct fixed tags are accepted', () => {
  assert.equal(
    validateJournalInput(journal({ tags: ['STUDY', 'REST', 'EXERCISE', 'SOCIAL', 'CALM'] })).tags
      .length,
    5,
  );
  for (const tags of [
    ['REST', 'REST'],
    ['CUSTOM'],
    ['STUDY', 'REST', 'EXERCISE', 'SOCIAL', 'CALM', 'TIREDNESS'],
    null,
  ]) {
    assert.throws(() => validateJournalInput(journal({ tags })), { code: 'INVALID_INPUT' });
  }
});
test('weather whitelist, expected version and unknown fields are enforced', () => {
  for (const extra of [
    { weather: 'HAPPY' },
    { expectedVersion: -1 },
    { expectedVersion: 1.5 },
    { expectedVersion: undefined },
    { ownerId: 'another-account' },
    { text: null },
  ]) {
    assert.throws(() => validateJournalInput(journal(extra)), { code: 'INVALID_INPUT' });
  }
  assert.equal(validateJournalInput(journal({ expectedVersion: 7 })).expectedVersion, 7);
});
test('dates validate real leap days and reject normalized invalid dates', () => {
  assert.equal(isBusinessDate('2024-02-29'), true);
  for (const value of ['2026-02-29', '2026-04-31', '2026-1-01', '', null]) {
    assert.equal(isBusinessDate(value), false);
  }
});
test('business day switches at midnight in Asia/Shanghai', () => {
  assert.equal(businessDate(new Date('2026-10-11T15:59:59.999Z')), '2026-10-11');
  assert.equal(businessDate(new Date('2026-10-11T16:00:00.000Z')), '2026-10-12');
});
test('new entry window includes today and preceding 29 days only', () => {
  const now = new Date('2026-10-11T08:00:00.000Z');
  assert.equal(canCreateEntry('2026-10-11', now), true);
  assert.equal(canCreateEntry('2026-09-12', now), true);
  assert.equal(canCreateEntry('2026-09-11', now), false);
  assert.equal(canCreateEntry('2026-10-12', now), false);
  // Input validation permits existing older entries; business handlers distinguish editing.
  assert.equal(
    validateJournalInput(journal({ date: '2025-01-01', expectedVersion: 2 })).date,
    '2025-01-01',
  );
});
test('request rejects unsupported versions, bad IDs, unknown actions and identity fields', () => {
  for (const [extra, code] of [
    [{ apiVersion: '2' }, 'API_VERSION_UNSUPPORTED'],
    [{ requestId: 'tiny' }, 'INVALID_REQUEST'],
    [{ action: '__proto__' }, 'ACTION_NOT_FOUND'],
    [{ payload: [] }, 'INVALID_REQUEST'],
    [{ ownerId: 'spoof' }, 'INVALID_REQUEST'],
    [{ payload: { role: 'data_operator' } }, 'INVALID_REQUEST'],
    [{ payload: { OPENID: 'spoof' } }, 'INVALID_REQUEST'],
  ]) {
    assert.throws(() => validateRequest(request(extra)), { code });
  }
});
