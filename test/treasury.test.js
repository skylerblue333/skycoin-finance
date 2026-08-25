'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TreasuryPolicy, createTransferCommand } = require('../src/treasury');

const policy = () => new TreasuryPolicy({
  singleTransferLimit: 100_000,
  dailyTransferLimit: 250_000,
  allowedCurrencies: ['USD', 'SKY']
});

test('allows a transfer inside configured bounds', () => {
  const decision = policy().evaluateTransfer({
    transferId: 'tx-1', accountId: 'treasury-main', destinationId: 'ops', amount: 50_000, currency: 'usd'
  }, { spentToday: 25_000 });
  assert.equal(decision.decision, 'allow');
  assert.deepEqual(decision.reasons, []);
  assert.equal(decision.currency, 'USD');
  assert.equal(createTransferCommand(decision).schema, 'sky.treasury.transfer-command.v1');
});

test('denies disallowed currency and configured limits deterministically', () => {
  const decision = policy().evaluateTransfer({
    transferId: 'tx-2', accountId: 'treasury-main', destinationId: 'vendor', amount: 150_000, currency: 'EUR'
  }, { spentToday: 150_000 });
  assert.equal(decision.decision, 'deny');
  assert.deepEqual(decision.reasons, [
    'currency_not_allowed',
    'single_transfer_limit_exceeded',
    'daily_transfer_limit_exceeded'
  ]);
  assert.throws(() => createTransferCommand(decision), /denied transfers/);
});

test('rejects malformed or unsafe input', () => {
  assert.throws(() => policy().evaluateTransfer({ transferId: '', accountId: 'a', destinationId: 'b', amount: 1, currency: 'USD' }), /transferId/);
  assert.throws(() => policy().evaluateTransfer({ transferId: 'x', accountId: 'a', destinationId: 'b', amount: -1, currency: 'USD' }), /amount/);
  assert.throws(() => policy().evaluateTransfer({ transferId: 'x', accountId: 'a', destinationId: 'b', amount: 1, currency: 'US$' }), /currency/);
  assert.throws(() => policy().evaluateTransfer({ transferId: 'x', accountId: 'a', destinationId: 'b', amount: 1, currency: 'USD' }, { spentToday: -1 }), /spentToday/);
});
