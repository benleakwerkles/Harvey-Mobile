export const HARVEY_MOBILE_REPOSITORY = "benleakwerkles/Harvey-Mobile" as const;
export const OPERATION_SOURCE_PATH = "docs/flock/STATE.json" as const;

export const OPERATION_ACTIONS = Object.freeze([
  Object.freeze({
    id: "RUN_SANDBOX_VERIFY",
    title: "Prepare sandbox verification",
    purpose: "Prepare a request to verify the current Harvey Mobile sandbox tree.",
    humanGate: "Root must separately authorize any GitHub Actions run.",
  }),
  Object.freeze({
    id: "REQUEST_REVIEW",
    title: "Prepare review request",
    purpose: "Prepare a request for human review of the current sandbox evidence.",
    humanGate: "A human must separately choose and contact the reviewer.",
  }),
  Object.freeze({
    id: "PREPARE_PROMOTION",
    title: "Prepare promotion review",
    purpose: "Prepare a review of a possible sandbox-to-canon promotion.",
    humanGate: "Canon promotion requires a separate receipt-bound human approval.",
  }),
] as const);

export type OperationActionId = (typeof OPERATION_ACTIONS)[number]["id"];
export type OperationStage = "PLANNED_LOCAL";
export type OperationApprovalState = "PENDING_HUMAN_GATE";

export type OperationIntentReceipt = Readonly<{
  schemaVersion: 1;
  intentId: string;
  idempotencyKey: string;
  actionId: OperationActionId;
  actionTitle: string;
  repository: typeof HARVEY_MOBILE_REPOSITORY;
  sourcePath: string;
  sourceSha: string;
  executionOwner: "CODEX_ROOT";
  approvalState: OperationApprovalState;
  stage: OperationStage;
  persistence: "SESSION_ONLY";
  transport: "NONE";
  truth: "LOCAL_OPERATION_INTENT_NOT_DISPATCHED";
  createdAt: string;
  externalEnderState: "BLOCKED_UNBOUND";
  requestSent: false;
  executed: false;
  verified: false;
  canonWritten: false;
  merged: false;
  deployed: false;
}>;

type OperationIntentInput = Readonly<{
  actionId: string;
  sourceSha: string;
  sourcePath?: string;
  repository?: string;
  executionOwner?: string;
  approvalState?: string;
  now: Date;
}>;

const FULL_SHA = /^[0-9a-f]{40}$/;
const ALLOWED_IDS = new Set<string>(OPERATION_ACTIONS.map((action) => action.id));

function assertRepositoryRelative(sourcePath: string) {
  const segments = sourcePath.split("/");
  if (
    sourcePath === "" ||
    sourcePath.startsWith("/") ||
    sourcePath.includes("\\") ||
    /^[A-Za-z]:/.test(sourcePath) ||
    segments.includes("..") ||
    segments.includes(".") ||
    segments.some((segment) => segment === "")
  ) {
    throw new Error("Operation source path must be repository-relative.");
  }
}

export function createOperationIntent(input: OperationIntentInput): OperationIntentReceipt {
  const repository = input.repository ?? HARVEY_MOBILE_REPOSITORY;
  const sourcePath = input.sourcePath ?? OPERATION_SOURCE_PATH;
  const executionOwner = input.executionOwner ?? "CODEX_ROOT";
  const approvalState = input.approvalState ?? "PENDING_HUMAN_GATE";

  if (!ALLOWED_IDS.has(input.actionId)) throw new Error("Operation action is not allowlisted.");
  if (repository !== HARVEY_MOBILE_REPOSITORY) throw new Error("Operation repository is not Harvey Mobile.");
  if (!FULL_SHA.test(input.sourceSha)) throw new Error("Operation source SHA must be a full lowercase commit SHA.");
  assertRepositoryRelative(sourcePath);
  if (executionOwner !== "CODEX_ROOT") throw new Error("Operation execution owner must remain CODEX_ROOT.");
  if (approvalState !== "PENDING_HUMAN_GATE") throw new Error("Operation approval must remain pending.");
  if (!(input.now instanceof Date) || Number.isNaN(input.now.getTime())) throw new Error("Operation timestamp is invalid.");

  const action = OPERATION_ACTIONS.find((candidate) => candidate.id === input.actionId);
  if (!action) throw new Error("Operation action metadata is missing.");

  const canonical = [repository, action.id, sourcePath, input.sourceSha, executionOwner, approvalState].join("|");
  const idempotencyKey = `harvey-operation:${canonical}`;

  return Object.freeze({
    schemaVersion: 1,
    intentId: idempotencyKey,
    idempotencyKey,
    actionId: action.id,
    actionTitle: action.title,
    repository: HARVEY_MOBILE_REPOSITORY,
    sourcePath,
    sourceSha: input.sourceSha,
    executionOwner: "CODEX_ROOT",
    approvalState: "PENDING_HUMAN_GATE",
    stage: "PLANNED_LOCAL",
    persistence: "SESSION_ONLY",
    transport: "NONE",
    truth: "LOCAL_OPERATION_INTENT_NOT_DISPATCHED",
    createdAt: input.now.toISOString(),
    externalEnderState: "BLOCKED_UNBOUND",
    requestSent: false,
    executed: false,
    verified: false,
    canonWritten: false,
    merged: false,
    deployed: false,
  });
}
