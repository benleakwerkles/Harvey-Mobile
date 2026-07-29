export const BUILD_QUEUE_PRIORITIES = Object.freeze(["P0", "P1", "P2", "P3"] as const);
export const BUILD_QUEUE_STATUSES = Object.freeze(["QUEUED", "ACTIVE_LOCAL", "DONE_LOCAL"] as const);
export type BuildQueuePriority = (typeof BUILD_QUEUE_PRIORITIES)[number];
export type BuildQueueStatus = (typeof BUILD_QUEUE_STATUSES)[number];
export type BuildQueueEffectFlags = Readonly<{ persisted: false; dispatched: false; executed: false; verified: false; merged: false; deployed: false; hosted: false; delivered: false }>;
export type BuildQueueItem = Readonly<{ id: string; title: string; area: string; priority: BuildQueuePriority; status: BuildQueueStatus; createdAt: string; truth: "SESSION_BUILD_QUEUE_NOT_EXECUTED"; persistence: "SESSION_ONLY"; transport: "NONE"; executionOwner: "CODEX_ROOT"; effectFlags: BuildQueueEffectFlags }>;
export type BuildQueueView = Readonly<{ truth: "SESSION_BUILD_QUEUE_NOT_EXECUTED"; persistence: "SESSION_ONLY"; transport: "NONE"; totalCount: number; openCount: number; activeCount: number; doneCount: number; items: readonly BuildQueueItem[]; effectFlags: BuildQueueEffectFlags }>;

const STABLE_ID = /^build-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRIORITY_WEIGHT: Readonly<Record<BuildQueuePriority, number>> = Object.freeze({ P0: 4, P1: 3, P2: 2, P3: 1 });
const STATUS_WEIGHT: Readonly<Record<BuildQueueStatus, number>> = Object.freeze({ QUEUED: 1, ACTIVE_LOCAL: 2, DONE_LOCAL: 0 });
const SECRET_FIELD = /(?:api[\s_-]*key|authorization|cookie|oauth|passphrase|password|private[\s_-]*key|secret|token)\s*[:=]\s*\S+/i;
const CREDENTIAL = /(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/=-]{8,}|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b|\bsk-[A-Za-z0-9_-]{20,}\b|https?:\/\/[^\s/:]+:[^\s/@]+@)/i;
const COMPLETED_EFFECT = /\b(?:approved|delivered|deployed|executed|hosted|merged|pushed)\b/i;
const ITEM_KEYS = Object.freeze(["id", "title", "area", "priority", "status", "createdAt", "truth", "persistence", "transport", "executionOwner", "effectFlags"] as const);
const EFFECT_KEYS = Object.freeze(["persisted", "dispatched", "executed", "verified", "merged", "deployed", "hosted", "delivered"] as const);
const ZERO_EFFECTS: BuildQueueEffectFlags = Object.freeze({ persisted: false, dispatched: false, executed: false, verified: false, merged: false, deployed: false, hosted: false, delivered: false });
function hasExactKeys(value: object, expected: readonly string[]): boolean { const actual = Object.keys(value).sort(); const sorted = [...expected].sort(); return actual.length === sorted.length && actual.every((key,index) => key === sorted[index]); }
function assertSafeLabel(value: string, label: string, maxLength: number): void { if (value === "" || value !== value.trim() || value.length > maxLength || /[\r\n]/.test(value) || SECRET_FIELD.test(value) || CREDENTIAL.test(value) || COMPLETED_EFFECT.test(value)) throw new Error(label + " is empty, malformed, secret-shaped, or claims a completed effect."); }
function assertZeroEffects(flags: BuildQueueEffectFlags): void { if (!hasExactKeys(flags,EFFECT_KEYS) || EFFECT_KEYS.some((key) => flags[key] !== false)) throw new Error("Build queue cannot claim persistence, dispatch, execution, verification, delivery, or release effects."); }
function validateItem(item: BuildQueueItem): void {
  if (!hasExactKeys(item,ITEM_KEYS)) throw new Error("Build queue item contains unknown fields.");
  if (!STABLE_ID.test(item.id)) throw new Error("Build queue ID is invalid.");
  assertSafeLabel(item.title,"Build queue title",120); assertSafeLabel(item.area,"Build queue area",40);
  if (!BUILD_QUEUE_PRIORITIES.includes(item.priority)) throw new Error("Build queue priority is invalid.");
  if (!BUILD_QUEUE_STATUSES.includes(item.status)) throw new Error("Build queue status is invalid.");
  if (!Number.isFinite(Date.parse(item.createdAt))) throw new Error("Build queue creation time is invalid.");
  if (item.truth !== "SESSION_BUILD_QUEUE_NOT_EXECUTED" || item.persistence !== "SESSION_ONLY" || item.transport !== "NONE" || item.executionOwner !== "CODEX_ROOT") throw new Error("Build queue truth or ownership boundary is invalid.");
  assertZeroEffects(item.effectFlags);
}
function normalizeQueue(items: readonly BuildQueueItem[]): readonly BuildQueueItem[] {
  const ids = new Set<string>(); const safe = items.map((item) => { validateItem(item); if (ids.has(item.id)) throw new Error("Build queue IDs must be unique."); ids.add(item.id); return Object.freeze({ ...item, effectFlags: ZERO_EFFECTS }); });
  safe.sort((left,right) => { const unfinished = Number(right.status !== "DONE_LOCAL") - Number(left.status !== "DONE_LOCAL"); if (unfinished !== 0) return unfinished; const priority = PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority]; if (priority !== 0) return priority; const status = STATUS_WEIGHT[right.status] - STATUS_WEIGHT[left.status]; if (status !== 0) return status; const created = Date.parse(left.createdAt) - Date.parse(right.createdAt); if (created !== 0) return created; return left.id.localeCompare(right.id,"en"); });
  return Object.freeze(safe);
}
function requirePriority(priority: BuildQueuePriority): void { if (!BUILD_QUEUE_PRIORITIES.includes(priority)) throw new Error("Build queue priority is invalid."); }
function requireExistingId(items: readonly BuildQueueItem[], id: string): void { if (!STABLE_ID.test(id) || !items.some((item) => item.id === id)) throw new Error("Build queue item was not found."); }
export function createBuildQueueItem(input: Readonly<{ id: string; title: string; area: string; priority: BuildQueuePriority; createdAt: string }>): BuildQueueItem { const item: BuildQueueItem = { ...input, status: "QUEUED", truth: "SESSION_BUILD_QUEUE_NOT_EXECUTED", persistence: "SESSION_ONLY", transport: "NONE", executionOwner: "CODEX_ROOT", effectFlags: ZERO_EFFECTS }; validateItem(item); return Object.freeze(item); }
export function addBuildQueueItem(items: readonly BuildQueueItem[], item: BuildQueueItem): readonly BuildQueueItem[] { return normalizeQueue([...items,item]); }
export function reprioritizeBuildQueueItem(items: readonly BuildQueueItem[], id: string, priority: BuildQueuePriority): readonly BuildQueueItem[] { const normalized=normalizeQueue(items); requireExistingId(normalized,id); requirePriority(priority); return normalizeQueue(normalized.map((item) => item.id === id ? { ...item, priority } : item)); }
export function advanceBuildQueueStatus(items: readonly BuildQueueItem[], id: string): readonly BuildQueueItem[] { const normalized=normalizeQueue(items); requireExistingId(normalized,id); return normalizeQueue(normalized.map((item) => { if (item.id !== id || item.status === "DONE_LOCAL") return item; const status: BuildQueueStatus = item.status === "QUEUED" ? "ACTIVE_LOCAL" : "DONE_LOCAL"; return { ...item, status }; })); }
export function getBuildQueueView(items: readonly BuildQueueItem[]): BuildQueueView { const normalized=normalizeQueue(items); return Object.freeze({ truth:"SESSION_BUILD_QUEUE_NOT_EXECUTED", persistence:"SESSION_ONLY", transport:"NONE", totalCount:normalized.length, openCount:normalized.filter((item)=>item.status!=="DONE_LOCAL").length, activeCount:normalized.filter((item)=>item.status==="ACTIVE_LOCAL").length, doneCount:normalized.filter((item)=>item.status==="DONE_LOCAL").length, items:normalized, effectFlags:ZERO_EFFECTS }); }
