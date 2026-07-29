# Harvey Mobile Handeye Operating Contract

## Authority

This contract supersedes the cycle-six packet phrase **“No writes; root owns execution”** for implementation responsibility. Handeyes are implementation owners. `CODEX_ROOT` remains the integration and push authority.

## Handeye responsibility

Each addressed Handeye must:

1. Pull and validate its exact immutable Flock packet.
2. Form independent technical opinions within the assigned slice.
3. Design and write production-ready code, tests, documentation, and supporting configuration for that slice.
4. Execute the strongest in-scope ideas and run proportionate verification.
5. Return an evidence-backed receipt containing files changed, checks run, results, unresolved risks, and the exact proposed commit or handoff state.

Handeyes must not stop at recommendations or pseudocode when implementation is assigned. They own the technical completeness of their slice until it is accepted, rejected, or redirected by root.

## Root responsibility

`CODEX_ROOT` primarily:

- defines packet scope and shared constraints;
- reviews Handeye design and implementation;
- accepts, rejects, or requests revisions;
- resolves cross-slice conflicts;
- integrates approved work;
- owns branch, commit, push, pull-request, merge, release, and canon-alignment authority;
- keeps Harvey, Harvey Mobile, and the Werkles app aligned with the overall plan.

Root ownership of integration and push authority does not transfer implementation work back to root by default.

## Cloud-only boundary

Harvey Mobile work remains `CLOUD_ONLY` in `benleakwerkles/Harvey-Mobile`. Handeyes must not create a local Harvey Mobile clone, checkout, source folder, or alternate source of truth. Approved implementation bytes move through the authorized cloud repository path and shared integration branch. Canon in `benleakwerkles/Werkles` is unchanged unless a separate human gate explicitly authorizes it.

## Proof and receipt boundary

Flock states are factual and monotonic:

`CREATED → PULLED → IMPLEMENTED → TESTED → REVIEWED → INTEGRATED → PUSHED`

A state may be claimed only when its evidence exists. In particular:

- packet creation does not imply pull;
- pull does not imply implementation;
- implementation does not imply successful tests;
- a Handeye handoff does not imply root approval;
- root approval does not imply integration or push;
- a commit dialog, proposed SHA, or authored byte stream does not imply a remote commit;
- discovery of a Swanson invitation does not imply receipt, acceptance, or network membership.

Receipts must distinguish authored work from remotely committed work and must never fabricate packets, invitations, commits, test results, delivery, merge, deployment, hosting, or canon changes.

## Default execution rule

When a packet assigns an implementation slice, the Handeye executes that slice without waiting for Swanson or another packet unless the assigned work genuinely depends on missing authenticated evidence. Missing cross-machine communication blocks only the dependent network action; it does not block independent Harvey Mobile implementation.
