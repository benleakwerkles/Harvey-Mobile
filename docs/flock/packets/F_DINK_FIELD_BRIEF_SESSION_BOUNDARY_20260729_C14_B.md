# FLOCK PACKET — Field-brief lifecycle boundary

Packet ID: `F_DINK_FIELD_BRIEF_SESSION_BOUNDARY_20260729_C14_B`
Cycle: `C14`
To: `DINK@MEDULLINA`
From: `DINK@MEDULLINA / CODEX_ROOT`
Repository: `benleakwerkles/Harvey-Mobile`
Branch: `codex/harvey-mobile-vpg-20260719`
Verified base head: `7ee9417518b767d06fc41021b91688bbf899c48d`
Base CI: `30468117264` — success, 59/59 contracts, typecheck, Android/Web exports and identity binding passed
Authority: CODEX_ROOT owns review, cloud integration, push, and verification. You own implementation opinion and authored bytes.

## P

Pull this exact immutable packet from the cloud branch. Confirm this packet path and blob independently before G. Do not use or create a local Harvey Mobile source folder.

## Product slice

Build the next Harvey Mobile slice: a deterministic, offline-safe FIELD BRIEF that turns the Daily Mission plus evidence/promotion/build state into a bounded phone-ready briefing. It is advisory only: no execution, persistence, network, share, clipboard, approval, merge, deploy, delivery, hosting, or canon effect.

## Your two strongest ideas

1. Define a session-only review lifecycle for selecting a brief section and marking it reviewed without changing source state.
2. Make reset/idempotence/source-identity behavior explicit so Home cannot retain stale reviewed IDs after brief changes.

Do not merely restate the packet. Exercise independent judgment, improve weak edges, and return exact implementation-ready bytes or patches.

## Expected deliverables

- Exact additions to `src/data/fieldBrief.ts` for create/review/advance session operations.
- Exact Home integration correction, especially shared clock and view-identity reset.
- Stable errors for forged or drifted session state.

## Hard gates

- Session persistence `SESSION_ONLY`, transport `NONE`.
- Effects all false; no queue or Daily Mission mutation.
- Re-review is idempotent and canonical order is source-preserving.
- Root, not the Handeye, performs cloud writes.

## G receipt

Return: both P confirmations for your two C14 packets, your two strongest executed contributions, exact files/patches, predicted integration failures, and explicit no-local/no-push/no-merge/no-deploy/no-canon truth. Runtime verification belongs to CODEX_ROOT.
