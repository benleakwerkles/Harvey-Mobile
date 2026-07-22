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


## Guarded Operations lane

The `Operate` tab is deliberately separate from the mutable Build checklist. It can prepare only three allowlisted, session-only intents: `RUN_SANDBOX_VERIFY`, `REQUEST_REVIEW`, and `PREPARE_PROMOTION`.

Each intent is bound to `benleakwerkles/Harvey-Mobile`, a repository-relative source path, a full 40-character source SHA, `CODEX_ROOT`, and `PENDING_HUMAN_GATE`. The receipt records `transport: NONE` and `LOCAL_OPERATION_INTENT_NOT_DISPATCHED`; it contains no raw payload, secret, endpoint, network target, or live GitHub mutation.

Evidence exposes a four-stage truth ladder. A local tap may prove only `PLANNED_LOCAL`; `REQUESTED`, `EXECUTED`, and `VERIFIED` remain explicitly unproven. Reload clears the intent. External Ender remains `BLOCKED_UNBOUND`.

## Flock packet lookup

Plain **P** resolves an explicit Medullina address through `docs/flock/MAILBOX.json`, pulls the packet at its declared full commit SHA, verifies its SHA-256 digest, and returns a read receipt. The resolver fails closed instead of searching or guessing. `FOUND`, `PULLED`, and `RECEIPTED` are separate proof states; none imply dispatch or execution.

The mailbox is currently `PENDING_PR_MERGE` in PR #3. Once merged, the default-branch mailbox becomes the stable Aeye entry point. See `docs/flock/PULL_PROTOCOL.md` for the exact contract and error states.
