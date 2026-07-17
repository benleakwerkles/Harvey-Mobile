import assert from "node:assert/strict";
import test from "node:test";

import { createCaptureDraftReceipt } from "../../src/data/captureDraft.ts";
import { calculateProgress, getProjectSnapshotView } from "../../src/data/projectSnapshot.ts";
import { validatePromotionReceipt } from "../../scripts/validate-promotion-receipt.mjs";

const snapshot = Object.freeze({
  project: "Werkles",
  sourcePath: "docs/flock/STATE.json",
  sourceSha: "fbfe3f3bf35b6811b32a0efefd79026c9d04affc",
  observedAt: "2026-07-17T18:36:03.000Z",
  truth: "SNAPSHOT_NOT_LIVE",
});

test("snapshot freshness and progress are deterministic", () => {
  assert.deepEqual(
    [
      getProjectSnapshotView(snapshot, new Date("2026-07-17T23:59:59.000Z")).freshness,
      getProjectSnapshotView(snapshot, new Date("2026-07-19T18:36:03.000Z")).freshness,
      getProjectSnapshotView(snapshot, new Date("2026-07-25T18:36:03.000Z")).freshness,
    ],
    ["RECENT SNAPSHOT", "AGING SNAPSHOT", "STALE SNAPSHOT"],
  );
  assert.equal(calculateProgress([]), 0);
  assert.equal(calculateProgress([{ done: true }, { done: false }, { done: false }, { done: false }]), 25);
  assert.equal(calculateProgress([{ done: true }, { done: true }]), 100);
});

test("snapshot rejects mutable or escaping provenance", () => {
  for (const invalid of [
    { ...snapshot, sourceSha: "a".repeat(39) },
    { ...snapshot, sourceSha: "z".repeat(40) },
    { ...snapshot, sourcePath: "../STATE.json" },
    { ...snapshot, sourcePath: "C:\\STATE.json" },
  ]) {
    assert.throws(() => getProjectSnapshotView(invalid, new Date("2026-07-18T00:00:00.000Z")));
  }
  assert.throws(() => getProjectSnapshotView(snapshot, new Date("2026-07-17T18:36:02.000Z")), /future/);
});

test("capture accepts the exact boundary and returns no raw content", () => {
  const now = new Date("2026-07-17T19:00:00.000Z");
  const result = createCaptureDraftReceipt("x".repeat(10_000), now);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.receipt.requestId, `capture-local-${now.getTime().toString(36)}`);
  assert.equal(result.receipt.characterCount, 10_000);
  assert.equal(result.receipt.proofState, "LOCAL_DRAFT_NOT_DISPATCHED");
  const serialized = JSON.stringify(result.receipt);
  for (const forbiddenKey of ["body", "text", "note", "raw", "payload", "preview"]) {
    assert.equal(Object.hasOwn(result.receipt, forbiddenKey), false);
  }
  assert.equal(serialized.includes("x".repeat(40)), false);
});

test("capture rejects blank, oversized, secret-shaped, and embedded credentials", () => {
  const now = new Date("2026-07-17T19:00:00.000Z");
  const rejected = [
    "   \n",
    "x".repeat(10_001),
    "token: abc",
    "api_key = abc",
    "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9",
    "https://alice:p%40ss@example.com/repo",
    "-----BEGIN OPENSSH PRIVATE KEY-----",
    `ghp_${"a".repeat(36)}`,
    `github_pat_${"a".repeat(24)}`,
    `sk-${"a".repeat(24)}`,
  ];
  rejected.forEach((candidate) => assert.equal(createCaptureDraftReceipt(candidate, now).ok, false));
  assert.equal(createCaptureDraftReceipt("please schedule token cleanup", now).ok, true);
});

function preparedPromotionReceipt() {
  return {
    schema_version: 1,
    receipt_id: "PROMOTION_HARVEY_MOBILE_20260717_001",
    state: "PREPARED",
    sandbox_sha: "f".repeat(40),
    canon_base_sha: "31946157695fc6c442f89fa8b52540bf5e19fe1e",
    canon_candidate_sha: null,
    sandbox_run: null,
    canon_run: null,
    file_map: [
      {
        sandbox_source: "src/data/projectSnapshot.ts",
        canon_destination: "Harvey/Werkles Mobile/mobile-app/src/data/projectSnapshot.ts",
        source_sha256: "a".repeat(64),
      },
    ],
    truth_labels: {
      sandbox_built: false,
      sandbox_tested: false,
      promotion_approved: false,
      canon_written: false,
      canon_tested: false,
      merged: false,
      deployed: false,
    },
    approval: { state: "PENDING", bound_receipt_digest: null },
  };
}

test("promotion receipt confines destinations and preserves approval order", () => {
  assert.deepEqual(validatePromotionReceipt(preparedPromotionReceipt()), { ok: true });
  assert.throws(
    () => validatePromotionReceipt({ ...preparedPromotionReceipt(), sandbox_sha: "main" }),
    /INVALID_SANDBOX_SHA/,
  );
  const escaping = preparedPromotionReceipt();
  escaping.file_map[0].canon_destination = "../Courtney/file.ts";
  assert.throws(() => validatePromotionReceipt(escaping), /PATH_ESCAPE|OUT_OF_BOUNDS/);
  const premature = preparedPromotionReceipt();
  premature.state = "APPROVED";
  assert.throws(() => validatePromotionReceipt(premature), /SANDBOX|APPROVAL/);
  const deployed = preparedPromotionReceipt();
  deployed.truth_labels.deployed = true;
  assert.throws(() => validatePromotionReceipt(deployed), /FORBIDDEN/);
});
