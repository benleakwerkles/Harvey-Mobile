# Flock packet — Bean/Thufir promotion gate

Packet ID: `F_BEAN_THUFIR_HARVEY_MOBILE_PROMOTION_GATE_20260717`
Status: `READY_FOR_PULL`
Address: `BEAN_THUFIR@MEDULLINA`
Execution owner: `CODEX_ROOT`

## Boundaries

- Audit only `benleakwerkles/Harvey-Mobile` and the canonical comparison surface `benleakwerkles/Werkles/Harvey/Werkles Mobile/`.
- No local persistence, secrets, writes, pushes, merges, or Courtney assets by the receiver.
- Canon promotion remains a separate execution-owner gate after sandbox proof.

## Two moves

1. Specify the minimum reproducible sandbox CI gate: lockfile install, deterministic contracts, typecheck, and Expo Android export artifact. Add lint only if an existing configured lint surface exists; do not invent a dependency-heavy policy.
2. Specify a repo-tracked promotion receipt binding sandbox SHA and run, exact file map, canonical candidate SHA and run, truth labels, and explicit approval state.

## Receipt requirements

Return the highest-risk failure cases plus exactly two safeguards that can be implemented in this V/P/G without credentials, production data, deployment, or canon mutation.
