import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { getBuildIdentity } from "../../src/data/buildIdentity.ts";
import { CLOUD_PROOF_SNAPSHOT, compareBundleToProof, getCloudProofView } from "../../src/data/cloudProofSnapshot.ts";
import { FLOCK_RELAY_SNAPSHOT, getFlockRelayView } from "../../src/data/flockRelaySnapshot.ts";
import { createCaptureDraftReceipt } from "../../src/data/captureDraft.ts";
import { createOperationIntent, OPERATION_ACTIONS } from "../../src/data/operationIntent.ts";
import { calculateProgress, getProjectSnapshotView } from "../../src/data/projectSnapshot.ts";
import { validatePromotionReceipt } from "../../scripts/validate-promotion-receipt.mjs";
import { writeBuildArtifactReceipt } from "../../scripts/write-build-artifact-receipt.mjs";

const snapshot = Object.freeze({
  project: "Werkles",
  sourcePath: "docs/flock/STATE.json",
  sourceSha: "fbfe3f3bf35b6811b32a0efefd79026c9d04affc",
  observedAt: "2026-07-17T18:36:03.000Z",
  truth: "SNAPSHOT_NOT_LIVE",
});

test("build identity is either fully CI-bound or explicitly local-unbound", () => {
  assert.deepEqual(getBuildIdentity(undefined), {
    state: "UNBOUND_LOCAL",
    sha: null,
    truthLabel: "BUNDLE TREE SHA · UNBOUND LOCAL",
  });
  assert.deepEqual(getBuildIdentity("A".repeat(40)), {
    state: "CI_BOUND",
    sha: "a".repeat(40),
    truthLabel: "BUNDLE TREE SHA · CI BOUND",
  });
  for (const invalid of ["main", "a".repeat(39), "g".repeat(40), "a".repeat(41)]) {
    assert.equal(getBuildIdentity(invalid).state, "UNBOUND_INVALID");
  }
});

test("Android and web exports receive the same integrity receipt", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "harvey-artifacts-"));
  const androidRoot = path.join(root, "android");
  const webRoot = path.join(root, "web");
  try {
    await Promise.all([mkdir(androidRoot), mkdir(path.join(webRoot, "assets"), { recursive: true })]);
    await Promise.all([
      writeFile(path.join(androidRoot, "bundle.hbc"), "android"),
      writeFile(path.join(webRoot, "index.html"), "<html></html>"),
      writeFile(path.join(webRoot, "assets", "app.js"), "web"),
    ]);
    const receipt = await writeBuildArtifactReceipt({
      androidRoot,
      webRoot,
      repository: "benleakwerkles/Harvey-Mobile",
      eventName: "push",
      runId: "123",
      sourceHeadSha: "a".repeat(40),
      buildTreeSha: "b".repeat(40),
      baseSha: null,
    });
    assert.equal(receipt.truth, "DOWNLOADABLE BUILD ARTIFACT · NOT LIVE");
    assert.equal(receipt.deployment, false);
    assert.deepEqual(
      await readFile(path.join(androidRoot, "HARVEY_ARTIFACT_RECEIPT.json")),
      await readFile(path.join(webRoot, "HARVEY_ARTIFACT_RECEIPT.json")),
    );
    assert.equal(receipt.artifacts[1].files.some((file) => file.path === "index.html"), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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


test("relay snapshot stays immutable, ordered, and externally blocked", () => {
  const view = getFlockRelayView(FLOCK_RELAY_SNAPSHOT, new Date("2026-07-19T17:12:01.000Z"));
  assert.equal(view.readyCount, 0);
  assert.equal(view.receiptedCount, 3);
  assert.equal(view.externalEnderState, "BLOCKED_UNBOUND");
  assert.deepEqual(
    view.packets.map((packet) => packet.packetId),
    [
      "F_DINK_HARVEY_MOBILE_OPERATION_INTENT_20260719_C4",
      "F_CURSOR_ENDER_HARVEY_MOBILE_OPERATIONS_UX_20260719_C4",
      "F_BEAN_THUFIR_HARVEY_MOBILE_OPERATION_SAFETY_20260719_C4",
    ],
  );

  assert.throws(
    () => getFlockRelayView({ ...FLOCK_RELAY_SNAPSHOT, sourcePath: "../STATE.json" }, new Date("2026-07-19T17:12:01.000Z")),
    /repository-relative/,
  );
  assert.throws(
    () => getFlockRelayView({ ...FLOCK_RELAY_SNAPSHOT, externalEnderState: "DELIVERED" }, new Date("2026-07-19T17:12:01.000Z")),
    /receiver proof/,
  );
  assert.throws(
    () => getFlockRelayView({ ...FLOCK_RELAY_SNAPSHOT, packets: [...FLOCK_RELAY_SNAPSHOT.packets, FLOCK_RELAY_SNAPSHOT.packets[0]] }, new Date("2026-07-19T17:12:01.000Z")),
    /unique/,
  );
});

test("internal role receipts cannot become external delivery", () => {
  const internalReceipt = {
    ...FLOCK_RELAY_SNAPSHOT.packets[1],
    state: "RECEIPTED_INTERNAL_ROLE_AGENT",
  };
  const view = getFlockRelayView(
    { ...FLOCK_RELAY_SNAPSHOT, packets: [internalReceipt] },
    new Date("2026-07-19T17:12:01.000Z"),
  );
  assert.equal(view.receiptedCount, 1);
  assert.equal(view.externalEnderState, "BLOCKED_UNBOUND");
  assert.throws(
    () => getFlockRelayView(
      { ...FLOCK_RELAY_SNAPSHOT, packets: [{ ...internalReceipt, internalRoleAgent: false }] },
      new Date("2026-07-19T17:12:01.000Z"),
    ),
    /explicitly internal/,
  );
});

test("cloud proof is run, SHA, artifact, and truth bound", () => {
  const view = getCloudProofView(CLOUD_PROOF_SNAPSHOT);
  assert.equal(view.evidenceState, "PROVEN_HISTORICAL");
  assert.deepEqual(view.boundaryLabels, [
    "NOT LIVE",
    "NOT HOSTED",
    "NOT CANONICAL",
    "NOT MERGED",
    "NOT DEPLOYED",
  ]);
  assert.equal(
    compareBundleToProof(getBuildIdentity("8c6f8f78d3cd6202e41a2f7f348e5175343b822b"), view),
    "SHA MATCH · RECEIPT APPLIES TO THIS BUNDLE",
  );
  assert.equal(
    compareBundleToProof(getBuildIdentity("9".repeat(40)), view),
    "DIFFERENT SHA · THIS BUNDLE IS NOT COVERED BY THE LAST RECEIPT",
  );
  assert.equal(
    compareBundleToProof(getBuildIdentity(undefined), view),
    "CURRENT BUNDLE UNBOUND · NO MATCH CLAIM",
  );

  const mismatched = structuredClone(CLOUD_PROOF_SNAPSHOT);
  mismatched.artifacts[0].runId = 29618006967;
  assert.throws(() => getCloudProofView(mismatched), /selected successful push run/);
  const badDigest = structuredClone(CLOUD_PROOF_SNAPSHOT);
  badDigest.artifacts[1].digest = "sha256:branch";
  assert.throws(() => getCloudProofView(badDigest), /name or digest/);
  assert.throws(() => getCloudProofView({ ...CLOUD_PROOF_SNAPSHOT, deployed: true }), /cannot imply/);
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


test("operation intents are allowlisted, deterministic, frozen, and local only", () => {
  const now = new Date("2026-07-19T17:00:00.000Z");
  for (const action of OPERATION_ACTIONS) {
    const input = {
      actionId: action.id,
      sourceSha: "f".repeat(40),
      expectedSourceSha: "f".repeat(40),
      sourcePath: "docs/flock/STATE.json",
      now,
    };
    const receipt = createOperationIntent(input);
    assert.deepEqual(receipt, createOperationIntent(input));
    assert.equal(Object.isFrozen(receipt), true);
    assert.equal(receipt.stage, "PLANNED_LOCAL");
    assert.equal(receipt.persistence, "SESSION_ONLY");
    assert.equal(receipt.transport, "NONE");
    assert.equal(receipt.truth, "LOCAL_OPERATION_INTENT_NOT_DISPATCHED");
    assert.equal(receipt.executionOwner, "CODEX_ROOT");
    assert.equal(receipt.approvalState, "PENDING_HUMAN_GATE");
    assert.equal(receipt.externalEnderState, "BLOCKED_UNBOUND");
    assert.deepEqual(
      [receipt.requestSent, receipt.executed, receipt.verified, receipt.canonWritten, receipt.merged, receipt.deployed],
      [false, false, false, false, false, false],
    );
    for (const forbiddenKey of ["payload", "raw", "secret", "token", "endpoint", "networkTarget", "delivered"]) {
      assert.equal(Object.hasOwn(receipt, forbiddenKey), false);
    }
  }
  assert.equal(Object.isFrozen(OPERATION_ACTIONS), true);
  OPERATION_ACTIONS.forEach((action) => assert.equal(Object.isFrozen(action), true));
});

test("operation intents fail closed on stale provenance, path escape, or elevated claims", () => {
  const valid = {
    actionId: "RUN_SANDBOX_VERIFY",
    sourceSha: "a".repeat(40),
    expectedSourceSha: "a".repeat(40),
    sourcePath: "docs/flock/STATE.json",
    now: new Date("2026-07-19T17:00:00.000Z"),
  };
  const invalid = [
    { ...valid, actionId: "DEPLOY_CANON" },
    { ...valid, sourceSha: "a".repeat(39) },
    { ...valid, sourceSha: "A".repeat(40), expectedSourceSha: "A".repeat(40) },
    { ...valid, expectedSourceSha: "b".repeat(40) },
    { ...valid, sourcePath: "../STATE.json" },
    { ...valid, sourcePath: "C:\\STATE.json" },
    { ...valid, repository: "courtney/Harvey-Mobile" },
    { ...valid, executionOwner: "ROLE_AGENT" },
    { ...valid, approvalState: "APPROVED" },
  ];
  invalid.forEach((candidate) => assert.throws(() => createOperationIntent(candidate)));
});
