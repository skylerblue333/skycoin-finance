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

/** Calculates contracted recurring revenue; it is not recognized accounting revenue. */
export function calculateRecurringRevenue(subscriptions: ActiveSubscription[]) {
  const active = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const monthlyRecurringMinor = active.reduce((sum, s) => {
    const monthly = s.plan.interval === 'year' ? Math.round(s.plan.amountMinor / 12) : s.plan.amountMinor;
    return sum + monthly;
  }, 0);

  return {
    activeSubscriptions: active.length,
    monthlyRecurringMinor,
    annualRecurringMinor: monthlyRecurringMinor * 12,
    currency: active[0]?.plan.currency ?? 'USD',
  };
}
