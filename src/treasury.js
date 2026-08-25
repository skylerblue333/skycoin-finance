'use strict';

const MAX_SAFE_AMOUNT = 10_000_000_000_000;
const CURRENCIES = /^[A-Z]{3,8}$/;

function assertString(value, name, max = 128) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
    throw new TypeError(`${name} must be a non-empty string up to ${max} characters`);
  }
  return value.trim();
}

function assertAmount(value, name = 'amount') {
  if (!Number.isSafeInteger(value) || value <= 0 || value > MAX_SAFE_AMOUNT) {
    throw new RangeError(`${name} must be a positive safe integer not exceeding ${MAX_SAFE_AMOUNT}`);
  }
  return value;
}

function assertCurrency(value) {
  const currency = assertString(value, 'currency', 8).toUpperCase();
  if (!CURRENCIES.test(currency)) throw new TypeError('currency must be 3-8 uppercase letters');
  return currency;
}

class TreasuryPolicy {
  constructor({ singleTransferLimit, dailyTransferLimit, allowedCurrencies }) {
    this.singleTransferLimit = assertAmount(singleTransferLimit, 'singleTransferLimit');
    this.dailyTransferLimit = assertAmount(dailyTransferLimit, 'dailyTransferLimit');
    if (this.dailyTransferLimit < this.singleTransferLimit) {
      throw new RangeError('dailyTransferLimit must be >= singleTransferLimit');
    }
    if (!Array.isArray(allowedCurrencies) || allowedCurrencies.length === 0) {
      throw new TypeError('allowedCurrencies must be a non-empty array');
    }
    this.allowedCurrencies = new Set(allowedCurrencies.map(assertCurrency));
  }

  evaluateTransfer(request, context = {}) {
    if (!request || typeof request !== 'object') throw new TypeError('request must be an object');
    const transferId = assertString(request.transferId, 'transferId');
    const accountId = assertString(request.accountId, 'accountId');
    const destinationId = assertString(request.destinationId, 'destinationId');
    const amount = assertAmount(request.amount);
    const currency = assertCurrency(request.currency);
    const spentToday = context.spentToday == null ? 0 : context.spentToday;
    if (!Number.isSafeInteger(spentToday) || spentToday < 0) throw new RangeError('spentToday must be a non-negative safe integer');

    const reasons = [];
    if (!this.allowedCurrencies.has(currency)) reasons.push('currency_not_allowed');
    if (amount > this.singleTransferLimit) reasons.push('single_transfer_limit_exceeded');
    if (spentToday + amount > this.dailyTransferLimit) reasons.push('daily_transfer_limit_exceeded');

    return Object.freeze({
      schema: 'sky.treasury.transfer-decision.v1',
      transferId,
      accountId,
      destinationId,
      amount,
      currency,
      decision: reasons.length === 0 ? 'allow' : 'deny',
      reasons: Object.freeze(reasons)
    });
  }
}

function createTransferCommand(decision) {
  if (!decision || decision.schema !== 'sky.treasury.transfer-decision.v1') {
    throw new TypeError('decision must be a SkyTreasury transfer decision');
  }
  if (decision.decision !== 'allow') throw new Error('denied transfers cannot produce commands');
  return Object.freeze({
    schema: 'sky.treasury.transfer-command.v1',
    transferId: decision.transferId,
    accountId: decision.accountId,
    destinationId: decision.destinationId,
    amount: decision.amount,
    currency: decision.currency
  });
}

module.exports = { TreasuryPolicy, createTransferCommand };
