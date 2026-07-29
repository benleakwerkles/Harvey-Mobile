export const HARVEY_MOBILE_REPOSITORY = "benleakwerkles/Harvey-Mobile" as const;
export const FLOCK_MAILBOX_PATH = "docs/flock/MAILBOX.json" as const;

export type MailboxEffectFlags = Readonly<{
  dispatched: false;
  requested: false;
  executed: false;
  verified: false;
  canon_written: false;
  merged: false;
  deployed: false;
  hosted: false;
}>;

export type FlockMailboxEntry = Readonly<{
  canonical_address: string;
  aliases: readonly string[];
  packet_id: string;
  cycle: string;
  packet_commit_sha: string;
  packet_path: string;
  packet_sha256: string;
  blob_url: string;
  raw_url: string;
  discovery_state: "FOUND";
  pull_proof: "READ_ONLY_ROLE_AGENT";
  internal_role_agent: true;
}>;

export type FlockMailbox = Readonly<{
  schema_version: 1;
  project_id: "HARVEY_MOBILE_SANDBOX";
  repository: typeof HARVEY_MOBILE_REPOSITORY;
  mailbox_path: typeof FLOCK_MAILBOX_PATH;
  current_branch: string;
  packet_checkpoint_sha: string;
  observed_at: string;
  execution_owner: "CODEX_ROOT";
  work_mode: "CLOUD_ONLY";
  transport: "NONE";
  availability: "PENDING_PR_MERGE" | "DEFAULT_BRANCH";
  stable_default_branch_url: string;
  discovery_truth: "FOUND_DOES_NOT_IMPLY_PULLED_OR_RECEIPTED";
  external_ender_state: "BLOCKED_UNBOUND";
  effect_flags: MailboxEffectFlags;
  entries: readonly FlockMailboxEntry[];
}>;

export type MailboxResolution = Readonly<{
  state: "FOUND";
  truth: "FOUND_NOT_PULLED_OR_RECEIPTED";
  selected_address: string;
  canonical_address: string;
  packet_id: string;
  packet_commit_sha: string;
  packet_path: string;
  packet_sha256: string;
  blob_url: string;
  raw_url: string;
  mailbox_path: typeof FLOCK_MAILBOX_PATH;
  mailbox_observed_at: string;
  age_days: number;
  execution_owner: "CODEX_ROOT";
  transport: "NONE";
  external_ender_state: "BLOCKED_UNBOUND";
  effect_flags: MailboxEffectFlags;
}>;

export type MailboxErrorCode =
  | "ADDRESS_REQUIRED"
  | "NO_PACKET"
  | "MAILBOX_INVALID"
  | "MAILBOX_STALE"
  | "PACKET_MISMATCH";

export class MailboxResolutionError extends Error {
  readonly code: MailboxErrorCode;

  constructor(code: MailboxErrorCode, message: string) {
    super(message);
    this.name = "MailboxResolutionError";
    this.code = code;
  }
}

const FULL_SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const ADDRESS = /^[A-Z0-9_]+@MEDULLINA$/;
const PACKET_ID = /^F_[A-Z0-9_]+_C[0-9]+$/;
const CYCLE = /^HARVEY_MOBILE_VPG_C[0-9]+$/;
const ZERO_EFFECTS: MailboxEffectFlags = Object.freeze({
  dispatched: false,
  requested: false,
  executed: false,
  verified: false,
  canon_written: false,
  merged: false,
  deployed: false,
  hosted: false,
});

function fail(message: string): never {
  throw new MailboxResolutionError("MAILBOX_INVALID", message);
}

function normalizeAddress(address: string): string {
  return address.trim().toUpperCase();
}

function assertRepositoryRelativePath(candidate: string, label: string): void {
  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    fail(label + " contains invalid encoding.");
  }
  const normalized = decoded.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (
    normalized === "" ||
    normalized.startsWith("/") ||
    /^[A-Za-z]:/.test(normalized) ||
    segments.includes("..") ||
    segments.includes(".") ||
    segments.some((segment) => segment === "")
  ) {
    fail(label + " must be repository-relative and traversal-free.");
  }
}

function assertZeroEffects(flags: MailboxEffectFlags): void {
  const keys = Object.keys(ZERO_EFFECTS) as (keyof MailboxEffectFlags)[];
  if (keys.some((key) => flags?.[key] !== false)) {
    fail("Mailbox discovery cannot claim effects.");
  }
}

export function validateFlockMailbox(
  mailbox: FlockMailbox,
  packetEvidence: Readonly<Record<string, Readonly<{ text: string; sha256: string }>>> = {},
): FlockMailbox {
  if (mailbox.schema_version !== 1 || mailbox.project_id !== "HARVEY_MOBILE_SANDBOX") fail("Mailbox schema or project is invalid.");
  if (mailbox.repository !== HARVEY_MOBILE_REPOSITORY) fail("Mailbox repository is invalid.");
  if (mailbox.mailbox_path !== FLOCK_MAILBOX_PATH) fail("Mailbox path is invalid.");
  assertRepositoryRelativePath(mailbox.mailbox_path, "Mailbox path");
  if (!FULL_SHA.test(mailbox.packet_checkpoint_sha)) fail("Mailbox checkpoint must be a full lowercase SHA.");
  if (mailbox.execution_owner !== "CODEX_ROOT" || mailbox.work_mode !== "CLOUD_ONLY" || mailbox.transport !== "NONE") {
    fail("Mailbox ownership, work mode, or transport is unsafe.");
  }
  if (!["PENDING_PR_MERGE", "DEFAULT_BRANCH"].includes(mailbox.availability)) fail("Mailbox availability is invalid.");
  if (mailbox.stable_default_branch_url !== "https://github.com/" + HARVEY_MOBILE_REPOSITORY + "/blob/main/" + FLOCK_MAILBOX_PATH) {
    fail("Stable mailbox URL is invalid.");
  }
  if (mailbox.discovery_truth !== "FOUND_DOES_NOT_IMPLY_PULLED_OR_RECEIPTED") fail("Mailbox discovery truth is invalid.");
  if (mailbox.external_ender_state !== "BLOCKED_UNBOUND") fail("External Ender must remain blocked and unbound.");
  assertZeroEffects(mailbox.effect_flags);
  if (!Number.isFinite(Date.parse(mailbox.observed_at))) fail("Mailbox observation time is invalid.");
  if (!Array.isArray(mailbox.entries) || mailbox.entries.length === 0) fail("Mailbox has no entries.");

  const sorted = [...mailbox.entries].map((entry) => entry.canonical_address).sort();
  if (sorted.some((address, index) => address !== mailbox.entries[index]?.canonical_address)) {
    fail("Mailbox entries must use deterministic canonical-address ordering.");
  }

  const seenAddresses = new Set<string>();
  const seenPacketIds = new Set<string>();
  for (const entry of mailbox.entries) {
    const addresses = [entry.canonical_address, ...entry.aliases].map(normalizeAddress);
    if (!ADDRESS.test(entry.canonical_address) || addresses.some((address) => !ADDRESS.test(address))) fail("Mailbox address is invalid.");
    if (addresses.some((address) => seenAddresses.has(address))) fail("Mailbox address or alias is ambiguous.");
    addresses.forEach((address) => seenAddresses.add(address));
    if (!PACKET_ID.test(entry.packet_id) || seenPacketIds.has(entry.packet_id)) fail("Mailbox packet ID is invalid or duplicated.");
    seenPacketIds.add(entry.packet_id);
    if (!CYCLE.test(entry.cycle)) fail("Mailbox cycle is invalid.");
    if (entry.packet_commit_sha !== mailbox.packet_checkpoint_sha || !FULL_SHA.test(entry.packet_commit_sha)) fail("Mailbox packet SHA is stale or mismatched.");
    if (!SHA256.test(entry.packet_sha256)) fail("Mailbox packet digest is invalid.");
    assertRepositoryRelativePath(entry.packet_path, "Packet path");
    if (!entry.packet_path.startsWith("docs/flock/packets/") || !entry.packet_path.endsWith("/" + entry.packet_id + ".md")) {
      fail("Mailbox packet path does not match its packet ID.");
    }
    const expectedBlob = "https://github.com/" + HARVEY_MOBILE_REPOSITORY + "/blob/" + entry.packet_commit_sha + "/" + entry.packet_path;
    const expectedRaw = "https://raw.githubusercontent.com/" + HARVEY_MOBILE_REPOSITORY + "/" + entry.packet_commit_sha + "/" + entry.packet_path;
    if (entry.blob_url !== expectedBlob || entry.raw_url !== expectedRaw) fail("Mailbox packet URL is mutable or mismatched.");
    if (entry.discovery_state !== "FOUND" || entry.pull_proof !== "READ_ONLY_ROLE_AGENT" || entry.internal_role_agent !== true) {
      fail("Mailbox packet state must remain an internal read proof.");
    }
    if (entry.canonical_address.includes("ENDER") && mailbox.external_ender_state !== "BLOCKED_UNBOUND") {
      fail("Internal Ender cannot imply external delivery.");
    }

    const evidence = packetEvidence[entry.packet_path];
    if (evidence) {
      if (evidence.sha256 !== entry.packet_sha256) throw new MailboxResolutionError("PACKET_MISMATCH", "Packet digest does not match the mailbox.");
      if (!evidence.text.includes(entry.packet_id) || !evidence.text.includes(entry.cycle)) {
        throw new MailboxResolutionError("PACKET_MISMATCH", "Packet metadata does not match the mailbox.");
      }
    }
  }

  return mailbox;
}

export function resolveFlockPacket(
  mailbox: FlockMailbox,
  address: string,
  now: Date,
  maxAgeDays = 30,
): MailboxResolution {
  validateFlockMailbox(mailbox);
  const selected = normalizeAddress(address);
  if (selected === "") throw new MailboxResolutionError("ADDRESS_REQUIRED", "ADDRESS REQUIRED · Select one mailbox before pulling.");
  if (!Number.isFinite(now.getTime())) throw new MailboxResolutionError("MAILBOX_INVALID", "Mailbox resolution time is invalid.");

  const entry = mailbox.entries.find((candidate) =>
    [candidate.canonical_address, ...candidate.aliases].map(normalizeAddress).includes(selected),
  );
  if (!entry) throw new MailboxResolutionError("NO_PACKET", "NO PACKET · This mailbox has no selectable packet.");

  const ageDays = Math.floor((now.getTime() - Date.parse(mailbox.observed_at)) / 86_400_000);
  if (ageDays < 0) throw new MailboxResolutionError("MAILBOX_INVALID", "Mailbox observation cannot be in the future.");
  if (ageDays > maxAgeDays) throw new MailboxResolutionError("MAILBOX_STALE", "MAILBOX STALE · Refresh the committed mailbox before pulling.");

  return Object.freeze({
    state: "FOUND",
    truth: "FOUND_NOT_PULLED_OR_RECEIPTED",
    selected_address: selected,
    canonical_address: entry.canonical_address,
    packet_id: entry.packet_id,
    packet_commit_sha: entry.packet_commit_sha,
    packet_path: entry.packet_path,
    packet_sha256: entry.packet_sha256,
    blob_url: entry.blob_url,
    raw_url: entry.raw_url,
    mailbox_path: FLOCK_MAILBOX_PATH,
    mailbox_observed_at: mailbox.observed_at,
    age_days: ageDays,
    execution_owner: "CODEX_ROOT",
    transport: "NONE",
    external_ender_state: "BLOCKED_UNBOUND",
    effect_flags: ZERO_EFFECTS,
  });
}
