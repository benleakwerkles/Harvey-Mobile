# Execution receipt — Harvey Mobile V/P/G cycle two

State: `SANDBOX_G_RECEIPTED`
Execution owner: `CODEX_ROOT`
Implementation commit: `8c6f8f78d3cd6202e41a2f7f348e5175343b822b`
Branch-push run: `29618004815` — `SUCCESS`
Run URL: `https://github.com/benleakwerkles/Harvey-Mobile/actions/runs/29618004815`
PR verification run: `29618006967` — `SUCCESS`

## Two executed moves

1. Added an independent bundle-tree identity contract and phone UI. CI injects the exact checked-out tree SHA; missing or malformed local identity stays explicitly unbound and never falls back to the older project-state snapshot.
2. Added Android and web cloud exports from the same tree, exact-SHA bundle checks, deterministic file inventories, and one identical `DOWNLOADABLE BUILD ARTIFACT · NOT LIVE` receipt copied into both outputs.

## Branch-push artifacts

| Platform | Artifact ID | Artifact name | Size | GitHub archive digest |
| --- | ---: | --- | ---: | --- |
| Android | `8421192040` | `harvey-mobile-android-8c6f8f78d3cd6202e41a2f7f348e5175343b822b` | `1628771` | `sha256:11ac1fed846d0329402caca07d2ef2f1b6bb2851e2a702e3590b2641a0e07342` |
| Web | `8421192234` | `harvey-mobile-web-8c6f8f78d3cd6202e41a2f7f348e5175343b822b` | `323444` | `sha256:7357c07f45c50688043caaa41cda856b1905015511035df83b7bc94052bd4ad1` |

Both expire `2026-07-24`. The web output is a downloadable static artifact, not hosting or a live preview.

## Synthetic-merge cross-check

The pull-request run built tree `246d61c6937f70b452d482f8265ed7be9604e75f` while retaining source head `8c6f8f78d3cd6202e41a2f7f348e5175343b822b`. Its artifact names use the built tree, proving that source-head and build-tree identity are no longer collapsed.

## Pull and boundary receipt

- Dink: `RECEIPTED` at `docs/flock/receipts/R_DINK_HARVEY_MOBILE_BUILD_IDENTITY_20260717_C2.md`.
- Cursor/Ender role-agent: `RECEIPTED_INTERNAL_ROLE_AGENT` at `docs/flock/receipts/R_CURSOR_ENDER_HARVEY_MOBILE_CLOUD_PREVIEW_20260717_C2.md`.
- Bean/Thufir: `RECEIPTED` at `docs/flock/receipts/R_BEAN_THUFIR_HARVEY_MOBILE_EVIDENCE_AUDIT_20260717_C2.md`.
- External Ender/Claude remains `BLOCKED_UNBOUND`; no external delivery or execution is claimed.
- Promotion approval remains `PENDING`. Canon was not written or tested; nothing was merged, deployed, hosted, or made live.

This receipt intentionally binds the prior implementation commit and its completed runs. The later documentation commit containing this receipt does not retroactively claim those artifacts.
