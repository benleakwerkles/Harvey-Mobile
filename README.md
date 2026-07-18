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
- explicit CI-bound bundle identity kept separate from project-state snapshot provenance
- deterministic contracts, typecheck, Android export, and downloadable web export in GitHub Actions

Quick-capture raw text stays only in the current app session. Its receipt contains counts and proof state, never the raw note. Nothing is saved to cloud or dispatched.

## Run

```text
npm ci --no-audit --no-fund
npm run test:contracts
npm run typecheck
npm run web
```

Cloud proof uses `npm run export:android` and `npm run export:web`. GitHub Actions records both the source-head SHA and the exact checked-out tree SHA, injects the tree SHA into both bundles, and uploads separate tree-SHA-bound artifacts carrying the same integrity receipt. This avoids confusing a pull request's synthetic merge tree with its source branch. The web artifact is downloadable test material, not a deployed or live preview. No simulator is required. There is no configured lint command, so lint is not claimed.

See `docs/promotion/HARVEY_MOBILE_PROMOTION_MAP.md` before proposing any canon change.
