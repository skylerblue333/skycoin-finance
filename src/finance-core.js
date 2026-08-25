const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const MAX_RECORDS = 10000;

function requireId(value, field) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new TypeError(`${field} is invalid`);
  return value;
}

function requireCurrency(value) {
  if (typeof value !== 'string' || !CURRENCY_PATTERN.test(value)) throw new TypeError('currency must be a 3-letter uppercase code');
  return value;
}

function requireMinor(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${field} must be a non-negative safe integer in minor units`);
  return value;
}

export function summarizeRecurringRevenue(subscriptions) {
  if (!Array.isArray(subscriptions) || subscriptions.length > MAX_RECORDS) throw new TypeError(`subscriptions must contain at most ${MAX_RECORDS} records`);
  if (subscriptions.length === 0) {
    return Object.freeze({ activeSubscriptions: 0, currencies: Object.freeze({}) });
  }

  const totals = new Map();
  let activeSubscriptions = 0;
  for (const subscription of subscriptions) {
    requireId(subscription?.id, 'subscription id');
    const status = subscription?.status;
    if (!['active', 'trialing', 'past_due', 'canceled'].includes(status)) throw new TypeError('unsupported subscription status');
    if (status !== 'active' && status !== 'trialing') continue;

    const plan = subscription?.plan;
    requireId(plan?.id, 'plan id');
    const currency = requireCurrency(plan?.currency);
    const amountMinor = requireMinor(plan?.amountMinor, 'plan amount');
    if (plan?.interval !== 'month' && plan?.interval !== 'year') throw new TypeError('interval must be month or year');

    const current = totals.get(currency) ?? { monthlyContractedMinor: 0, annualContractedMinor: 0 };
    const annual = plan.interval === 'year' ? amountMinor : amountMinor * 12;
    if (!Number.isSafeInteger(annual)) throw new RangeError('annual contracted amount exceeds safe integer range');
    const monthly = plan.interval === 'month' ? amountMinor : Math.round(amountMinor / 12);
    current.monthlyContractedMinor += monthly;
    current.annualContractedMinor += annual;
    if (!Number.isSafeInteger(current.monthlyContractedMinor) || !Number.isSafeInteger(current.annualContractedMinor)) {
      throw new RangeError('recurring revenue total exceeds safe integer range');
    }
    totals.set(currency, current);
    activeSubscriptions += 1;
  }

  const currencies = Object.fromEntries([...totals.entries()].sort(([a], [b]) => a.localeCompare(b)));
  return Object.freeze({ activeSubscriptions, currencies: Object.freeze(currencies) });
}

export function allocateMinorUnits(totalMinor, weights) {
  requireMinor(totalMinor, 'total');
  if (!Array.isArray(weights) || weights.length === 0 || weights.length > 1000) throw new TypeError('weights must contain 1-1000 entries');

  const normalized = weights.map((entry) => ({
    id: requireId(entry?.id, 'allocation id'),
    weight: entry?.weight,
  }));
  if (new Set(normalized.map((entry) => entry.id)).size !== normalized.length) throw new Error('allocation ids must be unique');
  for (const entry of normalized) {
    if (!Number.isSafeInteger(entry.weight) || entry.weight <= 0) throw new TypeError('weight must be a positive safe integer');
  }
  const totalWeight = normalized.reduce((sum, entry) => sum + entry.weight, 0);
  if (!Number.isSafeInteger(totalWeight)) throw new RangeError('weight total exceeds safe integer range');

  const raw = normalized.map((entry) => {
    const numerator = BigInt(totalMinor) * BigInt(entry.weight);
    return {
      id: entry.id,
      amountMinor: Number(numerator / BigInt(totalWeight)),
      remainder: numerator % BigInt(totalWeight),
    };
  });
  let remaining = totalMinor - raw.reduce((sum, entry) => sum + entry.amountMinor, 0);
  raw.sort((a, b) => (a.remainder === b.remainder ? a.id.localeCompare(b.id) : a.remainder > b.remainder ? -1 : 1));
  for (let index = 0; index < remaining; index += 1) raw[index].amountMinor += 1;

  return Object.freeze(raw.sort((a, b) => a.id.localeCompare(b.id)).map(({ id, amountMinor }) => Object.freeze({ id, amountMinor })));
}

export const limits = Object.freeze({ maxSubscriptions: MAX_RECORDS, maxAllocations: 1000 });
