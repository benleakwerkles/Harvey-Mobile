import type { CaptureDraftReceipt } from "./captureDraft";

export const CAPTURE_CATEGORIES = Object.freeze(["BUILD", "BUG", "IDEA", "FOLLOW_UP", "GENERAL"] as const);
export const CAPTURE_PRIORITIES = Object.freeze(["NOW", "NEXT", "LATER"] as const);
export const CAPTURE_STATUSES = Object.freeze(["INBOX", "REVIEWED", "DONE_LOCAL"] as const);

export type CaptureCategory = (typeof CAPTURE_CATEGORIES)[number];
export type CapturePriority = (typeof CAPTURE_PRIORITIES)[number];
export type CaptureTriageStatus = (typeof CAPTURE_STATUSES)[number];
export type CaptureTriageEffectFlags = Readonly<{ persisted: false; dispatched: false; delivered: false; executed: false; verified: false; merged: false; deployed: false; hosted: false }>;
export type CaptureTriageItem = Readonly<{ id: string; captureRequestId: string; createdAt: string; characterCount: number; lineCount: number; category: CaptureCategory; priority: CapturePriority; status: CaptureTriageStatus; summary: "FIELD_NOTE_CAPTURED"; truth: "SESSION_TRIAGE_METADATA_ONLY"; persistence: "SESSION_ONLY"; transport: "NONE"; effectFlags: CaptureTriageEffectFlags }>;
export type CaptureTriageFilters = Readonly<{ category: CaptureCategory | "ALL"; priority: CapturePriority | "ALL"; status: CaptureTriageStatus | "ALL" }>;
export type CaptureTriageView = Readonly<{ truth: "SESSION_TRIAGE_METADATA_ONLY"; persistence: "SESSION_ONLY"; transport: "NONE"; filters: CaptureTriageFilters; totalCount: number; visibleCount: number; counts: Readonly<Record<CaptureTriageStatus, number>>; items: readonly CaptureTriageItem[]; effectFlags: CaptureTriageEffectFlags }>;

const REQUEST_ID = /^capture-local-[a-z0-9]+$/;
const PRIORITY_WEIGHT: Readonly<Record<CapturePriority, number>> = Object.freeze({ NOW: 3, NEXT: 2, LATER: 1 });
const STATUS_WEIGHT: Readonly<Record<CaptureTriageStatus, number>> = Object.freeze({ INBOX: 3, REVIEWED: 2, DONE_LOCAL: 1 });
const RECEIPT_KEYS = Object.freeze(["requestId", "createdAt", "characterCount", "lineCount", "summary", "proofState"] as const);
const ITEM_KEYS = Object.freeze(["id", "captureRequestId", "createdAt", "characterCount", "lineCount", "category", "priority", "status", "summary", "truth", "persistence", "transport", "effectFlags"] as const);
const EFFECT_KEYS = Object.freeze(["persisted", "dispatched", "delivered", "executed", "verified", "merged", "deployed", "hosted"] as const);
const ZERO_EFFECTS: CaptureTriageEffectFlags = Object.freeze({ persisted: false, dispatched: false, delivered: false, executed: false, verified: false, merged: false, deployed: false, hosted: false });
const ALL_FILTERS: CaptureTriageFilters = Object.freeze({ category: "ALL", priority: "ALL", status: "ALL" });

function hasExactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length && actual.every((key, index) => key === sortedExpected[index]);
}

function assertCaptureReceiptBoundary(receipt: CaptureDraftReceipt): void {
  if (!hasExactKeys(receipt, RECEIPT_KEYS)) throw new Error("Capture triage accepts only the exact metadata-only draft receipt boundary.");
  if (!REQUEST_ID.test(receipt.requestId)) throw new Error("Capture receipt ID is invalid.");
  if (!Number.isFinite(Date.parse(receipt.createdAt))) throw new Error("Capture receipt time is invalid.");
  if (!Number.isSafeInteger(receipt.characterCount) || receipt.characterCount < 1) throw new Error("Capture character count is invalid.");
  if (!Number.isSafeInteger(receipt.lineCount) || receipt.lineCount < 1) throw new Error("Capture line count is invalid.");
  if (receipt.summary !== "FIELD_NOTE_CAPTURED" || receipt.proofState !== "LOCAL_DRAFT_NOT_DISPATCHED") throw new Error("Capture receipt truth boundary is invalid.");
}

function assertZeroEffects(flags: CaptureTriageEffectFlags): void {
  if (!hasExactKeys(flags, EFFECT_KEYS) || EFFECT_KEYS.some((key) => flags[key] !== false)) throw new Error("Capture triage cannot claim persistence, transport, delivery, execution, or release effects.");
}

function validateItem(item: CaptureTriageItem): void {
  if (!hasExactKeys(item, ITEM_KEYS)) throw new Error("Capture triage item contains unknown or raw-content fields.");
  if (!REQUEST_ID.test(item.captureRequestId) || item.id !== item.captureRequestId.replace(/^capture-/, "triage-")) throw new Error("Capture triage identity is invalid.");
  if (!Number.isFinite(Date.parse(item.createdAt))) throw new Error("Capture triage time is invalid.");
  if (!Number.isSafeInteger(item.characterCount) || item.characterCount < 1) throw new Error("Capture triage character count is invalid.");
  if (!Number.isSafeInteger(item.lineCount) || item.lineCount < 1) throw new Error("Capture triage line count is invalid.");
  if (!CAPTURE_CATEGORIES.includes(item.category)) throw new Error("Capture triage category is invalid.");
  if (!CAPTURE_PRIORITIES.includes(item.priority)) throw new Error("Capture triage priority is invalid.");
  if (!CAPTURE_STATUSES.includes(item.status)) throw new Error("Capture triage status is invalid.");
  if (item.summary !== "FIELD_NOTE_CAPTURED" || item.truth !== "SESSION_TRIAGE_METADATA_ONLY" || item.persistence !== "SESSION_ONLY" || item.transport !== "NONE") throw new Error("Capture triage truth boundary is invalid.");
  assertZeroEffects(item.effectFlags);
}

export function createCaptureTriageItem(input: Readonly<{ receipt: CaptureDraftReceipt; category: CaptureCategory; priority: CapturePriority }>): CaptureTriageItem {
  assertCaptureReceiptBoundary(input.receipt);
  if (!CAPTURE_CATEGORIES.includes(input.category)) throw new Error("Capture triage category is invalid.");
  if (!CAPTURE_PRIORITIES.includes(input.priority)) throw new Error("Capture triage priority is invalid.");
  return Object.freeze({ id: input.receipt.requestId.replace(/^capture-/, "triage-"), captureRequestId: input.receipt.requestId, createdAt: input.receipt.createdAt, characterCount: input.receipt.characterCount, lineCount: input.receipt.lineCount, category: input.category, priority: input.priority, status: "INBOX", summary: "FIELD_NOTE_CAPTURED", truth: "SESSION_TRIAGE_METADATA_ONLY", persistence: "SESSION_ONLY", transport: "NONE", effectFlags: ZERO_EFFECTS });
}

export function advanceCaptureTriageStatus(item: CaptureTriageItem): CaptureTriageItem {
  validateItem(item);
  if (item.status === "DONE_LOCAL") return item;
  const nextStatus: CaptureTriageStatus = item.status === "INBOX" ? "REVIEWED" : "DONE_LOCAL";
  return Object.freeze({ ...item, status: nextStatus, effectFlags: ZERO_EFFECTS });
}

export function getCaptureTriageView(items: readonly CaptureTriageItem[], filters: CaptureTriageFilters = ALL_FILTERS): CaptureTriageView {
  if (!(filters.category === "ALL" || CAPTURE_CATEGORIES.includes(filters.category))) throw new Error("Capture category filter is invalid.");
  if (!(filters.priority === "ALL" || CAPTURE_PRIORITIES.includes(filters.priority))) throw new Error("Capture priority filter is invalid.");
  if (!(filters.status === "ALL" || CAPTURE_STATUSES.includes(filters.status))) throw new Error("Capture status filter is invalid.");
  const ids = new Set<string>();
  items.forEach((item) => { validateItem(item); if (ids.has(item.id)) throw new Error("Capture triage IDs must be unique."); ids.add(item.id); });
  const visible = items.filter((item) => filters.category === "ALL" || item.category === filters.category).filter((item) => filters.priority === "ALL" || item.priority === filters.priority).filter((item) => filters.status === "ALL" || item.status === filters.status).sort((left, right) => {
    const priority = PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority]; if (priority !== 0) return priority;
    const status = STATUS_WEIGHT[right.status] - STATUS_WEIGHT[left.status]; if (status !== 0) return status;
    const time = Date.parse(right.createdAt) - Date.parse(left.createdAt); if (time !== 0) return time;
    return left.id.localeCompare(right.id, "en");
  });
  const counts = Object.freeze({ INBOX: items.filter((item) => item.status === "INBOX").length, REVIEWED: items.filter((item) => item.status === "REVIEWED").length, DONE_LOCAL: items.filter((item) => item.status === "DONE_LOCAL").length });
  return Object.freeze({ truth: "SESSION_TRIAGE_METADATA_ONLY", persistence: "SESSION_ONLY", transport: "NONE", filters: Object.freeze({ ...filters }), totalCount: items.length, visibleCount: visible.length, counts, items: Object.freeze(visible), effectFlags: ZERO_EFFECTS });
}
