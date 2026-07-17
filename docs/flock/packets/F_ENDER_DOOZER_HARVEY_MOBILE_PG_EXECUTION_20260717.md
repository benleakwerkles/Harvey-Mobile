# Flock packet — Ender/Doozer P + G execution

Packet ID: `F_ENDER_DOOZER_HARVEY_MOBILE_PG_EXECUTION_20260717`
Status: `READY_FOR_PULL`
Address: `ENDER_DOOZER@MEDULLINA`
Project: `HARVEY_MOBILE_SANDBOX`
Execution/push owner: `CODEX_ROOT`

## Canonical locations

- Build sandbox: `benleakwerkles/Harvey-Mobile`
- Sandbox branch: `codex/harvey-mobile-vpg-20260717`
- Canon/source of truth: `benleakwerkles/Werkles/Harvey/Werkles Mobile/`
- Never use Courtney repositories or folders.

## P means pull

P means: retrieve and read your latest addressed packet **and** the latest Flock state before reasoning or acting. Do not substitute memory, an older upload, a different agent's packet, or an assumed repo state.

Public no-auth pull URLs:

- This packet: `https://raw.githubusercontent.com/benleakwerkles/Harvey-Mobile/codex/harvey-mobile-vpg-20260717/docs/flock/packets/F_ENDER_DOOZER_HARVEY_MOBILE_PG_EXECUTION_20260717.md`
- Flock state: `https://raw.githubusercontent.com/benleakwerkles/Harvey-Mobile/codex/harvey-mobile-vpg-20260717/docs/flock/STATE.json`
- Build packet: `https://raw.githubusercontent.com/benleakwerkles/Harvey-Mobile/codex/harvey-mobile-vpg-20260717/docs/flock/packets/F_CURSOR_ENDER_HARVEY_MOBILE_BUILD_20260717.md`

Successful P requires a readback naming:

1. packet ID;
2. exact sandbox branch and 40-character checkpoint SHA found in the packet/state;
3. target role and instance, or `UNBOUND` if no instance is proven;
4. constraints and stop conditions.

If none of the public URLs can be opened, return `BLOCKED_PULL_UNAVAILABLE` with the attempted URL and observed failure. Do not proceed from a fabricated packet.

## G means execute

G means:

1. inspect the pulled packet and current evidence;
2. choose the two strongest ideas that advance that packet's objective while obeying its boundaries;
3. **perform** those two moves using tools actually available to you;
4. verify the resulting artifacts or behavior;
5. return a correlated receipt.

Merely listing two ideas is not G. Created, drafted, queued, or sent is not completed. If your tools are read-only, execution may produce complete patch-ready artifacts or reviewed content in your available output surface, but the receipt must say `READ_ONLY_ARTIFACT` and must not claim a repo write. If execution requires unavailable GitHub authorization, a missing repo, secrets, production access, deployment, or canon push, return a specific blocker instead of inventing success.

For this packet, the two candidate build moves are:

1. provenance-backed command board with `SNAPSHOT · NOT LIVE` truth;
2. secret-safe session capture with `LOCAL_DRAFT_NOT_DISPATCHED` receipts.

Select and execute both unless fresh evidence proves one unsafe or already complete. Do not replace Expo manifests, Router scaffolding, or canon components. Do not push; `CODEX_ROOT` owns integration and push.

## Required receipt

```text
RECEIVER: ENDER_DOOZER@MEDULLINA
PACKET_ID: F_ENDER_DOOZER_HARVEY_MOBILE_PG_EXECUTION_20260717
P_STATE: RECEIVED | BLOCKED_PULL_UNAVAILABLE
READ_BRANCH:
READ_SHA:
TARGET_INSTANCE: exact id | UNBOUND
IDEA_1:
ACTION_1_PERFORMED:
ARTIFACT_1:
VERIFY_1:
IDEA_2:
ACTION_2_PERFORMED:
ARTIFACT_2:
VERIFY_2:
G_STATE: RECEIPTED | READ_ONLY_ARTIFACT | BLOCKED
BLOCKER: none | exact blocker
NO_FALSE_CLAIMS: confirmed
```

If project identity or experience context has drifted, include `MAIL MOTHERFUCKER` for Swanson and explain the missing context. That phrase is an escalation request, not proof it was delivered.
