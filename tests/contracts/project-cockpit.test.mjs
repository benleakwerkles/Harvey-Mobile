import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { PROJECT_COCKPIT_SNAPSHOT, getProjectCockpitView } from "../../src/data/projectCockpit.ts";

const observedAtMs = Date.parse(PROJECT_COCKPIT_SNAPSHOT.observedAt);
const freshNow = new Date(observedAtMs + 1_000);

function zeroEffects(action) {
  assert.equal(Object.isFrozen(action), true);
  assert.equal(Object.isFrozen(action.effectFlags), true);
  assert.deepEqual(Object.values(action.effectFlags), [false, false, false, false, false, false, false, false, false]);
  assert.equal(action.stage, "PLANNED_LOCAL");
  assert.equal(action.transport, "NONE");
  assert.equal(action.executionOwner, "CODEX_ROOT");
}

test("cockpit provenance stays immutable, stale-aware, and explicitly not live", () => {
  const current = getProjectCockpitView(PROJECT_COCKPIT_SNAPSHOT, freshNow);
  const repeated = getProjectCockpitView(PROJECT_COCKPIT_SNAPSHOT, freshNow);
  const stale = getProjectCockpitView(PROJECT_COCKPIT_SNAPSHOT, new Date(observedAtMs + (31 * 86_400_000)));

  assert.deepEqual(repeated, current);
  assert.equal(Object.isFrozen(current), true);
  assert.equal(current.truth, "CHECKED_IN_EVIDENCE_NOT_LIVE");
  assert.equal(current.live, false);
  assert.equal(current.freshness, "CURRENT");
  assert.equal(stale.freshness, "STALE");
  assert.match(current.sourceSha, /^[0-9a-f]{40}$/);
  assert.equal(current.highestValueAction, current.rankedActions[0]);
  assert.doesNotMatch(JSON.stringify(current), /\b(LIVE NOW|CONNECTED|ONLINE|REAL[- ]TIME|SYNCED)\b/i);

  assert.throws(() => getProjectCockpitView(PROJECT_COCKPIT_SNAPSHOT, new Date(observedAtMs - 1)), /future/i);
  for (const invalid of [
    { ...PROJECT_COCKPIT_SNAPSHOT, sourceSha: "main" },
    { ...PROJECT_COCKPIT_SNAPSHOT, sourcePath: "../STATE.json" },
    { ...PROJECT_COCKPIT_SNAPSHOT, repository: "courtney/Harvey-Mobile" },
    { ...PROJECT_COCKPIT_SNAPSHOT, live: true },
  ]) assert.throws(() => getProjectCockpitView(invalid, freshNow));
});

test("ranking is input-order independent and every recommendation is inert", () => {
  const view = getProjectCockpitView(PROJECT_COCKPIT_SNAPSHOT, freshNow);
  const reversed = getProjectCockpitView({ ...PROJECT_COCKPIT_SNAPSHOT, actions: [...PROJECT_COCKPIT_SNAPSHOT.actions].reverse() }, freshNow);
  assert.deepEqual(reversed.rankedActions.map((action) => action.id), view.rankedActions.map((action) => action.id));
  assert.deepEqual(view.rankedActions.map((action) => action.id), ["VERIFY_COCKPIT_CONTRACTS", "REVIEW_COCKPIT_HANDOFF", "PREPARE_CANON_GATE_EVIDENCE"]);
  view.rankedActions.forEach((action, index) => {
    assert.equal(action.rank, index + 1);
    zeroEffects(action);
    if (index > 0) assert.ok(view.rankedActions[index - 1].score >= action.score);
  });

  const tied = structuredClone(PROJECT_COCKPIT_SNAPSHOT);
  tied.actions = [
    { id: "Z_ACTION", label: "Review Z evidence", readiness: "READY_LOCAL", userValue: 5, urgency: 5, evidenceIds: ["C7_PACKET"] },
    { id: "A_ACTION", label: "Review A evidence", readiness: "READY_LOCAL", userValue: 5, urgency: 5, evidenceIds: ["C7_PACKET"] },
  ];
  assert.deepEqual(getProjectCockpitView(tied, freshNow).rankedActions.map((action) => action.id), ["A_ACTION", "Z_ACTION"]);

  const elevated = structuredClone(PROJECT_COCKPIT_SNAPSHOT);
  elevated.actions[0].label = "Deploy completed cockpit";
  assert.throws(() => getProjectCockpitView(elevated, freshNow), /completed effect/i);
});

test("phone cockpit retains accessible semantics and 320px-safe layout hooks", async () => {
  const source = await readFile(new URL("../../src/components/ProjectCockpitCard.tsx", import.meta.url), "utf8");
  assert.match(source, /accessibilityRole=["']header["']/);
  assert.match(source, /accessibilityLabel=/);
  assert.match(source, /accessibilityHint=/);
  assert.match(source, /accessibilityLiveRegion=["']polite["']/);
  assert.match(source, /width:\s*["']100%["']/);
  assert.match(source, /flexShrink:\s*1/);
  assert.match(source, /flexWrap:\s*["']wrap["']/);
  assert.doesNotMatch(source, /width:\s*(3[2-9]\d|[4-9]\d{2,})\b/);
});
