export type SnapshotFreshness = "RECENT SNAPSHOT" | "AGING SNAPSHOT" | "STALE SNAPSHOT";

export type ProjectSnapshot = Readonly<{
  project: string;
  sourcePath: string;
  sourceSha: string;
  observedAt: string;
  truth: "SNAPSHOT_NOT_LIVE";
}>;

export type ProjectSnapshotView = ProjectSnapshot &
  Readonly<{
    ageDays: number;
    freshness: SnapshotFreshness;
  }>;

const fullShaPattern = /^[a-f0-9]{40}$/i;

function assertRepoRelativePath(candidate: string): void {
  const normalized = candidate.replaceAll("\\", "/");
  if (
    normalized.trim() === "" ||
    normalized.startsWith("/") ||
    /^[a-z]:/i.test(normalized) ||
    normalized.split("/").includes("..")
  ) {
    throw new Error("Snapshot source path must be repository-relative.");
  }
}

export function getProjectSnapshotView(snapshot: ProjectSnapshot, now: Date): ProjectSnapshotView {
  assertRepoRelativePath(snapshot.sourcePath);
  if (!fullShaPattern.test(snapshot.sourceSha)) {
    throw new Error("Snapshot source SHA must contain exactly 40 hexadecimal characters.");
  }
  if (snapshot.truth !== "SNAPSHOT_NOT_LIVE") {
    throw new Error("Snapshot truth label is not supported.");
  }

  const observedMilliseconds = Date.parse(snapshot.observedAt);
  const nowMilliseconds = now.getTime();
  if (!Number.isFinite(observedMilliseconds) || !Number.isFinite(nowMilliseconds)) {
    throw new Error("Snapshot time is invalid.");
  }
  if (observedMilliseconds > nowMilliseconds) {
    throw new Error("Snapshot observation cannot be in the future.");
  }

  const ageDays = Math.floor((nowMilliseconds - observedMilliseconds) / 86_400_000);
  const freshness: SnapshotFreshness =
    ageDays <= 1 ? "RECENT SNAPSHOT" : ageDays <= 7 ? "AGING SNAPSHOT" : "STALE SNAPSHOT";

  return Object.freeze({ ...snapshot, ageDays, freshness });
}

export function calculateProgress(items: readonly Readonly<{ done: boolean }>[]): number {
  if (items.length === 0) return 0;
  const completed = items.filter((item) => item.done).length;
  return Math.round((completed / items.length) * 100);
}
