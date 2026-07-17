import path from "node:path";

const sha40 = /^[a-f0-9]{40}$/i;
const sha256 = /^[a-f0-9]{64}$/i;
const states = ["PREPARED", "SANDBOX_PROVEN", "APPROVED", "CANON_CANDIDATE", "CANON_PROVEN", "BLOCKED"];

function assertRelative(candidate, label) {
  if (typeof candidate !== "string" || candidate.trim() === "") throw new Error(`INVALID_${label}`);
  const posix = candidate.replaceAll("\\", "/");
  if (path.posix.isAbsolute(posix) || /^[a-z]:/i.test(posix) || posix.split("/").includes("..")) {
    throw new Error(`PATH_ESCAPE_${label}`);
  }
  return path.posix.normalize(posix);
}

export function validatePromotionReceipt(receipt) {
  if (receipt?.schema_version !== 1) throw new Error("INVALID_SCHEMA");
  if (typeof receipt.receipt_id !== "string" || receipt.receipt_id.trim() === "") {
    throw new Error("INVALID_RECEIPT_ID");
  }
  if (!states.includes(receipt.state)) throw new Error("INVALID_STATE");
  if (!sha40.test(receipt.sandbox_sha)) throw new Error("INVALID_SANDBOX_SHA");
  if (!sha40.test(receipt.canon_base_sha)) throw new Error("INVALID_CANON_BASE_SHA");
  if (receipt.canon_candidate_sha !== null && !sha40.test(receipt.canon_candidate_sha)) {
    throw new Error("INVALID_CANON_CANDIDATE_SHA");
  }

  if (!Array.isArray(receipt.file_map) || receipt.file_map.length === 0) throw new Error("EMPTY_FILE_MAP");
  const destinations = new Set();
  for (const entry of receipt.file_map) {
    assertRelative(entry.sandbox_source, "SANDBOX_SOURCE");
    const destination = assertRelative(entry.canon_destination, "CANON_DESTINATION");
    if (!destination.startsWith("Harvey/Werkles Mobile/")) throw new Error("CANON_DESTINATION_OUT_OF_BOUNDS");
    if (destinations.has(destination)) throw new Error("DUPLICATE_CANON_DESTINATION");
    destinations.add(destination);
    if (!sha256.test(entry.source_sha256)) throw new Error("INVALID_SOURCE_DIGEST");
  }

  const truth = receipt.truth_labels;
  for (const key of [
    "sandbox_built",
    "sandbox_tested",
    "promotion_approved",
    "canon_written",
    "canon_tested",
    "merged",
    "deployed",
  ]) {
    if (typeof truth?.[key] !== "boolean") throw new Error(`INVALID_TRUTH_LABEL_${key}`);
  }
  if (truth.merged || truth.deployed) throw new Error("MERGE_OR_DEPLOY_CLAIM_FORBIDDEN");

  const approval = receipt.approval;
  if (!["PENDING", "APPROVED", "REJECTED"].includes(approval?.state)) throw new Error("INVALID_APPROVAL_STATE");
  if (approval.state === "PENDING" && approval.bound_receipt_digest !== null) {
    throw new Error("PENDING_APPROVAL_MUST_BE_UNBOUND");
  }
  if (approval.state === "APPROVED" && !sha256.test(approval.bound_receipt_digest)) {
    throw new Error("APPROVAL_DIGEST_REQUIRED");
  }

  const sandboxProven = ["SANDBOX_PROVEN", "APPROVED", "CANON_CANDIDATE", "CANON_PROVEN"].includes(receipt.state);
  if (sandboxProven) {
    if (!truth.sandbox_built || !truth.sandbox_tested) throw new Error("SANDBOX_PROOF_LABELS_REQUIRED");
    if (receipt.sandbox_run?.conclusion !== "success" || !Number.isSafeInteger(receipt.sandbox_run.id)) {
      throw new Error("SUCCESSFUL_SANDBOX_RUN_REQUIRED");
    }
    if (!sha256.test(receipt.sandbox_run.artifact_digest)) throw new Error("SANDBOX_ARTIFACT_DIGEST_REQUIRED");
  }
  if (truth.promotion_approved !== (approval.state === "APPROVED")) {
    throw new Error("APPROVAL_TRUTH_MISMATCH");
  }
  if (["APPROVED", "CANON_CANDIDATE", "CANON_PROVEN"].includes(receipt.state) && approval.state !== "APPROVED") {
    throw new Error("APPROVAL_REQUIRED_FOR_STATE");
  }
  if (["CANON_CANDIDATE", "CANON_PROVEN"].includes(receipt.state)) {
    if (!truth.canon_written || !sha40.test(receipt.canon_candidate_sha)) {
      throw new Error("CANON_CANDIDATE_PROOF_REQUIRED");
    }
  }
  if (receipt.state === "CANON_PROVEN") {
    if (!truth.canon_tested || receipt.canon_run?.conclusion !== "success") {
      throw new Error("CANON_RUN_PROOF_REQUIRED");
    }
  }

  return Object.freeze({ ok: true });
}
