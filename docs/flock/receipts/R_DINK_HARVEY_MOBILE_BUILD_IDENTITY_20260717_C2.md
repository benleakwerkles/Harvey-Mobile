# P receipt — Dink build identity convergence, cycle two

State: `RECEIPTED`
Packet: `F_DINK_HARVEY_MOBILE_BUILD_IDENTITY_20260717_C2`
Declared base: `0e332bab96d9829ed8d5ea1042038f532c27f490`
Packet commit: `480be4f5e52fe67b9b139cd95ea366aef7cb9fe9`
Receiver mode: `READ_ONLY_ROLE_AGENT`

Two returned moves:

1. Keep bundle identity independent from the older project snapshot. Accept only a full CI-injected SHA, otherwise show an explicit unbound state; test bound, missing, malformed, and separation cases.
2. Add a SHA-bound web export beside Android, require a real web entrypoint and generated assets, and label it downloadable—not deployed or live.

Evidence paths: `src/data/buildIdentity.ts`, `src/components/CommandBoard.tsx`, `tests/contracts/contracts.test.mjs`, `package.json`, `.github/workflows/verify.yml`.
