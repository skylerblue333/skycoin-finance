# Skycoin Finance

Finance, trading, and monetization component for the SKYCOIN4444 ecosystem.

## Current implementation

- TypeScript finance component
- Docker and CI configuration
- Recurring-revenue metric foundation in `src/billing/revenue.ts`
- Automated revenue calculation test in `tests/revenue.test.ts`

## Monetization path

**Finance → Billing → Subscriptions → Recurring Revenue → Platform Fees**

The new revenue layer calculates contracted recurring revenue from subscription records. It deliberately does **not** claim customers, paid subscribers, ARR, or recognized accounting revenue until real billing-provider data exists.

The next production integration should connect this domain model to a verified payment provider, webhook ingestion, customer/subscription persistence, entitlement management, invoices, refunds, and platform-fee accounting.

## Truthful status

- Finance source: **present**
- Revenue metric foundation: **implemented**
- Revenue calculation test: **implemented**
- Paid subscribers: **not verified**
- Active ARR: **not verified**
- Production billing: **not verified**
- Protocol fees: **not verified**

Repository size is not treated as a value metric. Value comes from working financial capabilities, verified integrations, customers, recurring revenue, transaction volume, and defensible protocol economics.

## Consolidation

Preserve the strongest existing finance/trading implementation and consolidate duplicate wallet, payment, exchange, and billing capabilities into clear boundaries. Use established open-source billing/payment foundations where a genuine gap exists, while preserving licenses and attribution.

## Production requirements

Provider integration, persistent billing state, signed webhook verification, idempotency, entitlement reconciliation, refunds/chargebacks, audit logs, access controls, observability, security review, automated integration tests, and live deployment verification are required before financial production claims.

## License

MIT, subject to the checked-in license and applicable third-party dependency licenses.
