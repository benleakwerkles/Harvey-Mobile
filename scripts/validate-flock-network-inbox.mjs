import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  validateFlockNetworkInbox,
} from "../src/data/flockNetworkInvitation.ts";

const inboxPath = new URL(
  "../docs/flock/NETWORK_INBOX.json",
  import.meta.url,
);
const inbox = JSON.parse(readFileSync(inboxPath, "utf8"));
const observedAtMs = Date.parse(inbox.observed_at);

assert.ok(
  Number.isFinite(observedAtMs),
  "NETWORK_INBOX observed_at must be an ISO-8601 timestamp",
);

const validationNow = new Date(Math.max(Date.now(), observedAtMs));
const validated = validateFlockNetworkInbox(inbox, validationNow);

assert.equal(validated, inbox);
assert.equal(inbox.schema_version, 1);
assert.equal(inbox.project_id, "HARVEY_MOBILE_SANDBOX");
assert.equal(inbox.repository, "benleakwerkles/Harvey-Mobile");
assert.equal(inbox.inbox_path, "docs/flock/NETWORK_INBOX.json");
assert.equal(
  inbox.current_branch,
  "codex/harvey-mobile-vpg-20260719",
);
assert.equal(inbox.execution_owner, "CODEX_ROOT");
assert.equal(inbox.work_mode, "CLOUD_ONLY");
assert.equal(inbox.transport, "NONE");
assert.equal(inbox.state, "UNOBSERVED");
assert.equal(
  inbox.truth,
  "NO_AUTHENTICATED_SWANSON_INVITATION_OBSERVED",
);
assert.equal(
  inbox.topology.expected_sender_address,
  "SWANSON@DOSS",
);
assert.equal(
  inbox.topology.receiver_address,
  "DINK@MEDULLINA",
);
assert.equal(
  inbox.canonical_source.repository,
  "benleakwerkles/Werkles",
);
assert.equal(inbox.canonical_source.repository_id, 1242158598);
assert.equal(inbox.canonical_source.branch, "main");
assert.equal(
  inbox.canonical_source.path_prefix,
  "Harvey/Flock/",
);
assert.equal(
  inbox.canonical_source.requires_full_commit_sha,
  true,
);
assert.deepEqual(
  inbox.state_ladder,
  ["UNOBSERVED", "DISCOVERED", "RECEIVED", "ACCEPTED", "JOINED"],
);
assert.deepEqual(inbox.accepted_invitation_ids, []);
assert.deepEqual(inbox.accepted_payload_sha256, []);
assert.deepEqual(inbox.invitations, []);
assert.ok(
  Object.values(inbox.effect_flags).every(
    (value) => value === false,
  ),
  "Network inbox evidence cannot claim application or network effects",
);

process.stdout.write(
  `${JSON.stringify(
    {
      status: "TRUTHFUL_EMPTY_NETWORK_INBOX_VERIFIED",
      repository: inbox.repository,
      inbox_path: inbox.inbox_path,
      observed_at: inbox.observed_at,
      expected_sender: inbox.topology.expected_sender_address,
      receiver: inbox.topology.receiver_address,
      canonical_source_repository:
        inbox.canonical_source.repository,
      canonical_source_repository_id:
        inbox.canonical_source.repository_id,
      state: inbox.state,
      truth: inbox.truth,
      invitation_count: inbox.invitations.length,
      execution_owner: inbox.execution_owner,
      transport: inbox.transport,
      effects: "ALL_FALSE",
    },
    null,
    2,
  )}\n`,
);
