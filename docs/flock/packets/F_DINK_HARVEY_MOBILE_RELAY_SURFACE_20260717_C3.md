# Flock packet — Dink relay surface, cycle three

Packet ID: `F_DINK_HARVEY_MOBILE_RELAY_SURFACE_20260717_C3`
Status: `READY_FOR_PULL`
Address: `DINK@MEDULLINA`
Execution owner: `CODEX_ROOT`
Work mode: `CLOUD_ONLY`

## P — pull this state

- Repository: `benleakwerkles/Harvey-Mobile`
- Branch: `codex/harvey-mobile-vpg-20260717`
- Cycle-three base SHA: `04178edefaa7d555757abd298070ec559771b4fc`
- Draft PR: `https://github.com/benleakwerkles/Harvey-Mobile/pull/2`
- No Medullina checkout or project folder is authorized.

## G — return exactly two moves

1. Define a typed, deterministic Flock relay snapshot contract for the phone: packet identity, addressed Aeye, receipt state, execution state, proof boundary, and explicit external-Ender blocker.
2. Define the smallest promotion-safe mapping from that contract into the existing app without reading live credentials or implying live relay delivery.

## Receipt boundary

Read-only role-agent. Return `RECEIPTED` with two bounded recommendations and evidence paths, or `BLOCKED` with one concrete blocker. Root alone executes and pushes. Canon, merge, deployment, hosting, and external delivery remain unapproved.
