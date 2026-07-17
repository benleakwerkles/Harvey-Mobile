# Harvey Mobile

Harvey Mobile is the phone-first Harvey / ThinkIT command lane for building and managing Werkles away from a desktop.

## Source boundary

- Sandbox: `benleakwerkles/Harvey-Mobile`
- Canon: `benleakwerkles/Werkles/Harvey/Werkles Mobile/`
- This Expo 57 / Expo Router repository is where construction and cloud proof occur.
- Canon receives reviewed behavior ports only after an explicit, receipt-backed promotion gate.

## Current slice

- provenance-backed Werkles command board labeled `SNAPSHOT · NOT LIVE`
- session-only build queue whose changes reset on reload
- secret-safe quick capture with `LOCAL_DRAFT_NOT_DISPATCHED` receipts
- Flock packets and receipts that distinguish dispatch from receiver proof
- deterministic contracts, typecheck, and Android export in GitHub Actions

Quick-capture raw text stays only in the current app session. Its receipt contains counts and proof state, never the raw note. Nothing is saved to cloud or dispatched.

## Run

```text
npm ci --no-audit --no-fund
npm run test:contracts
npm run typecheck
npm run web
```

Android cloud proof uses `npm run export:android`. No simulator is required. There is no configured lint command, so lint is not claimed.

See `docs/promotion/HARVEY_MOBILE_PROMOTION_MAP.md` before proposing any canon change.
