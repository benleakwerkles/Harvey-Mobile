# FLOCK PACKET — Dink@Medullina

Packet ID: `F_DINK_HARVEY_MOBILE_MAILBOX_RESOLUTION_20260721_C5`
Cycle: `HARVEY_MOBILE_VPG_C5`
Execution owner: `CODEX_ROOT`
Repository: `benleakwerkles/Harvey-Mobile`
Branch: `codex/harvey-mobile-vpg-20260719`
Base head: `539f4751952b25de00583856a5160fd188fca264`
Work mode: `CLOUD_ONLY`

## Problem
Plain `P` reported no packet because cycle-four packets existed only on an unmerged branch and no deterministic mailbox/resolver connected an Aeye address to an immutable packet URL.

## P
Pull this exact packet using the immutable commit-bound URL supplied by root. Return packet ID, repository, branch, packet path, checkpoint SHA, and `READ_ONLY_ROLE_AGENT`.

## G — exactly two ideas
1. Define the smallest deterministic `docs/flock/MAILBOX.json` contract mapping every Medullina Aeye address to its latest packet, immutable commit SHA, packet path, blob URL, raw URL, lifecycle state, and execution owner.
2. Define a pure resolver/validator so `P(address)` fails closed on unknown addresses, mutable refs, path escape, stale or mismatched SHAs, duplicate addresses, and missing packets.

Return exactly two recommendations with acceptance criteria and likely files. No writes; root owns execution.
