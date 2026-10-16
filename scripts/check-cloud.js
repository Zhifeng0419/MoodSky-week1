const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const cloudRequire = createRequire(
  path.resolve(__dirname, '../cloudfunctions/moodsky/package.json'),
);
const cloud = cloudRequire('wx-server-sdk');
cloud.init({ env: 'synthetic-test-env' });
const db = cloud.database();
const query = db.collection('synthetic_test').where({ status: db.command.eq('active') });
assert.ok(query);
assert.equal(typeof cloud.getWXContext, 'function');
assert.equal(typeof cloudRequire('./index.js').main, 'function');
console.log('Cloud SDK, query construction and entry passed. No network query was sent.');
