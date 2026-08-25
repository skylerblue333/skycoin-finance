# SkyTreasury — Wave 2 slot #78

SkyTreasury is an engineering-beta treasury policy/domain library. It validates transfer requests, enforces configured per-transfer and daily limits, restricts allowed currencies, and emits a versioned command contract only for approved requests.

## SKYCOIN4444 integration

Input/output contracts:
- decision: `sky.treasury.transfer-decision.v1`
- command: `sky.treasury.transfer-command.v1`

A caller may pass an approved command to a separate ledger, payment, or approval component. This repository does not perform settlement, move funds, sign blockchain transactions, contact banks, or persist balances.

## Security and product boundaries

All identifiers, currency codes, amounts, and daily-spend context are validated before evaluation. Amounts use positive safe integers to avoid floating-point money arithmetic. Policy evaluation is deterministic and deny-only decisions cannot produce transfer commands.

This is not a custody system, payment processor, banking integration, compliance engine, production authorization service, or proof of deployment. Authentication, durable accounting, multi-party approvals, key custody, provider integrations, reconciliation, and regulatory controls remain external responsibilities.

## Verification

`npm test` runs deterministic Node tests. `npm run lint` performs syntax validation. `npm run build` creates and verifies the distributable library artifact. CI also runs `npm audit --omit=dev` after dependency installation.
