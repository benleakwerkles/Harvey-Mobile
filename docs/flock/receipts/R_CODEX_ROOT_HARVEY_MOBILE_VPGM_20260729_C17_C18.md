# Flock receipt — Harvey Mobile VPGM C17 + C18

- receipt: `R_CODEX_ROOT_HARVEY_MOBILE_VPGM_20260729_C17_C18`
- repository: `benleakwerkles/Harvey-Mobile`
- sandbox branch: `codex/harvey-mobile-vpg-20260719`
- execution/integration owner: `CODEX_ROOT@MEDULLINA`
- pull request: draft `#3`
- boundary: cloud sandbox only; no local Harvey source, merge, deploy, canon write, external delivery, or live transport

## C17 — Action Compass

- immutable packet checkpoint: `cdac1cb7732411d5d55c10ecdc636e70268bd5e9`
- Dink A blob: `96ac6819d4746db509e1dac14c12113e7d98bdf5`
- Dink B blob: `f465daa9edfa4754cd86af49a76e00de44fadf92`
- Cursor/Ender A blob: `39364c0008f4f14eed707a3d510fe910e4e1edd3`
- Cursor/Ender B blob: `7f170dd039dd3cc8028a42cd5f4cab49fb8a8c92`
- Bean/Thufir A blob: `657b7365d2e43273a3b58476ba8dee0f8d1bbc9b`
- Bean/Thufir B blob: `233392bd53ff6ca2696d0f47e00c1833128c8d72`
- P receipt: every addressed Aeye independently returned both exact packet blobs before G; Cursor/Ender visibility test passed.
- G: deterministic Action Compass model, accessible card, Home integration, and contracts.
- implementation head: `f865e7ee7a09076bbe2eaedda522db4c4a346503`
- GitHub Actions run: `30483924979` — success
- contracts: `83/83`; typecheck, identity binding, Android export, and Web export — success
- Android artifact: `8736837810` — `sha256:2ee4fdd28eef854976055f08b9db76d150b976a6563bc6f322e2bbd7bb0dfbaa`
- Web artifact: `8736838206` — `sha256:5ddadd1138869e596149a5397d6516ac3965855e20462cf15cc8e50193be2e93`

## C18 — Pocket Brief

- immutable packet checkpoint: `2a0812ba0d34033ea043e1dfaed632b6455b41af`
- Dink A blob: `89e510e169c7dc198563adc0ddf96c481d6fde5e`
- Dink B blob: `b411c32687d8e9862dbdc0dfbc5761c43b89cf36`
- Cursor/Ender A blob: `531d8eb729d6e0a642c1ba2a6fe368bf7d4a500a`
- Cursor/Ender B blob: `8b0b6240b61b64b4242d691dbffaaa5a5bfd45c0`
- Bean/Thufir A blob: `0ac60ee6562550e14cdd3d70db4e1ae3604f032c`
- Bean/Thufir B blob: `1e6b074ac1c278f59ef1e2ff577b60cb556e8335`
- P receipt: every addressed Aeye independently returned both exact packet blobs before G; Cursor/Ender repeated the visibility test successfully.
- G: deterministic Pocket Brief model, accessible card, Home integration, and contracts.
- implementation head: `bebd013c8c2c87953e0e2f3ad2e1e63b55e069c1`
- GitHub Actions run: `30484863848` — success
- contracts: `88/88`; typecheck, identity binding, Android export, and Web export — success
- Android artifact: `8737202734` — `sha256:ef7f3ed7c8f3edc545387b0f7b3fc30d42e66edcd04389c30271bf0859ce8867`
- Web artifact: `8737203095` — `sha256:4548674d9b350b7ba479dfc3f3f18e1dd6f44988633dff1434b2606f63902ac9`

## Execution truth

- V: six separate immutable cloud packet files were created per cycle, two for each of Dink, Cursor/Ender, and Bean/Thufir.
- P: each Aeye group pulled and verified its own two addressed packets by exact blob SHA before implementation.
- G: Handeyes supplied independent model, UI, and contract ideas/code; CODEX_ROOT reviewed, integrated, pushed, and gated the combined result.
- M: C17 completed, then the full V/P/G loop repeated as C18.
- Ender packet visibility: **PASS ×2**.
- effect flags: all false; session-only advisory UI; transport none.
