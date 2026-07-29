export const PROJECT_COCKPIT_TRUTH = "CHECKED_IN_EVIDENCE_NOT_LIVE" as const;

export type CockpitFreshness = "CURRENT" | "AGING" | "STALE";
export type CockpitReadiness = "READY_LOCAL" | "NEEDS_REVIEW" | "BLOCKED_HUMAN_GATE";

export type CockpitEffectFlags = Readonly<{
  requestSent: false;
  executed: false;
  verified: false;
  canonWritten: false;
  merged: false;
  deployed: false;
  hosted: false;
  delivered: false;
  liveConnected: false;
}>;

export type ProjectCockpitEvidence = Readonly<{
  id: string;
  label: string;
  sourcePath: string;
  sourceSha: string;
  observedAt: string;
  state: "CHECKED_IN";
  claim: string;
}>;

export type ProjectCockpitAction = Readonly<{
  id: string;
  label: string;
  readiness: CockpitReadiness;
  userValue: 1 | 2 | 3 | 4 | 5;
  urgency: 1 | 2 | 3 | 4 | 5;
  evidenceIds: readonly string[];
}>;

export type ProjectCockpitSnapshot = Readonly<{
  project: "Harvey Mobile";
  repository: "benleakwerkles/Harvey-Mobile";
  truth: typeof PROJECT_COCKPIT_TRUTH;
  live: false;
  sourcePath: string;
  sourceSha: string;
  observedAt: string;
  evidence: readonly ProjectCockpitEvidence[];
  actions: readonly ProjectCockpitAction[];
}>;

export type ProjectCockpitRankedAction = Readonly<{
  id: string;
  label: string;
  rank: number;
  score: number;
  rankingTuple: readonly [number, number, number, string];
  readiness: CockpitReadiness;
  evidenceIds: readonly string[];
  stage: "PLANNED_LOCAL";
  transport: "NONE";
  executionOwner: "CODEX_ROOT";
  truth: "LOCAL_RECOMMENDATION_NOT_EXECUTED";
  effectFlags: CockpitEffectFlags;
}>;

export type ProjectCockpitView = Readonly<{
  project: "Harvey Mobile";
  repository: "benleakwerkles/Harvey-Mobile";
  truth: typeof PROJECT_COCKPIT_TRUTH;
  live: false;
  sourcePath: string;
  sourceSha: string;
  observedAt: string;
  ageDays: number;
  freshness: CockpitFreshness;
  evidence: readonly ProjectCockpitEvidence[];
  rankedActions: readonly ProjectCockpitRankedAction[];
  topAction: ProjectCockpitRankedAction;
  highestValueAction: ProjectCockpitRankedAction;
  effectFlags: CockpitEffectFlags;
}>;

const FULL_SHA = /^[0-9a-f]{40}$/;
const SAFE_ID = /^[A-Z][A-Z0-9_]{2,63}$/;
const COMPLETED_EFFECT_CLAIM = /\b(?:connect(?:ed)?|deliver(?:ed)?|deploy(?:ed)?|execute(?:d)?|host(?:ed)?|merge(?:d)?|promote(?:d)?)\b/i;
const READINESS_WEIGHT: Readonly<Record<CockpitReadiness, number>> = Object.freeze({
  READY_LOCAL: 3,
  NEEDS_REVIEW: 2,
  BLOCKED_HUMAN_GATE: 0,
});
const ZERO_EFFECTS: CockpitEffectFlags = Object.freeze({
  requestSent: false,
  executed: false,
  verified: false,
  canonWritten: false,
  merged: false,
  deployed: false,
  hosted: false,
  delivered: false,
  liveConnected: false,
});

function assertRepositoryPath(candidate: string, label: string): void {
  let decoded = candidate;
  try {
    for (let pass = 0; pass < 3; pass += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    throw new Error(label + " contains invalid encoding.");
  }
  const normalized = decoded.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (normalized === "" || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized) || segments.includes(".") || segments.includes("..") || segments.some((segment) => segment === "")) {
    throw new Error(label + " must be repository-relative and traversal-free.");
  }
}

function parseTime(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(label + " must be a valid timestamp.");
  return parsed;
}

function assertScore(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error(label + " must be an integer from 1 through 5.");
}

function validateSnapshot(snapshot: ProjectCockpitSnapshot, now: Date): number {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) throw new Error("Cockpit view time is invalid.");
  if (snapshot.project !== "Harvey Mobile" || snapshot.repository !== "benleakwerkles/Harvey-Mobile") throw new Error("Cockpit project or repository is invalid.");
  if (snapshot.truth !== PROJECT_COCKPIT_TRUTH || snapshot.live !== false) throw new Error("Cockpit cannot claim live state.");
  assertRepositoryPath(snapshot.sourcePath, "Cockpit source path");
  if (!FULL_SHA.test(snapshot.sourceSha)) throw new Error("Cockpit source SHA must be a full lowercase commit SHA.");
  const observedMs = parseTime(snapshot.observedAt, "Cockpit observation time");
  if (observedMs > nowMs) throw new Error("Cockpit evidence cannot be observed in the future.");
  if (snapshot.evidence.length === 0 || snapshot.actions.length === 0) throw new Error("Cockpit requires checked-in evidence and at least one action.");

  const evidenceIds = new Set<string>();
  for (const evidence of snapshot.evidence) {
    if (!SAFE_ID.test(evidence.id) || evidenceIds.has(evidence.id)) throw new Error("Cockpit evidence IDs must be unique and stable.");
    evidenceIds.add(evidence.id);
    if (evidence.state !== "CHECKED_IN") throw new Error("Cockpit evidence must remain checked-in, not live.");
    if (evidence.label.trim() === "" || evidence.claim.trim() === "" || COMPLETED_EFFECT_CLAIM.test(evidence.claim)) throw new Error("Cockpit evidence contains an empty or elevated claim.");
    assertRepositoryPath(evidence.sourcePath, "Evidence source path");
    if (!FULL_SHA.test(evidence.sourceSha)) throw new Error("Evidence source SHA must be a full lowercase commit SHA.");
    const evidenceObservedMs = parseTime(evidence.observedAt, "Evidence observation time");
    if (evidenceObservedMs > nowMs) throw new Error("Cockpit evidence cannot be observed in the future.");
  }

  const actionIds = new Set<string>();
  for (const action of snapshot.actions) {
    if (!SAFE_ID.test(action.id) || actionIds.has(action.id)) throw new Error("Cockpit action IDs must be unique and stable.");
    actionIds.add(action.id);
    if (action.label.trim() === "" || COMPLETED_EFFECT_CLAIM.test(action.label)) throw new Error("Cockpit action label is empty or claims a completed effect.");
    if (!(action.readiness in READINESS_WEIGHT)) throw new Error("Cockpit readiness is invalid.");
    assertScore(action.userValue, "Action user value");
    assertScore(action.urgency, "Action urgency");
    if (action.evidenceIds.length === 0 || new Set(action.evidenceIds).size !== action.evidenceIds.length) throw new Error("Cockpit action evidence references must be non-empty and unique.");
    if (action.evidenceIds.some((id) => !evidenceIds.has(id))) throw new Error("Cockpit action references unknown evidence.");
  }
  return Math.floor((nowMs - observedMs) / 86_400_000);
}

function freshnessForAge(ageDays: number): CockpitFreshness {
  if (ageDays <= 2) return "CURRENT";
  if (ageDays <= 7) return "AGING";
  return "STALE";
}

export function getProjectCockpitView(snapshot: ProjectCockpitSnapshot, now: Date): ProjectCockpitView {
  const ageDays = validateSnapshot(snapshot, now);
  const sorted = [...snapshot.actions].sort((left, right) => {
    const readiness = READINESS_WEIGHT[right.readiness] - READINESS_WEIGHT[left.readiness];
    if (readiness !== 0) return readiness;
    if (right.userValue !== left.userValue) return right.userValue - left.userValue;
    if (right.urgency !== left.urgency) return right.urgency - left.urgency;
    return left.id.localeCompare(right.id, "en");
  });
  const rankedActions = Object.freeze(sorted.map((action, index) => {
    const readinessWeight = READINESS_WEIGHT[action.readiness];
    return Object.freeze({
      id: action.id,
      label: action.label,
      rank: index + 1,
      score: (readinessWeight * 100) + (action.userValue * 10) + action.urgency,
      rankingTuple: Object.freeze([readinessWeight, action.userValue, action.urgency, action.id]) as readonly [number, number, number, string],
      readiness: action.readiness,
      evidenceIds: Object.freeze([...action.evidenceIds]),
      stage: "PLANNED_LOCAL" as const,
      transport: "NONE" as const,
      executionOwner: "CODEX_ROOT" as const,
      truth: "LOCAL_RECOMMENDATION_NOT_EXECUTED" as const,
      effectFlags: ZERO_EFFECTS,
    });
  }));
  return Object.freeze({
    project: snapshot.project,
    repository: snapshot.repository,
    truth: PROJECT_COCKPIT_TRUTH,
    live: false as const,
    sourcePath: snapshot.sourcePath,
    sourceSha: snapshot.sourceSha,
    observedAt: snapshot.observedAt,
    ageDays,
    freshness: freshnessForAge(ageDays),
    evidence: Object.freeze([...snapshot.evidence]),
    rankedActions,
    topAction: rankedActions[0],
    highestValueAction: rankedActions[0],
    effectFlags: ZERO_EFFECTS,
  });
}

export const PROJECT_COCKPIT_SNAPSHOT: ProjectCockpitSnapshot = Object.freeze({
  project: "Harvey Mobile",
  repository: "benleakwerkles/Harvey-Mobile",
  truth: PROJECT_COCKPIT_TRUTH,
  live: false,
  sourcePath: "docs/flock/packets/F_HARVEY_MOBILE_VPG_20260729_C7_BUNDLE.md",
  sourceSha: "e713c67b977d40a62190737382bcd0662a539363",
  observedAt: "2026-07-29T14:29:44.000Z",
  evidence: Object.freeze([Object.freeze({
    id: "C7_PACKET",
    label: "Cycle-seven immutable project-cockpit packet",
    sourcePath: "docs/flock/packets/F_HARVEY_MOBILE_VPG_20260729_C7_BUNDLE.md",
    sourceSha: "e713c67b977d40a62190737382bcd0662a539363",
    observedAt: "2026-07-29T14:29:44.000Z",
    state: "CHECKED_IN",
    claim: "Immutable packet evidence for the project-cockpit implementation slice.",
  })]),
  actions: Object.freeze([
    Object.freeze({ id: "VERIFY_COCKPIT_CONTRACTS", label: "Run the checked-in project cockpit contract suite", readiness: "READY_LOCAL", userValue: 5, urgency: 5, evidenceIds: Object.freeze(["C7_PACKET"]) }),
    Object.freeze({ id: "REVIEW_COCKPIT_HANDOFF", label: "Review the cycle-seven cockpit handoff for integration", readiness: "NEEDS_REVIEW", userValue: 5, urgency: 4, evidenceIds: Object.freeze(["C7_PACKET"]) }),
    Object.freeze({ id: "PREPARE_CANON_GATE_EVIDENCE", label: "Prepare human-gated canon promotion evidence", readiness: "BLOCKED_HUMAN_GATE", userValue: 4, urgency: 1, evidenceIds: Object.freeze(["C7_PACKET"]) }),
  ]),
});
