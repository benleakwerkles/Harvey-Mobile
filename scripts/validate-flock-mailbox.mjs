import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { validateFlockMailbox } from "../src/data/flockMailboxDiscovery.ts";

export async function verifyFlockMailbox({
  mailboxUrl = new URL("../docs/flock/MAILBOX.json", import.meta.url),
  readCommittedPacket = (sha, packetPath) =>
    execFileSync("git", ["show", sha + ":" + packetPath], { encoding: "utf8" }),
} = {}) {
  const mailbox = JSON.parse(await readFile(mailboxUrl, "utf8"));
  const evidence = {};

  for (const entry of mailbox.entries) {
    const text = readCommittedPacket(entry.packet_commit_sha, entry.packet_path);
    evidence[entry.packet_path] = {
      text,
      sha256: createHash("sha256").update(text, "utf8").digest("hex"),
    };
  }

  validateFlockMailbox(mailbox, evidence);
  return Object.freeze({
    ok: true,
    state: "IMMUTABLE_PACKETS_VERIFIED",
    packetCheckpointSha: mailbox.packet_checkpoint_sha,
    packetCount: mailbox.entries.length,
    transport: "NONE",
    executionOwner: "CODEX_ROOT",
    externalEnderState: "BLOCKED_UNBOUND",
    effects: Object.freeze({
      dispatched: false,
      requested: false,
      executed: false,
      verified: false,
      canonWritten: false,
      merged: false,
      deployed: false,
      hosted: false,
    }),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await verifyFlockMailbox();
  process.stdout.write(JSON.stringify(result) + "\n");
}
