# Harvey Mobile sandbox

This repository is the cloud build sandbox for Harvey Mobile. Canon remains `benleakwerkles/Werkles/Harvey/Werkles Mobile/`.

## Working law

- Build and test here; promote only reviewed behavior into canon through a receipt-backed human gate.
- Do not copy this Expo 57 manifest, lockfile, Expo Router scaffold, workflow, or whole folders into the Expo 51 canon app.
- Never use Courtney repositories or folders for Harvey work.
- No secrets, credentials, customer data, live-delivery claims, or persistence claims.
- Raw quick-capture text is current-session only and must never enter a receipt.

## Verification

Node 22 is used in CI. The reproducible gate is:

```text
npm ci --no-audit --no-fund
npm run test:contracts
npm run typecheck
npm run export:android
```

There is no configured lint surface. Do not report lint as passed. A green sandbox run proves only the tested sandbox SHA and its uploaded Android export; it does not prove canon, merge, deployment, or receiver delivery.
