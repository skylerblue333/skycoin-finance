export type BillingInterval = 'month' | 'year';

export interface SubscriptionPlan {
  id: string;
  name: string;
  amountMinor: number;
  currency: string;
  interval: BillingInterval;
}

export interface ActiveSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  startedAt: string;
}

export interface RecurringRevenueSummary {
  activeSubscriptions: number;
  monthlyRecurringMinor: number;
  annualRecurringMinor: number;
  currency: string | null;
}

function normalizedCurrency(currency: string): string {
  const value = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(value)) throw new Error('currency must be a 3-letter code');
  return value;
}

function validateSubscription(subscription: ActiveSubscription): void {
  if (!subscription.id.trim()) throw new Error('subscription id is required');
  if (!subscription.plan.id.trim() || !subscription.plan.name.trim()) throw new Error('plan id and name are required');
  if (!Number.isSafeInteger(subscription.plan.amountMinor) || subscription.plan.amountMinor < 0) {
    throw new Error('plan amountMinor must be a non-negative safe integer');
  }
  if (Number.isNaN(Date.parse(subscription.startedAt))) throw new Error('startedAt must be a valid date');
  normalizedCurrency(subscription.plan.currency);
}

/**
 * Calculates contracted recurring revenue from active/trialing subscriptions.
 * This is an operational subscription metric, not GAAP/IFRS recognized revenue.
 */
export function calculateRecurringRevenue(subscriptions: ActiveSubscription[]): RecurringRevenueSummary {
  subscriptions.forEach(validateSubscription);
  const active = subscriptions.filter((subscription) => subscription.status === 'active' || subscription.status === 'trialing');
  if (active.length === 0) {
    return { activeSubscriptions: 0, monthlyRecurringMinor: 0, annualRecurringMinor: 0, currency: null };
  }

  const currencies = new Set(active.map((subscription) => normalizedCurrency(subscription.plan.currency)));
  if (currencies.size !== 1) throw new Error('recurring revenue cannot combine multiple currencies without FX conversion');
  const currency = [...currencies][0];

  const monthlyRecurringMinor = active.reduce((sum, subscription) => {
    const monthly = subscription.plan.interval === 'year'
      ? Math.round(subscription.plan.amountMinor / 12)
      : subscription.plan.amountMinor;
    const next = sum + monthly;
    if (!Number.isSafeInteger(next)) throw new Error('recurring revenue exceeds safe integer range');
    return next;
  }, 0);

  const annualRecurringMinor = monthlyRecurringMinor * 12;
  if (!Number.isSafeInteger(annualRecurringMinor)) throw new Error('annual recurring revenue exceeds safe integer range');

  return { activeSubscriptions: active.length, monthlyRecurringMinor, annualRecurringMinor, currency };
}
