const test = require('node:test');
const assert = require('node:assert/strict');
const { loginSchema, preferencesSchema } = require('../schemas');

test('rejects malformed login payloads', () => {
  assert.throws(() => loginSchema.parse({ username: 'a', password: '' }));
});

test('rejects preference weights outside the supported range', () => {
  assert.throws(() => preferencesSchema.parse({ weights: { career: 2 } }));
});

test('applies empty preference defaults', () => {
  assert.deepEqual(preferencesSchema.parse(undefined), { preferredGenders: [], weights: {} });
});
