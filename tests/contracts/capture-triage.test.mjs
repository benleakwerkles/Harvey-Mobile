import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createCaptureDraftReceipt } from "../../src/data/captureDraft.ts";
import { CAPTURE_CATEGORIES, CAPTURE_PRIORITIES, CAPTURE_STATUSES, advanceCaptureTriageStatus, createCaptureTriageItem, getCaptureTriageView } from "../../src/data/captureTriage.ts";

function receiptFor(rawText, isoTime) {
  const result = createCaptureDraftReceipt(rawText, new Date(isoTime));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("Expected a safe capture receipt.");
  return result.receipt;
}
function itemFor(rawText, isoTime, category = "GENERAL", priority = "NEXT") {
  return createCaptureTriageItem({ receipt: receiptFor(rawText, isoTime), category, priority });
}
function assertAllEffectsFalse(flags) {
  assert.equal(Object.isFrozen(flags), true);
  assert.equal(Object.values(flags).every((value) => value === false), true);
}

test("triage metadata cannot contain raw notes or credential-shaped material", () => {
  const rawMarker = "Opaque capture marker 7c987e must never enter triage metadata.";
  const receipt = receiptFor(rawMarker, "2026-07-29T18:00:00.000Z");
  const item = createCaptureTriageItem({ receipt, category: "BUILD", priority: "NOW" });
  assert.equal(Object.isFrozen(item), true);
  assertAllEffectsFalse(item.effectFlags);
  assert.deepEqual(Object.keys(item).sort(), ["captureRequestId", "category", "characterCount", "createdAt", "effectFlags", "id", "lineCount", "persistence", "priority", "status", "summary", "transport", "truth"].sort());
  assert.equal(JSON.stringify(item).includes(rawMarker), false);
  assert.equal(item.persistence, "SESSION_ONLY");
  assert.equal(item.transport, "NONE");
  for (const forbidden of ["body", "text", "note", "raw", "payload", "preview", "content", "secret", "token"]) {
    assert.equal(Object.hasOwn(item, forbidden), false);
    assert.throws(() => createCaptureTriageItem({ receipt: { ...receipt, [forbidden]: rawMarker }, category: "BUILD", priority: "NOW" }), /exact metadata-only/i);
  }
  for (const candidate of ["token: ghp_abcdefghijklmnopqrstuvwxyz1234567890", "api_key = sk-abcdefghijklmnopqrstuvwxyz123456", "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload", "https://alice:p%40ss@example.com/private", "-----BEGIN OPENSSH PRIVATE KEY-----"]) {
    assert.equal(createCaptureDraftReceipt(candidate, new Date("2026-07-29T18:00:00.000Z")).ok, false);
  }
});

test("triage lifecycle remains frozen, session-only, and effect-free", () => {
  assert.deepEqual(CAPTURE_CATEGORIES, ["BUILD", "BUG", "IDEA", "FOLLOW_UP", "GENERAL"]);
  assert.deepEqual(CAPTURE_PRIORITIES, ["NOW", "NEXT", "LATER"]);
  assert.deepEqual(CAPTURE_STATUSES, ["INBOX", "REVIEWED", "DONE_LOCAL"]);
  [CAPTURE_CATEGORIES, CAPTURE_PRIORITIES, CAPTURE_STATUSES].forEach((value) => assert.equal(Object.isFrozen(value), true));
  const inbox = itemFor("Review the local capture classifier.", "2026-07-29T18:01:00.000Z", "IDEA", "NEXT");
  const reviewed = advanceCaptureTriageStatus(inbox);
  const done = advanceCaptureTriageStatus(reviewed);
  assert.equal(inbox.status, "INBOX");
  assert.equal(reviewed.status, "REVIEWED");
  assert.equal(done.status, "DONE_LOCAL");
  assert.equal(advanceCaptureTriageStatus(done), done);
  for (const item of [inbox, reviewed, done]) { assert.equal(Object.isFrozen(item), true); assert.equal(item.persistence, "SESSION_ONLY"); assert.equal(item.transport, "NONE"); assertAllEffectsFalse(item.effectFlags); }
  for (const invalid of [{ ...inbox, persistence: "DURABLE" }, { ...inbox, transport: "NETWORK" }, { ...inbox, raw: "do not persist" }, { ...inbox, effectFlags: { ...inbox.effectFlags, deployed: true } }]) {
    assert.throws(() => getCaptureTriageView([invalid]), /field|boundary|effect/i);
  }
});

test("ordering, filtering, counts, and duplicate rejection are deterministic", () => {
  const olderNow = itemFor("Older now inbox.", "2026-07-29T18:00:00.000Z", "BUILD", "NOW");
  const newerNow = itemFor("Newer now inbox.", "2026-07-29T18:05:00.000Z", "BUG", "NOW");
  const reviewed = advanceCaptureTriageStatus(itemFor("Reviewed now.", "2026-07-29T18:06:00.000Z", "IDEA", "NOW"));
  const done = advanceCaptureTriageStatus(advanceCaptureTriageStatus(itemFor("Done now.", "2026-07-29T18:07:00.000Z", "FOLLOW_UP", "NOW")));
  const next = itemFor("Next inbox.", "2026-07-29T18:08:00.000Z", "GENERAL", "NEXT");
  const later = itemFor("Later inbox.", "2026-07-29T18:09:00.000Z", "GENERAL", "LATER");
  const input = [next, done, olderNow, later, reviewed, newerNow];
  const expected = [newerNow.id, olderNow.id, reviewed.id, done.id, next.id, later.id];
  const view = getCaptureTriageView(input);
  assert.deepEqual(view.items.map((item) => item.id), expected);
  assert.deepEqual(getCaptureTriageView([...input].reverse()).items.map((item) => item.id), expected);
  assert.deepEqual(view.counts, { INBOX: 4, REVIEWED: 1, DONE_LOCAL: 1 });
  assert.equal(view.truth, "SESSION_TRIAGE_METADATA_ONLY");
  assert.equal(view.persistence, "SESSION_ONLY");
  assert.equal(view.transport, "NONE");
  assert.equal(Object.isFrozen(view.items), true);
  const filtered = getCaptureTriageView(input, { category: "BUG", priority: "NOW", status: "INBOX" });
  assert.deepEqual(filtered.items.map((item) => item.id), [newerNow.id]);
  assert.throws(() => getCaptureTriageView([...input, input[0]]), /unique/i);
  assert.throws(() => getCaptureTriageView(input, { category: "SECRET", priority: "ALL", status: "ALL" }), /filter|category/i);
});

test("triage controls expose non-color status and 320px accessibility hooks", async () => {
  const source = await readFile(new URL("../../src/components/CaptureTriageBar.tsx", import.meta.url), "utf8");
  for (const label of ["Show all session captures", "Show untriaged session captures", "Show triaged session captures", "No captures match this session-only filter."]) assert.equal(source.includes(label), true);
  assert.match(source, /accessibilityRole=["']button["']/);
  assert.match(source, /accessibilityState=/);
  assert.match(source, /accessibilityLiveRegion=["']polite["']/);
  assert.equal(source.includes("Session-only capture triage. Raw note text is not included in receipts or durable evidence."), true);
  assert.match(source, /minHeight:\s*48/);
  assert.match(source, /flexWrap:\s*["']wrap["']/);
  assert.match(source, /flexBasis:\s*88/);
  assert.match(source, /flexGrow:\s*1/);
  assert.doesNotMatch(source, /\b(fetch|axios|AsyncStorage|SecureStore)\b/);
});
