# Harvey Mobile Flock Network Ingress Protocol

## Purpose

This contract gives `DINK@MEDULLINA` a deterministic, fail-closed path for a future invitation from `SWANSON@DOSS`. It records evidence without claiming transport, acceptance, membership, execution, or delivery that has not occurred.

The current inbox is deliberately `UNOBSERVED`: no authenticated Swanson invitation has reached this task.

## Trust boundary

- Harvey Mobile repository: `benleakwerkles/Harvey-Mobile`
- Canonical invitation source: `benleakwerkles/Werkles`
- Canonical source repository ID: `1242158598`
- Canonical source branch: `main`
- Allowed source path prefix: `Harvey/Flock/`
- Expected sender: `SWANSON@DOSS`
- Receiver: `DINK@MEDULLINA`
- Execution owner: `CODEX_ROOT`
- Work mode: `CLOUD_ONLY`
- Transport before proof: `NONE`

An invitation must name the exact sender role, sender machine, receiver, canonical repository and repository ID, canonical path, full lowercase commit SHA, SHA-256 payload digest, observation time, expiry, monotonic sequence, and unique invitation ID. Mutable or short refs are never accepted. A populated inbox must provide matching payload evidence; metadata alone is not discovery proof.

## Proof ladder

1. `UNOBSERVED` — no authenticated invitation is present.
2. `DISCOVERED` — immutable metadata and matching payload evidence validate. This is not receipt.
3. `RECEIVED` — a matching receipt digest proves the receiver obtained the invitation. This is not acceptance.
4. `ACCEPTED` — `DINK@MEDULLINA` is named in a matching acceptance proof. This is not network membership.
5. `JOINED` — a topology identifier and joined timestamp prove membership.

States are monotonic. Proof timestamps must follow observation and precede expiry. Every higher state requires all lower-state proof fields, and proof for a higher state is forbidden on a lower state. Discovery never implies receipt; receipt never implies acceptance; acceptance never implies joining.

## Fail-closed results

- `INVITATION_REQUIRED` — resolution attempted without an invitation ID.
- `INVITATION_NOT_FOUND` — requested ID does not exist.
- `INBOX_INVALID` — schema, ownership, ordering, time, or zero-effect boundary is invalid.
- `SPOOFED_SENDER` — sender differs from `SWANSON@DOSS`.
- `TOPOLOGY_MISMATCH` — invitation is not addressed to `DINK@MEDULLINA`.
- `MUTABLE_REF` — source branch, SHA, or URL is mutable or malformed.
- `WRONG_REPOSITORY` — repository name or ID is not canonical Werkles.
- `PATH_TRAVERSAL` — source path is absolute, encoded, empty, or escaping.
- `DIGEST_MISMATCH` — payload evidence is missing or mismatched.
- `INVITATION_EXPIRED` — validity window is invalid or expired.
- `INVITATION_REPLAY` — invitation ID or digest was already used.
- `SEQUENCE_INVALID` — sequence is duplicated, rolled back, or out of order.
- `DUPLICATE_INVITATION` — inbox contains a duplicate invitation ID.
- `STATE_ESCALATION` — state lacks required proofs or claims later proof.

Unknown or invalid input never falls back to search, mutable branch content, another repository, or inferred network membership.

## Current truthful state

`docs/flock/NETWORK_INBOX.json` registers the expected route but contains zero invitations. All effect flags are false. A Swanson ping may be recorded only after immutable source and digest evidence validates; joining the network requires a separately proven `JOINED` state.
