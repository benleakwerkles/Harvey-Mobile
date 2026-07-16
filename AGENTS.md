# Harvey Mobile

Phone-first Expo / React Native app (Expo Router + TypeScript) for building and managing Werkles. See `README.md` for the product overview.

## Cursor Cloud specific instructions

- This is a single Expo app. Node 22 is used (CI pins `22.13.0`). Dependencies are installed via `npm install`.
- There is no lint or test suite. The only static check is `npm run typecheck` (`tsc --noEmit`), which is also what CI (`.github/workflows/verify.yml`) runs on every push/PR. Run it before considering changes done.
- To run and manually test in the cloud VM (no device/emulator available), use web mode: `npm run web`. This starts the Metro bundler on `http://localhost:8081`. The first page load takes ~10-30s while Metro bundles; subsequent loads are fast.
- The app is UI-only with in-memory React state (tasks and captured notes). Nothing is persisted, so a page reload resets all state — this is expected, not a bug.
- Standard mobile commands `npm run ios` / `npm run android` require a simulator/emulator and are not usable in the cloud VM; prefer `npm run web` for verification.
