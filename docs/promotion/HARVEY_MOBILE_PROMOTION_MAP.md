# Harvey Mobile sandbox-to-canon promotion map

Status: `NOT_APPROVED`

Sandbox construction and cloud proof happen in `benleakwerkles/Harvey-Mobile`. Canon receives only reviewed behavior-level ports under `benleakwerkles/Werkles/Harvey/Werkles Mobile/` after an explicit approval bound to a completed promotion receipt.

| Sandbox behavior | Canon destination | Promotion rule |
| --- | --- | --- |
| `src/data/projectSnapshot.ts` | `Harvey/Werkles Mobile/mobile-app/src/data/projectSnapshot.ts` or an intentionally reviewed extension of `src/data/flockRelay.ts` | Port validation, age, progress, and truth semantics. |
| `src/components/CommandBoard.tsx` plus wiring in `app/index.tsx` | `Harvey/Werkles Mobile/mobile-app/src/screens/DashboardScreen.tsx` and session ownership in `App.tsx` | Reimplement against canon components; do not copy Expo Router files. |
| `src/data/captureDraft.ts` | `Harvey/Werkles Mobile/mobile-app/src/data/captureDraft.ts` | Preserve all rejection and no-raw-receipt cases. Do not weaken `duckDraft.ts`. |
| `src/components/QuickCapture.tsx` plus wiring in `app/index.tsx` | `Harvey/Werkles Mobile/mobile-app/src/screens/DuckScreen.tsx` and session ownership in `App.tsx` | Reimplement as a bounded mode; do not add a misleading send/save control. |
| `tests/contracts/contracts.test.mjs` | `Harvey/Werkles Mobile/mobile-app/src/data/contracts.test.ts` | Port deterministic behavior cases into canon's existing runner. |

Never promote sandbox `package.json`, `package-lock.json`, `app.json`, Router scaffolding, workflow, or whole folders into canon. Stop on an unmapped destination, failed sandbox proof, stale canon base, missing artifact digest, absent approval, or failed canonical verification.
