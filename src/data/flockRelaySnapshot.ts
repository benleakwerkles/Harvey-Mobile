export type RelayPacketState =
  | "READY_FOR_PULL"
  | "READY_FOR_PULL_INTERNAL_ROLE_AGENT"
  | "RECEIPTED"
  | "RECEIPTED_INTERNAL_ROLE_AGENT";

export type RelayPacket = Readonly<{
  packetId: string;
  address: string;
  state: RelayPacketState;
  internalRoleAgent: boolean;
}>;

export type FlockMailboxSnapshot = Readonly<{
  sourcePath: "docs/flock/MAILBOX.json";
  packetCheckpointSha: string;
  observedAt: string;
  availability: "PENDING_PR_MERGE" | "DEFAULT_BRANCH";
  entryCount: number;
  discoveryState: "FOUND";
  truth: "FOUND_DOES_NOT_IMPLY_PULLED_OR_RECEIPTED";
}>;

export type FlockRelaySnapshot = Readonly<{
  schemaVersion: 1;
  projectId: "HARVEY_MOBILE_SANDBOX";
  sourcePath: string;
  sourceSha: string;
  mailbox: FlockMailboxSnapshot;
  observedAt: string;
  branch: string;
  executionOwner: "CODEX_ROOT";
  workMode: "CLOUD_ONLY";
  packets: readonly RelayPacket[];
  proofBoundary: string;
  externalEnderState: "BLOCKED_UNBOUND";
}>;

export type FlockRelayView = FlockRelaySnapshot &
  Readonly<{
    ageDays: number;
    readyCount: number;
    receiptedCount: number;
    mailboxAgeDays: number;
  }>;

const fullShaPattern = /^[a-f0-9]{40}$/i;
const packetStates = new Set<RelayPacketState>([
  "READY_FOR_PULL",
  "READY_FOR_PULL_INTERNAL_ROLE_AGENT",
  "RECEIPTED",
  "RECEIPTED_INTERNAL_ROLE_AGENT",
]);

function assertRepoRelativePath(candidate: string): void {
  const normalized = candidate.replaceAll("\\", "/");
  if (
    normalized.trim() === "" ||
    normalized.startsWith("/") ||
    /^[a-z]:/i.test(normalized) ||
    normalized.split("/").includes("..")
  ) {
    throw new Error("Relay source path must be repository-relative.");
  }
}

export function getFlockRelayView(snapshot: FlockRelaySnapshot, now: Date): FlockRelayView {
  assertRepoRelativePath(snapshot.sourcePath);
  assertRepoRelativePath(snapshot.mailbox.sourcePath);
  if (!fullShaPattern.test(snapshot.sourceSha)) {
    throw new Error("Relay source SHA must contain exactly 40 hexadecimal characters.");
  }
  if (!fullShaPattern.test(snapshot.mailbox.packetCheckpointSha)) {
    throw new Error("Mailbox packet checkpoint must contain exactly 40 hexadecimal characters.");
  }
  if (!["PENDING_PR_MERGE", "DEFAULT_BRANCH"].includes(snapshot.mailbox.availability)) {
    throw new Error("Mailbox availability is unsupported.");
  }
  if (snapshot.mailbox.entryCount < 1 || snapshot.mailbox.discoveryState !== "FOUND" || snapshot.mailbox.truth !== "FOUND_DOES_NOT_IMPLY_PULLED_OR_RECEIPTED") {
    throw new Error("Mailbox discovery truth is invalid.");
  }
  if (snapshot.executionOwner !== "CODEX_ROOT" || snapshot.workMode !== "CLOUD_ONLY") {
    throw new Error("Relay ownership or work mode is outside the sandbox boundary.");
  }
  if (snapshot.externalEnderState !== "BLOCKED_UNBOUND") {
    throw new Error("External Ender cannot be represented as delivered without receiver proof.");
  }
  if (snapshot.proofBoundary.trim().length < 24) {
    throw new Error("Relay proof boundary is missing.");
  }

  const observedMilliseconds = Date.parse(snapshot.observedAt);
  const mailboxObservedMilliseconds = Date.parse(snapshot.mailbox.observedAt);
  const nowMilliseconds = now.getTime();
  if (!Number.isFinite(observedMilliseconds) || !Number.isFinite(mailboxObservedMilliseconds) || !Number.isFinite(nowMilliseconds)) {
    throw new Error("Relay snapshot time is invalid.");
  }
  if (observedMilliseconds > nowMilliseconds || mailboxObservedMilliseconds > nowMilliseconds) {
    throw new Error("Relay or mailbox snapshot observation cannot be in the future.");
  }

  const packetIds = new Set<string>();
  for (const packet of snapshot.packets) {
    if (packetIds.has(packet.packetId)) throw new Error("Relay packet IDs must be unique.");
    packetIds.add(packet.packetId);
    if (!packetStates.has(packet.state)) throw new Error("Relay packet state is unsupported.");
    if (
      packet.state === "RECEIPTED_INTERNAL_ROLE_AGENT" &&
      !packet.internalRoleAgent
    ) {
      throw new Error("Internal role-agent receipt must remain explicitly internal.");
    }
  }

  return Object.freeze({
    ...snapshot,
    ageDays: Math.floor((nowMilliseconds - observedMilliseconds) / 86_400_000),
    readyCount: snapshot.packets.filter((packet) => packet.state.startsWith("READY")).length,
    receiptedCount: snapshot.packets.filter((packet) => packet.state.startsWith("RECEIPTED")).length,
    mailboxAgeDays: Math.floor((nowMilliseconds - mailboxObservedMilliseconds) / 86_400_000),
  });
}

export const FLOCK_RELAY_SNAPSHOT: FlockRelaySnapshot = Object.freeze({
  schemaVersion: 1,
  projectId: "HARVEY_MOBILE_SANDBOX",
  sourcePath: "docs/flock/STATE.json",
  sourceSha: "5254a4d9cb1ed942ac6b094fb24a138e1c459c1d",
  mailbox: Object.freeze({
    sourcePath: "docs/flock/MAILBOX.json",
    packetCheckpointSha: "8260b18d0358bcd99ec08749e06695e798e172f5",
    observedAt: "2026-07-21T16:00:00.000Z",
    availability: "PENDING_PR_MERGE",
    entryCount: 3,
    discoveryState: "FOUND",
    truth: "FOUND_DOES_NOT_IMPLY_PULLED_OR_RECEIPTED",
  }),
  observedAt: "2026-07-19T17:12:00.000Z",
  branch: "codex/harvey-mobile-vpg-20260719",
  executionOwner: "CODEX_ROOT",
  workMode: "CLOUD_ONLY",
  packets: Object.freeze([
    Object.freeze({
      packetId: "F_DINK_HARVEY_MOBILE_OPERATION_INTENT_20260719_C4",
      address: "DINK@MEDULLINA",
      state: "RECEIPTED",
      internalRoleAgent: true,
    }),
    Object.freeze({
      packetId: "F_CURSOR_ENDER_HARVEY_MOBILE_OPERATIONS_UX_20260719_C4",
      address: "CURSOR_ENDER_DOOZER@MEDULLINA",
      state: "RECEIPTED_INTERNAL_ROLE_AGENT",
      internalRoleAgent: true,
    }),
    Object.freeze({
      packetId: "F_BEAN_THUFIR_HARVEY_MOBILE_OPERATION_SAFETY_20260719_C4",
      address: "BEAN_THUFIR@MEDULLINA",
      state: "RECEIPTED",
      internalRoleAgent: true,
    }),
  ]),
  proofBoundary:
    "Cycle-four internal role-agent pulls are receipted at the V checkpoint. This proves packet reads, not external Ender delivery, live relay transport, canon, merge, hosting, or deployment.",
  externalEnderState: "BLOCKED_UNBOUND",
});
