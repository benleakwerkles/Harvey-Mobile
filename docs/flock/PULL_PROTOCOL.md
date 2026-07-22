# Harvey Mobile Flock Pull Protocol

## Purpose

Plain **P** means: resolve the addressed Medullina Aeye's latest packet from one canonical mailbox, pull the exact immutable packet, validate it, and return a read receipt. It does not mean dispatch, execution, delivery, merge, deployment, hosting, or canon promotion.

## Canonical lookup

1. Require an explicit address such as `DINK@MEDULLINA`.
2. Read `docs/flock/MAILBOX.json` from the repository default branch.
3. Verify the mailbox repository, path, full packet checkpoint SHA, deterministic address order, unique aliases, expiry, effect flags, and external Ender boundary.
4. Match exactly one canonical address or alias.
5. Pull the packet at `packet_checkpoint_sha:packet_path` using its immutable blob or raw URL.
6. Verify the packet SHA-256 digest and that its body contains the declared packet ID and cycle.
7. Return `FOUND`, then `PULLED`, then `RECEIPTED` only as each stage is actually proven.

## Fail-closed results

- `ADDRESS_REQUIRED` — P was requested without an address.
- `NO_PACKET` — no exact canonical address or alias exists.
- `MAILBOX_INVALID` — repository, path, ordering, ownership, URL, SHA, alias, truth, or boundary validation failed.
- `MAILBOX_STALE` — the mailbox is older than the accepted freshness window.
- `PACKET_MISMATCH` — immutable packet content, identity, cycle, or SHA-256 proof differs.

Unknown, duplicate, mutable, malformed, traversing, stale, or mismatched references never fall back to a search.

## Current availability

The cycle-five mailbox is `PENDING_PR_MERGE` in PR #3. Until it reaches `main`, root may hand an Aeye the exact commit-SHA packet URL and record that exception in the receipt. After merge, the stable entry point is:

`https://github.com/benleakwerkles/Harvey-Mobile/blob/main/docs/flock/MAILBOX.json`

## Ownership and boundary

- Repository: `benleakwerkles/Harvey-Mobile`
- Execution owner: `CODEX_ROOT`
- Work mode: `CLOUD_ONLY`
- Transport: `NONE`
- External Ender/Claude: `BLOCKED_UNBOUND`
- Canon: untouched without a separate human gate
