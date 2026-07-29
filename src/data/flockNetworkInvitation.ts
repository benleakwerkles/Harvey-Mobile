export const HARVEY_MOBILE_REPOSITORY = "benleakwerkles/Harvey-Mobile" as const;
export const HARVEY_CANON_REPOSITORY = "benleakwerkles/Werkles" as const;
export const HARVEY_CANON_REPOSITORY_ID = 1242158598 as const;
export const NETWORK_INBOX_PATH = "docs/flock/NETWORK_INBOX.json" as const;
export const EXPECTED_SENDER = "SWANSON@DOSS" as const;
export const NETWORK_RECEIVER = "DINK@MEDULLINA" as const;
export const CANON_PATH_PREFIX = "Harvey/Flock/" as const;

export type NetworkInvitationState = "DISCOVERED" | "RECEIVED" | "ACCEPTED" | "JOINED";
export type NetworkInboxState = "UNOBSERVED" | NetworkInvitationState;

export type NetworkEffectFlags = Readonly<{
  discovered: false; received: false; accepted: false; joined: false;
  dispatched: false; executed: false; verified: false; canon_written: false;
  merged: false; deployed: false; hosted: false;
}>;

export type FlockNetworkInvitation = Readonly<{
  invitation_id: string;
  sender_role: "SWANSON";
  sender_machine: "DOSS";
  sender_address: typeof EXPECTED_SENDER;
  receiver_role: "DINK";
  receiver_machine: "MEDULLINA";
  receiver_address: typeof NETWORK_RECEIVER;
  source_repository: typeof HARVEY_CANON_REPOSITORY;
  source_repository_id: typeof HARVEY_CANON_REPOSITORY_ID;
  source_branch: "main";
  source_commit_sha: string;
  source_path: string;
  content_url: string;
  payload_sha256: string;
  observed_at: string;
  expires_at: string;
  sequence: number;
  state: NetworkInvitationState;
  proof: Readonly<{
    discovered_at: string;
    received_receipt_sha256: string | null;
    accepted_by: typeof NETWORK_RECEIVER | null;
    accepted_at: string | null;
    joined_topology_id: string | null;
    joined_at: string | null;
  }>;
}>;

export type FlockNetworkInbox = Readonly<{
  schema_version: 1;
  project_id: "HARVEY_MOBILE_SANDBOX";
  repository: typeof HARVEY_MOBILE_REPOSITORY;
  inbox_path: typeof NETWORK_INBOX_PATH;
  current_branch: string;
  observed_at: string;
  execution_owner: "CODEX_ROOT";
  work_mode: "CLOUD_ONLY";
  transport: "NONE";
  state: NetworkInboxState;
  truth: "NO_AUTHENTICATED_SWANSON_INVITATION_OBSERVED" | "IMMUTABLE_INVITATION_EVIDENCE_PRESENT";
  topology: Readonly<{
    expected_sender_role: "SWANSON";
    expected_sender_machine: "DOSS";
    expected_sender_address: typeof EXPECTED_SENDER;
    receiver_role: "DINK";
    receiver_machine: "MEDULLINA";
    receiver_address: typeof NETWORK_RECEIVER;
  }>;
  canonical_source: Readonly<{
    repository: typeof HARVEY_CANON_REPOSITORY;
    repository_id: typeof HARVEY_CANON_REPOSITORY_ID;
    branch: "main";
    path_prefix: typeof CANON_PATH_PREFIX;
    requires_full_commit_sha: true;
  }>;
  state_ladder: readonly ["UNOBSERVED", "DISCOVERED", "RECEIVED", "ACCEPTED", "JOINED"];
  last_accepted_sequence: number;
  accepted_invitation_ids: readonly string[];
  accepted_payload_sha256: readonly string[];
  effect_flags: NetworkEffectFlags;
  invitations: readonly FlockNetworkInvitation[];
}>;

export type NetworkInvitationErrorCode =
  | "INVITATION_REQUIRED" | "INVITATION_NOT_FOUND" | "INBOX_INVALID"
  | "SPOOFED_SENDER" | "TOPOLOGY_MISMATCH" | "MUTABLE_REF"
  | "WRONG_REPOSITORY" | "PATH_TRAVERSAL" | "DIGEST_MISMATCH"
  | "INVITATION_EXPIRED" | "INVITATION_REPLAY" | "SEQUENCE_INVALID"
  | "DUPLICATE_INVITATION" | "STATE_ESCALATION";

export class NetworkInvitationError extends Error {
  readonly code: NetworkInvitationErrorCode;
  constructor(code: NetworkInvitationErrorCode, message: string) {
    super(message);
    this.name = "NetworkInvitationError";
    this.code = code;
  }
}

const FULL_SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const INVITATION_ID = /^[A-Z0-9][A-Z0-9_.:-]{7,127}$/;
const LADDER = ["UNOBSERVED", "DISCOVERED", "RECEIVED", "ACCEPTED", "JOINED"] as const;
const RANK: Readonly<Record<NetworkInvitationState, number>> = Object.freeze({
  DISCOVERED: 0, RECEIVED: 1, ACCEPTED: 2, JOINED: 3,
});
const ZERO_EFFECTS: NetworkEffectFlags = Object.freeze({
  discovered: false, received: false, accepted: false, joined: false,
  dispatched: false, executed: false, verified: false, canon_written: false,
  merged: false, deployed: false, hosted: false,
});

function fail(code: NetworkInvitationErrorCode, message: string): never {
  throw new NetworkInvitationError(code, message);
}

function timestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) fail("INBOX_INVALID", label + " is invalid.");
  return parsed;
}

function safePath(candidate: string): string {
  let decoded = candidate;
  try {
    for (let pass = 0; pass < 3; pass += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    fail("PATH_TRAVERSAL", "Invitation path has invalid encoding.");
  }
  const normalized = decoded.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (
    normalized === "" || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized) ||
    segments.includes(".") || segments.includes("..") || segments.some((part) => part === "")
  ) fail("PATH_TRAVERSAL", "Invitation path is not repository-relative.");
  return normalized;
}

function assertZeroEffects(flags: NetworkEffectFlags): void {
  for (const key of Object.keys(ZERO_EFFECTS) as (keyof NetworkEffectFlags)[]) {
    if (flags?.[key] !== false) fail("STATE_ESCALATION", "Network evidence cannot claim effects.");
  }
}

function assertProof(invitation: FlockNetworkInvitation, observedMs: number, expiresMs: number): void {
  const rank = RANK[invitation.state];
  if (rank === undefined) fail("STATE_ESCALATION", "Invitation state is unsupported.");
  const discoveredMs = timestamp(invitation.proof.discovered_at, "Discovery time");
  if (discoveredMs < observedMs || discoveredMs >= expiresMs) {
    fail("STATE_ESCALATION", "Discovery proof is outside the invitation window.");
  }

  const hasReceipt = typeof invitation.proof.received_receipt_sha256 === "string" &&
    SHA256.test(invitation.proof.received_receipt_sha256);
  const hasAcceptance = invitation.proof.accepted_by === NETWORK_RECEIVER &&
    typeof invitation.proof.accepted_at === "string" &&
    Number.isFinite(Date.parse(invitation.proof.accepted_at));
  const hasJoin = typeof invitation.proof.joined_topology_id === "string" &&
    invitation.proof.joined_topology_id.trim().length > 0 &&
    typeof invitation.proof.joined_at === "string" &&
    Number.isFinite(Date.parse(invitation.proof.joined_at));

  if ((rank >= 1) !== hasReceipt || (rank >= 2) !== hasAcceptance || (rank >= 3) !== hasJoin) {
    fail("STATE_ESCALATION", "Invitation state does not match its proof chain.");
  }
  if (rank < 1 && invitation.proof.received_receipt_sha256 !== null) {
    fail("STATE_ESCALATION", "Receipt proof is forbidden before RECEIVED.");
  }
  if (rank < 2 && (invitation.proof.accepted_by !== null || invitation.proof.accepted_at !== null)) {
    fail("STATE_ESCALATION", "Acceptance proof is forbidden before ACCEPTED.");
  }
  if (rank < 3 && (invitation.proof.joined_topology_id !== null || invitation.proof.joined_at !== null)) {
    fail("STATE_ESCALATION", "Join proof is forbidden before JOINED.");
  }
  if (rank >= 2) {
    const acceptedMs = timestamp(invitation.proof.accepted_at as string, "Acceptance time");
    if (acceptedMs < discoveredMs || acceptedMs >= expiresMs) {
      fail("STATE_ESCALATION", "Acceptance proof is outside chronological order.");
    }
    if (rank >= 3) {
      const joinedMs = timestamp(invitation.proof.joined_at as string, "Join time");
      if (joinedMs < acceptedMs || joinedMs >= expiresMs) {
        fail("STATE_ESCALATION", "Join proof is outside chronological order.");
      }
    }
  }
}

function validateInvitation(
  invitation: FlockNetworkInvitation,
  nowMs: number,
  expectedSequence: number,
  evidenceSha256: string | undefined,
): void {
  if (!INVITATION_ID.test(invitation.invitation_id)) fail("INBOX_INVALID", "Invitation ID is malformed.");
  if (invitation.sender_role !== "SWANSON" || invitation.sender_machine !== "DOSS" || invitation.sender_address !== EXPECTED_SENDER) {
    fail("SPOOFED_SENDER", "Invitation sender is not SWANSON@DOSS.");
  }
  if (invitation.receiver_role !== "DINK" || invitation.receiver_machine !== "MEDULLINA" || invitation.receiver_address !== NETWORK_RECEIVER) {
    fail("TOPOLOGY_MISMATCH", "Invitation is not addressed to DINK@MEDULLINA.");
  }
  if (invitation.source_repository !== HARVEY_CANON_REPOSITORY || invitation.source_repository_id !== HARVEY_CANON_REPOSITORY_ID) {
    fail("WRONG_REPOSITORY", "Invitation source is not canonical Werkles.");
  }
  if (invitation.source_branch !== "main" || !FULL_SHA.test(invitation.source_commit_sha)) {
    fail("MUTABLE_REF", "Invitation source is not pinned to a full commit.");
  }
  const path = safePath(invitation.source_path);
  if (!path.startsWith(CANON_PATH_PREFIX)) fail("PATH_TRAVERSAL", "Invitation path is outside Harvey/Flock.");
  const expectedUrl = "https://github.com/" + HARVEY_CANON_REPOSITORY + "/blob/" +
    invitation.source_commit_sha + "/" + path;
  if (invitation.content_url !== expectedUrl) fail("MUTABLE_REF", "Invitation URL is mutable or mismatched.");
  if (!SHA256.test(invitation.payload_sha256) || evidenceSha256 === undefined || evidenceSha256 !== invitation.payload_sha256) {
    fail("DIGEST_MISMATCH", "Matching payload evidence is required.");
  }

  const observedMs = timestamp(invitation.observed_at, "Invitation observation");
  const expiresMs = timestamp(invitation.expires_at, "Invitation expiry");
  if (observedMs >= expiresMs || nowMs >= expiresMs) fail("INVITATION_EXPIRED", "Invitation is expired.");
  if (nowMs < observedMs) fail("INBOX_INVALID", "Invitation observation is in the future.");
  if (!Number.isSafeInteger(invitation.sequence) || invitation.sequence !== expectedSequence) {
    fail("SEQUENCE_INVALID", "Invitation sequence is not monotonic.");
  }
  assertProof(invitation, observedMs, expiresMs);
}

export function validateFlockNetworkInbox(
  inbox: FlockNetworkInbox,
  now: Date,
  payloadEvidence: Readonly<Record<string, Readonly<{ sha256: string }>>> = {},
): FlockNetworkInbox {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) fail("INBOX_INVALID", "Validation time is invalid.");
  if (inbox.schema_version !== 1 || inbox.project_id !== "HARVEY_MOBILE_SANDBOX") fail("INBOX_INVALID", "Inbox schema is invalid.");
  if (inbox.repository !== HARVEY_MOBILE_REPOSITORY || inbox.inbox_path !== NETWORK_INBOX_PATH) fail("INBOX_INVALID", "Inbox repository or path is invalid.");
  safePath(inbox.inbox_path);
  if (inbox.execution_owner !== "CODEX_ROOT" || inbox.work_mode !== "CLOUD_ONLY" || inbox.transport !== "NONE") fail("INBOX_INVALID", "Inbox authority boundary is invalid.");
  if (timestamp(inbox.observed_at, "Inbox observation") > nowMs) fail("INBOX_INVALID", "Inbox observation is in the future.");
  if (inbox.topology.expected_sender_address !== EXPECTED_SENDER || inbox.topology.expected_sender_role !== "SWANSON" || inbox.topology.expected_sender_machine !== "DOSS") fail("SPOOFED_SENDER", "Inbox sender topology is invalid.");
  if (inbox.topology.receiver_address !== NETWORK_RECEIVER || inbox.topology.receiver_role !== "DINK" || inbox.topology.receiver_machine !== "MEDULLINA") fail("TOPOLOGY_MISMATCH", "Inbox receiver topology is invalid.");
  if (
    inbox.canonical_source.repository !== HARVEY_CANON_REPOSITORY ||
    inbox.canonical_source.repository_id !== HARVEY_CANON_REPOSITORY_ID ||
    inbox.canonical_source.branch !== "main" ||
    inbox.canonical_source.path_prefix !== CANON_PATH_PREFIX ||
    inbox.canonical_source.requires_full_commit_sha !== true
  ) fail("WRONG_REPOSITORY", "Inbox canonical source is invalid.");
  if (LADDER.some((state, index) => inbox.state_ladder[index] !== state)) fail("INBOX_INVALID", "Inbox proof ladder is invalid.");
  assertZeroEffects(inbox.effect_flags);
  if (!Number.isSafeInteger(inbox.last_accepted_sequence) || inbox.last_accepted_sequence < 0) fail("SEQUENCE_INVALID", "Accepted sequence is invalid.");
  if (new Set(inbox.accepted_invitation_ids).size !== inbox.accepted_invitation_ids.length) fail("INVITATION_REPLAY", "Accepted IDs contain a replay.");
  if (inbox.accepted_payload_sha256.some((digest) => !SHA256.test(digest)) || new Set(inbox.accepted_payload_sha256).size !== inbox.accepted_payload_sha256.length) fail("INVITATION_REPLAY", "Accepted digests contain a replay.");

  if (inbox.invitations.length === 0) {
    if (inbox.state !== "UNOBSERVED" || inbox.truth !== "NO_AUTHENTICATED_SWANSON_INVITATION_OBSERVED") fail("STATE_ESCALATION", "Empty inbox must remain UNOBSERVED.");
    return inbox;
  }
  if (inbox.state === "UNOBSERVED" || inbox.truth !== "IMMUTABLE_INVITATION_EVIDENCE_PRESENT") fail("STATE_ESCALATION", "Populated inbox cannot claim UNOBSERVED.");

  const ids = new Set<string>();
  const digests = new Set<string>();
  let strongest = -1;
  inbox.invitations.forEach((invitation, index) => {
    if (ids.has(invitation.invitation_id)) fail("DUPLICATE_INVITATION", "Invitation ID is duplicated.");
    if (digests.has(invitation.payload_sha256)) fail("INVITATION_REPLAY", "Invitation payload is replayed.");
    if (inbox.accepted_invitation_ids.includes(invitation.invitation_id) || inbox.accepted_payload_sha256.includes(invitation.payload_sha256)) fail("INVITATION_REPLAY", "Invitation was already accepted.");
    ids.add(invitation.invitation_id);
    digests.add(invitation.payload_sha256);
    validateInvitation(invitation, nowMs, inbox.last_accepted_sequence + index + 1, payloadEvidence[invitation.invitation_id]?.sha256);
    strongest = Math.max(strongest, RANK[invitation.state]);
  });
  if (inbox.state !== LADDER[strongest + 1]) fail("STATE_ESCALATION", "Inbox state does not match strongest proof.");
  return inbox;
}

export function resolveFlockNetworkInvitation(
  inbox: FlockNetworkInbox,
  invitationId: string,
  now: Date,
  payloadEvidence: Readonly<Record<string, Readonly<{ sha256: string }>>> = {},
) {
  validateFlockNetworkInbox(inbox, now, payloadEvidence);
  const id = invitationId.trim().toUpperCase();
  if (id === "") fail("INVITATION_REQUIRED", "INVITATION REQUIRED · Select an immutable invitation.");
  const invitation = inbox.invitations.find((item) => item.invitation_id === id);
  if (!invitation) fail("INVITATION_NOT_FOUND", "INVITATION NOT FOUND · No authenticated invitation matches.");
  const truth = {
    DISCOVERED: "DISCOVERED_NOT_RECEIVED",
    RECEIVED: "RECEIVED_NOT_ACCEPTED",
    ACCEPTED: "ACCEPTED_NOT_JOINED",
    JOINED: "JOINED_PROVEN",
  } as const;
  return Object.freeze({
    invitation_id: invitation.invitation_id,
    state: invitation.state,
    truth: truth[invitation.state],
    sender_address: EXPECTED_SENDER,
    receiver_address: NETWORK_RECEIVER,
    source_repository: HARVEY_CANON_REPOSITORY,
    source_repository_id: HARVEY_CANON_REPOSITORY_ID,
    source_commit_sha: invitation.source_commit_sha,
    source_path: invitation.source_path,
    content_url: invitation.content_url,
    payload_sha256: invitation.payload_sha256,
    sequence: invitation.sequence,
    expires_at: invitation.expires_at,
    execution_owner: "CODEX_ROOT" as const,
    transport: "NONE" as const,
    effect_flags: ZERO_EFFECTS,
  });
}
