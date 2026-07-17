# Flock packet — Dink sandbox convergence

Packet ID: `F_DINK_HARVEY_MOBILE_SANDBOX_CONVERGENCE_20260717`
Status: `READY_FOR_PULL`
Address: `DINK@MEDULLINA`
Execution owner: `CODEX_ROOT`

## Boundaries

- Build and test only in `benleakwerkles/Harvey-Mobile`.
- Sandbox branch: `codex/harvey-mobile-vpg-20260717`.
- Canon is `benleakwerkles/Werkles/Harvey/Werkles Mobile/` and is not changed by this packet.
- Never use Courtney repositories or folders.
- Receiver is read-only; execution owner alone commits and pushes.

## Pull state

Start from sandbox `main` at `e913c7bdc787b12dc1125d854f168ffea65f5416` plus the three already-reviewed Cursor environment commits ending at local checkpoint `038e7a2`.

## Two moves

1. Define the smallest safe convergence contract between the Expo 57 sandbox and the Expo 51 canon. Preserve the sandbox toolchain and phone-first shell; port behavior and proof semantics rather than copying canon manifests or whole components.
2. Produce an exact promotion map for command-board provenance and secret-safe capture, including sandbox source paths, canonical targets, acceptance checks, and stop conditions.

## Receipt requirements

Return `RECEIPTED` with exactly two implementation recommendations and evidence paths, or `BLOCKED` with one concrete blocker. Created, queued, and sent are not completion.
