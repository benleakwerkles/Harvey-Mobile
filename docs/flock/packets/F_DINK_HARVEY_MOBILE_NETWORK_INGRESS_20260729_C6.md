# FLOCK PACKET — Dink@Medullina

Packet ID: `F_DINK_HARVEY_MOBILE_NETWORK_INGRESS_20260729_C6`
Cycle: `HARVEY_MOBILE_VPG_C6`
Execution owner: `CODEX_ROOT`
Repository: `benleakwerkles/Harvey-Mobile`
Branch: `codex/harvey-mobile-vpg-20260719`
Base head: `48bd9e6b48f538d42f71f41e3efdf0045dbe2058`
Work mode: `CLOUD_ONLY`
Sender under observation: `SWANSON@DOSS`
Receiver: `DINK@MEDULLINA`

## Problem

No authenticated Swanson@Doss invitation has reached this task. Harvey Mobile main also lacks the unmerged cycle-five mailbox. The build must continue without inventing receipt, while creating a safe route for a future Doss invitation.

## P

Pull this exact packet using the immutable commit-bound URL supplied by root. Return packet ID, repository, branch, packet path, V checkpoint SHA, `READ_ONLY_ROLE_AGENT`, and confirm that no Swanson invitation is being fabricated.

## G — exactly two ideas

1. Define the smallest deterministic network-inbox contract for Harvey Mobile. It must record sender role, sender machine, receiver, canonical source repository/path/full commit, content digest, observed time, expiry, and a strict `DISCOVERED → RECEIVED → ACCEPTED → JOINED` proof ladder.
2. Define a pure invitation resolver/validator that fails closed on unknown senders, mutable refs, wrong repository, stale or replayed invitations, path escape, digest mismatch, topology mismatch, and state escalation.

Return exactly two recommendations with acceptance criteria and likely files. No writes; root owns execution.
