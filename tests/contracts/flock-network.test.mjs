import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  NetworkInvitationError,
  resolveFlockNetworkInvitation,
  validateFlockNetworkInbox,
} from "../../src/data/flockNetworkInvitation.ts";

const inboxFixture = JSON.parse(
  readFileSync(
    new URL("../../docs/flock/NETWORK_INBOX.json", import.meta.url),
    "utf8",
  ),
);

const NOW = new Date("2026-07-29T17:00:00.000Z");
const SOURCE_SHA = "a".repeat(40);
const PAYLOAD_SHA = "b".repeat(64);
const RECEIPT_SHA = "c".repeat(64);
const INVITATION_ID = "SWANSON-DOSS-HARVEY-0001";
const SOURCE_PATH =
  "Harvey/Flock/invitations/SWANSON-DOSS-HARVEY-0001.json";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function invitationFor(state = "DISCOVERED", overrides = {}) {
  const proof = {
    discovered_at: "2026-07-29T16:01:00.000Z",
    received_receipt_sha256: state === "DISCOVERED" ? null : RECEIPT_SHA,
    accepted_by:
      state === "ACCEPTED" || state === "JOINED"
        ? "DINK@MEDULLINA"
        : null,
    accepted_at:
      state === "ACCEPTED" || state === "JOINED"
        ? "2026-07-29T16:02:00.000Z"
        : null,
    joined_topology_id:
      state === "JOINED" ? "BRAEYENSTATION-HARVEY-01" : null,
    joined_at:
      state === "JOINED" ? "2026-07-29T16:03:00.000Z" : null,
  };

  return {
    invitation_id: INVITATION_ID,
    sender_role: "SWANSON",
    sender_machine: "DOSS",
    sender_address: "SWANSON@DOSS",
    receiver_role: "DINK",
    receiver_machine: "MEDULLINA",
    receiver_address: "DINK@MEDULLINA",
    source_repository: "benleakwerkles/Werkles",
    source_repository_id: 1242158598,
    source_branch: "main",
    source_commit_sha: SOURCE_SHA,
    source_path: SOURCE_PATH,
    content_url:
      \`https://github.com/benleakwerkles/Werkles/blob/\${SOURCE_SHA}/\${SOURCE_PATH}\`,
    payload_sha256: PAYLOAD_SHA,
    observed_at: "2026-07-29T16:00:00.000Z",
    expires_at: "2026-07-30T16:00:00.000Z",
    sequence: 1,
    state,
    proof,
    ...overrides,
  };
}

function inboxFor(invitation, overrides = {}) {
  return {
    ...clone(inboxFixture),
    state: invitation.state,
    truth: "IMMUTABLE_INVITATION_EVIDENCE_PRESENT",
    invitations: [invitation],
    ...overrides,
  };
}

function evidenceFor(inbox) {
  return Object.fromEntries(
    inbox.invitations.map((invitation) => [
      invitation.invitation_id,
      { sha256: invitation.payload_sha256 },
    ]),
  );
}

function expectCode(code, operation) {
  assert.throws(operation, (error) => {
    assert.ok(error instanceof NetworkInvitationError);
    assert.equal(error.code, code);
    return true;
  });
}

test("the checked-in empty inbox is truthful, inert, and valid", () => {
  const inbox = clone(inboxFixture);

  assert.equal(validateFlockNetworkInbox(inbox, NOW), inbox);
  assert.equal(inbox.state, "UNOBSERVED");
  assert.equal(
    inbox.truth,
    "NO_AUTHENTICATED_SWANSON_INVITATION_OBSERVED",
  );
  assert.equal(inbox.transport, "NONE");
  assert.equal(inbox.execution_owner, "CODEX_ROOT");
  assert.deepEqual(inbox.invitations, []);
  assert.ok(
    Object.values(inbox.effect_flags).every((value) => value === false),
  );
});

test("resolver exposes stable required and not-found errors", () => {
  expectCode("INVITATION_REQUIRED", () =>
    resolveFlockNetworkInvitation(clone(inboxFixture), "   ", NOW),
  );

  expectCode("INVITATION_NOT_FOUND", () =>
    resolveFlockNetworkInvitation(
      clone(inboxFixture),
      "UNKNOWN-INVITATION",
      NOW,
    ),
  );
});

test("all four evidenced states resolve independently with frozen zero effects", () => {
  const expectedTruth = {
    DISCOVERED: "DISCOVERED_NOT_RECEIVED",
    RECEIVED: "RECEIVED_NOT_ACCEPTED",
    ACCEPTED: "ACCEPTED_NOT_JOINED",
    JOINED: "JOINED_PROVEN",
  };

  for (const state of Object.keys(expectedTruth)) {
    const invitation = invitationFor(state);
    const inbox = inboxFor(invitation);
    const evidence = evidenceFor(inbox);

    assert.equal(validateFlockNetworkInbox(inbox, NOW, evidence), inbox);

    const resolution = resolveFlockNetworkInvitation(
      inbox,
      INVITATION_ID.toLowerCase(),
      NOW,
      evidence,
    );

    assert.ok(Object.isFrozen(resolution));
    assert.ok(Object.isFrozen(resolution.effect_flags));
    assert.equal(resolution.state, state);
    assert.equal(resolution.truth, expectedTruth[state]);
    assert.equal(resolution.transport, "NONE");
    assert.equal(resolution.execution_owner, "CODEX_ROOT");
    assert.equal(
      resolution.source_repository,
      "benleakwerkles/Werkles",
    );
    assert.equal(resolution.source_repository_id, 1242158598);
    assert.ok(
      Object.values(resolution.effect_flags).every(
        (value) => value === false,
      ),
    );
    assert.equal(resolution.effect_flags.canon_written, false);
    assert.equal(resolution.effect_flags.deployed, false);
    assert.equal(resolution.effect_flags.hosted, false);
  }
});

test("missing or mismatched immutable payload evidence fails closed", () => {
  const inbox = inboxFor(invitationFor());

  expectCode("DIGEST_MISMATCH", () =>
    validateFlockNetworkInbox(inbox, NOW),
  );

  expectCode("DIGEST_MISMATCH", () =>
    validateFlockNetworkInbox(inbox, NOW, {
      [INVITATION_ID]: { sha256: "d".repeat(64) },
    }),
  );

  const malformed = clone(inbox);
  malformed.invitations[0].payload_sha256 = "short";

  expectCode("DIGEST_MISMATCH", () =>
    validateFlockNetworkInbox(malformed, NOW, evidenceFor(malformed)),
  );
});

test("spoofed sender and receiver topology collisions are rejected", () => {
  const spoofed = inboxFor(invitationFor());
  spoofed.invitations[0].sender_address = "DINK@DOSS";

  expectCode("SPOOFED_SENDER", () =>
    validateFlockNetworkInbox(spoofed, NOW, evidenceFor(spoofed)),
  );

  const wrongMachine = inboxFor(invitationFor());
  wrongMachine.invitations[0].receiver_machine = "DOSS";

  expectCode("TOPOLOGY_MISMATCH", () =>
    validateFlockNetworkInbox(
      wrongMachine,
      NOW,
      evidenceFor(wrongMachine),
    ),
  );
});

test("wrong canonical repository name and numeric identity are rejected", () => {
  const wrongName = inboxFor(invitationFor());
  wrongName.invitations[0].source_repository =
    "benleakwerkles/Harvey-Mobile";

  expectCode("WRONG_REPOSITORY", () =>
    validateFlockNetworkInbox(wrongName, NOW, evidenceFor(wrongName)),
  );

  const wrongId = inboxFor(invitationFor());
  wrongId.invitations[0].source_repository_id = 1;

  expectCode("WRONG_REPOSITORY", () =>
    validateFlockNetworkInbox(wrongId, NOW, evidenceFor(wrongId)),
  );
});

test("short commits, mutable source branches, and mismatched URLs are rejected", () => {
  const shortSha = inboxFor(invitationFor());
  shortSha.invitations[0].source_commit_sha = "abc1234";

  expectCode("MUTABLE_REF", () =>
    validateFlockNetworkInbox(shortSha, NOW, evidenceFor(shortSha)),
  );

  const wrongBranch = inboxFor(invitationFor());
  wrongBranch.invitations[0].source_branch = "feature";

  expectCode("MUTABLE_REF", () =>
    validateFlockNetworkInbox(
      wrongBranch,
      NOW,
      evidenceFor(wrongBranch),
    ),
  );

  const branchUrl = inboxFor(invitationFor());
  branchUrl.invitations[0].content_url =
    \`https://github.com/benleakwerkles/Werkles/blob/main/\${SOURCE_PATH}\`;

  expectCode("MUTABLE_REF", () =>
    validateFlockNetworkInbox(branchUrl, NOW, evidenceFor(branchUrl)),
  );

  const mismatchedUrl = inboxFor(invitationFor());
  mismatchedUrl.invitations[0].content_url =
    \`https://github.com/benleakwerkles/Werkles/blob/\${"d".repeat(40)}/\${SOURCE_PATH}\`;

  expectCode("MUTABLE_REF", () =>
    validateFlockNetworkInbox(
      mismatchedUrl,
      NOW,
      evidenceFor(mismatchedUrl),
    ),
  );
});

test("encoded traversal and paths outside Harvey/Flock are rejected", () => {
  const encodedTraversal = inboxFor(invitationFor());
  encodedTraversal.invitations[0].source_path =
    "Harvey/Flock/%252e%252e/secrets.json";

  expectCode("PATH_TRAVERSAL", () =>
    validateFlockNetworkInbox(
      encodedTraversal,
      NOW,
      evidenceFor(encodedTraversal),
    ),
  );

  const outsidePrefix = inboxFor(invitationFor());
  outsidePrefix.invitations[0].source_path =
    "Harvey/Mobile/invitation.json";

  expectCode("PATH_TRAVERSAL", () =>
    validateFlockNetworkInbox(
      outsidePrefix,
      NOW,
      evidenceFor(outsidePrefix),
    ),
  );
});

test("expiry and future observation cannot be bypassed", () => {
  const expired = inboxFor(invitationFor());

  expectCode("INVITATION_EXPIRED", () =>
    validateFlockNetworkInbox(
      expired,
      new Date("2026-07-30T16:00:00.000Z"),
      evidenceFor(expired),
    ),
  );

  const futureObservation = inboxFor(invitationFor());
  futureObservation.invitations[0].observed_at =
    "2026-07-29T18:00:00.000Z";
  futureObservation.invitations[0].proof.discovered_at =
    "2026-07-29T18:01:00.000Z";

  expectCode("INBOX_INVALID", () =>
    validateFlockNetworkInbox(
      futureObservation,
      NOW,
      evidenceFor(futureObservation),
    ),
  );
});

test("duplicate IDs, payload replay, and accepted-history replay are distinct failures", () => {
  const duplicateId = inboxFor(invitationFor());
  duplicateId.invitations.push({
    ...clone(duplicateId.invitations[0]),
    payload_sha256: "d".repeat(64),
    sequence: 2,
  });

  expectCode("DUPLICATE_INVITATION", () =>
    validateFlockNetworkInbox(duplicateId, NOW, {
      [INVITATION_ID]: { sha256: PAYLOAD_SHA },
    }),
  );

  const payloadReplay = inboxFor(invitationFor());
  payloadReplay.invitations.push({
    ...clone(payloadReplay.invitations[0]),
    invitation_id: "SWANSON-DOSS-HARVEY-0002",
    sequence: 2,
  });

  expectCode("INVITATION_REPLAY", () =>
    validateFlockNetworkInbox(
      payloadReplay,
      NOW,
      evidenceFor(payloadReplay),
    ),
  );

  const acceptedIdReplay = inboxFor(invitationFor(), {
    accepted_invitation_ids: [INVITATION_ID],
  });

  expectCode("INVITATION_REPLAY", () =>
    validateFlockNetworkInbox(
      acceptedIdReplay,
      NOW,
      evidenceFor(acceptedIdReplay),
    ),
  );
});

test("sequence rollback and gaps fail the monotonic contract", () => {
  const rollback = inboxFor(invitationFor(), {
    last_accepted_sequence: 1,
  });

  expectCode("SEQUENCE_INVALID", () =>
    validateFlockNetworkInbox(rollback, NOW, evidenceFor(rollback)),
  );

  const gap = inboxFor(
    invitationFor("DISCOVERED", { sequence: 2 }),
  );

  expectCode("SEQUENCE_INVALID", () =>
    validateFlockNetworkInbox(gap, NOW, evidenceFor(gap)),
  );
});

test("proof chronology rejects discovery, acceptance, and join reversal", () => {
  const discoveryBeforeObservation = inboxFor(invitationFor());
  discoveryBeforeObservation.invitations[0].proof.discovered_at =
    "2026-07-29T15:59:00.000Z";

  expectCode("STATE_ESCALATION", () =>
    validateFlockNetworkInbox(
      discoveryBeforeObservation,
      NOW,
      evidenceFor(discoveryBeforeObservation),
    ),
  );

  const acceptanceBeforeDiscovery = inboxFor(
    invitationFor("ACCEPTED"),
  );
  acceptanceBeforeDiscovery.invitations[0].proof.accepted_at =
    "2026-07-29T16:00:30.000Z";

  expectCode("STATE_ESCALATION", () =>
    validateFlockNetworkInbox(
      acceptanceBeforeDiscovery,
      NOW,
      evidenceFor(acceptanceBeforeDiscovery),
    ),
  );

  const joinBeforeAcceptance = inboxFor(invitationFor("JOINED"));
  joinBeforeAcceptance.invitations[0].proof.joined_at =
    "2026-07-29T16:01:30.000Z";

  expectCode("STATE_ESCALATION", () =>
    validateFlockNetworkInbox(
      joinBeforeAcceptance,
      NOW,
      evidenceFor(joinBeforeAcceptance),
    ),
  );
});

test("skipped, mismatched, and reversed state transitions fail closed", () => {
  const skippedReceipt = inboxFor(invitationFor("ACCEPTED"));
  skippedReceipt.invitations[0].proof.received_receipt_sha256 = null;

  expectCode("STATE_ESCALATION", () =>
    validateFlockNetworkInbox(
      skippedReceipt,
      NOW,
      evidenceFor(skippedReceipt),
    ),
  );

  const forgedJoin = inboxFor(invitationFor("JOINED"));
  forgedJoin.invitations[0].proof.accepted_by = "SWANSON@DOSS";

  expectCode("STATE_ESCALATION", () =>
    validateFlockNetworkInbox(
      forgedJoin,
      NOW,
      evidenceFor(forgedJoin),
    ),
  );

  const overstatedInbox = inboxFor(
    invitationFor("DISCOVERED"),
    { state: "JOINED" },
  );

  expectCode("STATE_ESCALATION", () =>
    validateFlockNetworkInbox(
      overstatedInbox,
      NOW,
      evidenceFor(overstatedInbox),
    ),
  );
});

test("network evidence cannot claim transport, JOINED effects, canon, merge, or deployment", () => {
  const transportClaim = clone(inboxFixture);
  transportClaim.transport = "REMOTE_CONTROL";

  expectCode("INBOX_INVALID", () =>
    validateFlockNetworkInbox(transportClaim, NOW),
  );

  for (const effect of [
    "joined",
    "dispatched",
    "executed",
    "verified",
    "canon_written",
    "merged",
    "deployed",
    "hosted",
  ]) {
    const claimed = clone(inboxFixture);
    claimed.effect_flags[effect] = true;

    expectCode("STATE_ESCALATION", () =>
      validateFlockNetworkInbox(claimed, NOW),
    );
  }
});

test("remaining stable inbox error families retain deterministic codes", () => {
  const malformed = clone(inboxFixture);
  malformed.schema_version = 2;

  expectCode("INBOX_INVALID", () =>
    validateFlockNetworkInbox(malformed, NOW),
  );

  const spoofedTopology = clone(inboxFixture);
  spoofedTopology.topology.expected_sender_address =
    "SWANSON@MEDULLINA";

  expectCode("SPOOFED_SENDER", () =>
    validateFlockNetworkInbox(spoofedTopology, NOW),
  );

  const wrongReceiver = clone(inboxFixture);
  wrongReceiver.topology.receiver_address = "DINK@DOSS";

  expectCode("TOPOLOGY_MISMATCH", () =>
    validateFlockNetworkInbox(wrongReceiver, NOW),
  );

  const wrongCanon = clone(inboxFixture);
  wrongCanon.canonical_source.repository_id = 0;

  expectCode("WRONG_REPOSITORY", () =>
    validateFlockNetworkInbox(wrongCanon, NOW),
  );

  const replayedAcceptedDigest = clone(inboxFixture);
  replayedAcceptedDigest.accepted_payload_sha256 = [
    PAYLOAD_SHA,
    PAYLOAD_SHA,
  ];

  expectCode("INVITATION_REPLAY", () =>
    validateFlockNetworkInbox(replayedAcceptedDigest, NOW),
  );

  const invalidSequence = clone(inboxFixture);
  invalidSequence.last_accepted_sequence = -1;

  expectCode("SEQUENCE_INVALID", () =>
    validateFlockNetworkInbox(invalidSequence, NOW),
  );

  const falseEmptyState = clone(inboxFixture);
  falseEmptyState.state = "DISCOVERED";

  expectCode("STATE_ESCALATION", () =>
    validateFlockNetworkInbox(falseEmptyState, NOW),
  );
});
