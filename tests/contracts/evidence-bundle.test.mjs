import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getBuildIdentity } from "../../src/data/buildIdentity.ts";
import { createBuildQueueItem, getBuildQueueView } from "../../src/data/buildQueue.ts";
import { createCaptureDraftReceipt } from "../../src/data/captureDraft.ts";
import { createCaptureTriageItem, getCaptureTriageView } from "../../src/data/captureTriage.ts";
import { MAX_EVIDENCE_BUNDLE_BYTES, createEvidenceBundle, serializeEvidenceBundle } from "../../src/data/evidenceBundle.ts";
import { FLOCK_RELAY_SNAPSHOT, getFlockRelayView } from "../../src/data/flockRelaySnapshot.ts";
import { PROJECT_COCKPIT_SNAPSHOT, getProjectCockpitView } from "../../src/data/projectCockpit.ts";

const SOURCE_SHA = "595dcef7dbbe3a3c42091e665af284cfb6e0d665";
const SOURCE_PATH = "docs/flock/packets/F_DINK_EVIDENCE_BUNDLE_MODEL_20260729_C10_A.md";
const CREATED = new Date("2026-07-29T20:00:00.000Z");

function validInput() {
  const receiptResult = createCaptureDraftReceipt("Opaque session text excluded from evidence.", new Date("2026-07-29T19:40:00.000Z"));
  assert.equal(receiptResult.ok, true);
  if (!receiptResult.ok) throw new Error("Expected receipt");
  const queue = createBuildQueueItem({ id:"build-evidence-bundle", title:"Verify safe evidence bundle", area:"Cloud proof", priority:"P0", createdAt:"2026-07-29T19:30:00.000Z" });
  const triage = createCaptureTriageItem({ receipt:receiptResult.receipt, category:"BUILD", priority:"NOW" });
  return { sourcePath:SOURCE_PATH, sourceSha:SOURCE_SHA, observedAt:"2026-07-29T19:59:00.000Z", createdAt:CREATED, buildIdentity:getBuildIdentity("a".repeat(40)), cockpit:getProjectCockpitView(PROJECT_COCKPIT_SNAPSHOT, CREATED), buildQueue:getBuildQueueView([queue]), captureTriage:getCaptureTriageView([triage]), relay:getFlockRelayView(FLOCK_RELAY_SNAPSHOT, CREATED) };
}

function exact(value, keys) { assert.deepEqual(Object.keys(value).sort(), [...keys].sort()); }

test("evidence bundle is exact, frozen, metadata-only, and deterministic", () => {
  const input = validInput();
  const first = createEvidenceBundle(input);
  const second = createEvidenceBundle(validInput());
  exact(first,["schemaVersion","bundleId","repository","createdAt","truth","persistence","transport","provenance","summaries","effectFlags"]);
  exact(first.provenance,["sourcePath","sourceSha","observedAt"]);
  exact(first.summaries,["buildIdentity","cockpit","buildQueue","captureTriage","relay"]);
  exact(first.summaries.buildQueue,["truth","totalCount","openCount","activeCount","doneCount","topItemId","topItemTitle","topPriority","topStatus"]);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.summaries));
  assert.deepEqual(first.effectFlags,{persisted:false,dispatched:false,delivered:false,executed:false,verified:false,merged:false,deployed:false,hosted:false});
  const text = serializeEvidenceBundle(first);
  assert.equal(text, serializeEvidenceBundle(second));
  assert.equal(text.includes("Opaque session text"), false);
  assert.ok(Buffer.byteLength(text,"utf8") <= MAX_EVIDENCE_BUNDLE_BYTES);
});

test("unknown fields, secret-shaped values, elevated effects, and bad provenance fail closed", () => {
  const base = createEvidenceBundle(validInput());
  assert.throws(() => serializeEvidenceBundle({...structuredClone(base), raw:"forbidden"}), /schema|field|unknown|raw/i);
  const secret = structuredClone(base); secret.summaries.cockpit.topActionLabel = "token: ghp_abcdefghijklmnopqrstuvwxyz1234567890";
  assert.throws(() => serializeEvidenceBundle(secret), /secret|credential|unsafe/i);
  const elevated = structuredClone(base); elevated.effectFlags.deployed = true;
  assert.throws(() => serializeEvidenceBundle(elevated), /effect|claim|boundary/i);
  assert.throws(() => createEvidenceBundle({...validInput(),sourceSha:"main"}), /sha/i);
  assert.throws(() => createEvidenceBundle({...validInput(),sourcePath:"../evidence.json"}), /path/i);
  assert.throws(() => createEvidenceBundle({...validInput(),observedAt:"2026-07-29T20:00:00.001Z"}), /time|future/i);
});

test("safe evidence UI is accessible, portable, and effect-free", async () => {
  const source = await readFile(new URL("../../src/components/SafeEvidenceBundleCard.tsx", import.meta.url),"utf8");
  assert.match(source,/accessibilityRole=["']header["']/);
  assert.match(source,/\bPROVEN\b/); assert.match(source,/\bUNPROVEN\b/); assert.match(source,/\bselectable\b/);
  assert.match(source,/accessibilityRole=["']button["']/);
  assert.ok(source.includes("Prepare safe copy"));
  assert.ok(source.includes("Builds a redacted selectable preview in this session. Does not save or send."));
  assert.ok(source.includes("Safe redacted text ready. Long press the selectable text to copy. Nothing was saved or sent."));
  assert.match(source,/accessibilityLiveRegion=["']polite["']/); assert.match(source,/accessibilityLiveRegion=["']assertive["']/); assert.match(source,/accessibilityRole=["']alert["']/);
  assert.ok(source.includes("Clear preview")); assert.match(source,/width:\s*["']100%["']/); assert.match(source,/minWidth:\s*0/); assert.match(source,/minHeight:\s*48/);
  assert.doesNotMatch(source,/\b(Clipboard|expo-clipboard|Share|Linking|fetch|axios|XMLHttpRequest|WebSocket|FileSystem|AsyncStorage|SecureStore)\b/);
});
