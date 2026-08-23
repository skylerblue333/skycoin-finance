import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateRecurringRevenue } from '../src/billing/revenue';

test('calculates monthly and annual recurring revenue from active subscriptions', () => {
  const result = calculateRecurringRevenue([
    { id: 'm1', status: 'active', startedAt: '2026-01-01', plan: { id: 'pro', name: 'Pro', amountMinor: 2000, currency: 'USD', interval: 'month' } },
    { id: 'y1', status: 'active', startedAt: '2026-01-01', plan: { id: 'team', name: 'Team', amountMinor: 12000, currency: 'USD', interval: 'year' } },
    { id: 'c1', status: 'canceled', startedAt: '2026-01-01', plan: { id: 'old', name: 'Old', amountMinor: 5000, currency: 'USD', interval: 'month' } },
  ]);
  assert.equal(result.activeSubscriptions, 2);
  assert.equal(result.monthlyRecurringMinor, 3000);
  assert.equal(result.annualRecurringMinor, 36000);
});
