# RECEIPT — Codex Root Harvey Mobile V/P/G Cycle Five

Receipt ID: `R_CODEX_ROOT_HARVEY_MOBILE_VPG_20260721_C5`  
Repository: `benleakwerkles/Harvey-Mobile`  
Branch: `codex/harvey-mobile-vpg-20260719`  
Execution owner: `CODEX_ROOT`  
Work mode: `CLOUD_ONLY`  
State: `SANDBOX_G_RECEIPTED`

## V — immutable packet checkpoint

Checkpoint: `8260b18d0358bcd99ec08749e06695e798e172f5`

- Dink: `F_DINK_HARVEY_MOBILE_MAILBOX_RESOLUTION_20260721_C5`
- Cursor/Ender/Doozer: `F_CURSOR_ENDER_HARVEY_MOBILE_PULL_DISCOVERY_20260721_C5`
- Bean/Thufir: `F_BEAN_THUFIR_HARVEY_MOBILE_MAILBOX_AUDIT_20260721_C5`

Each packet is available through a commit-SHA blob URL and raw URL. The checkpoint contains all three packet paths.

## P — role-agent receipts

All three Medullina Aeye roles pulled their exact packet at the same checkpoint and returned the declared packet ID, repository, branch, packet path, base head, V checkpoint, and read-only role.

- Dink: `READ_ONLY_ROLE_AGENT_RECEIPTED`
- Cursor/Ender/Doozer: `RECEIPTED_INTERNAL_ROLE_AGENT`
- Bean/Thufir: `READ_ONLY_ROLE_AGENT_RECEIPTED`
- Real external Ender/Claude: `BLOCKED_UNBOUND`

The Aeyes converged on six moves:

1. one deterministic, address-sorted mailbox with immutable SHAs, URLs, digests, lifecycle, and ownership;
2. a pure fail-closed resolver for unknown, duplicate, mutable, traversing, stale, or mismatched references;
3. explicit `ADDRESS_REQUIRED`, `NO_PACKET`, `MAILBOX_INVALID`, `MAILBOX_STALE`, and `PACKET_MISMATCH` results;
4. a Relay provenance card separating `FOUND`, `PULLED`, and `RECEIPTED`;
5. digest and commit-tree verification for every addressed packet;
6. tests forbidding discovery from implying dispatch, request, execution, verification, canon, merge, deployment, hosting, or external delivery.

## G — execution receipts

Implemented:

- `docs/flock/MAILBOX.json` — canonical address and alias index for three role packets;
- `src/data/flockMailboxDiscovery.ts` — strict mailbox validation and `P(address)` resolution;
- `scripts/validate-flock-mailbox.mjs` — exact commit-tree reads plus SHA-256 packet verification;
- `tests/contracts/contracts.test.mjs` — successful lookup, freshness, spoofing, ambiguity, mutation, traversal, digest, and effect-claim contracts;
- `.github/workflows/verify.yml` — full-history checkout and immutable mailbox gate;
- `src/data/flockRelaySnapshot.ts` and `src/components/FlockRelaySnapshotCard.tsx` — mailbox provenance and non-escalating discovery truth;
- `docs/flock/PULL_PROTOCOL.md` and `README.md` — stable plain-P entry point and fail-closed rules.

The first cloud proof run, `29890373821`, correctly failed because the default shallow checkout did not contain the immutable V commit tree. The workflow was repaired to fetch history. Connector reads independently confirmed every packet path exists at the checkpoint.

## Cloud proof

Implementation source head: `bf513d81a21375006403ea1e2e16b398cf6b0430`  
Pull-request build tree: `5700deb37fab8501a11949a314fbf017cf222e3f`  
GitHub Actions run: `29890426988` — `success`

Passed gates:

- immutable mailbox packet verification;
- behavior contracts;
- TypeScript typecheck;
- Android export;
- web export;
- source/build identity binding;
- identical artifact receipt generation.

Artifacts:

- Android: `8518045817`, `harvey-mobile-android-5700deb37fab8501a11949a314fbf017cf222e3f`, digest `sha256:0b12eeca62273e9fe1e4fc28432c2c22873ac32276d80278120e3ea34ef25fd6`;
- Web: `8518046049`, `harvey-mobile-web-5700deb37fab8501a11949a314fbf017cf222e3f`, digest `sha256:8817034f2eec5a036d9150097d2dbbf9676c70a62a62c9951d6057ea132d681a`.

Both artifacts expire July 29, 2026. The web artifact is downloadable proof, not a live or hosted deployment.

## Boundary

The mailbox is `PENDING_PR_MERGE` in PR #3. Until merge, plain P on `main` cannot discover it; root must supply the immutable packet URL. Merge, promotion, canon write, deployment, hosting, live dispatch, and external receiver delivery remain unclaimed and behind their own human gates.

Transport: `NONE`  
Requested: `false`  
Executed externally: `false`  
Canon written: `false`  
Merged: `false`  
Deployed: `false`  
Hosted: `false`
