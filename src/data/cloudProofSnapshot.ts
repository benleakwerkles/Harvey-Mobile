import type { BuildIdentity } from "./buildIdentity";

export type CloudArtifact = Readonly<{
  platform: "android" | "web";
  runId: number;
  id: number;
  name: string;
  digest: string;
  availability: "RECORDED_AVAILABILITY_UNPROVEN";
}>;

export type CloudProofSnapshot = Readonly<{
  implementationSha: string;
  pushRun: Readonly<{ id: number; conclusion: "success" }>;
  prRun: Readonly<{ id: number; conclusion: "success" }>;
  artifacts: readonly CloudArtifact[];
  webTruth: "DOWNLOADABLE_BUILD_ARTIFACT_NOT_LIVE";
  canonWritten: false;
  merged: false;
  deployed: false;
  promotionApproval: "PENDING";
}>;

export type CloudProofView = CloudProofSnapshot &
  Readonly<{ evidenceState: "PROVEN_HISTORICAL"; boundaryLabels: readonly string[] }>;

const fullShaPattern = /^[a-f0-9]{40}$/;
const digestPattern = /^sha256:[a-f0-9]{64}$/;

export function getCloudProofView(snapshot: CloudProofSnapshot): CloudProofView {
  if (!fullShaPattern.test(snapshot.implementationSha)) {
    throw new Error("Cloud proof implementation SHA is invalid.");
  }
  if (
    snapshot.pushRun.conclusion !== "success" ||
    snapshot.prRun.conclusion !== "success" ||
    !Number.isInteger(snapshot.pushRun.id) ||
    snapshot.pushRun.id <= 0 ||
    !Number.isInteger(snapshot.prRun.id) ||
    snapshot.prRun.id <= 0
  ) {
    throw new Error("Cloud proof requires positive successful run receipts.");
  }
  if (snapshot.webTruth !== "DOWNLOADABLE_BUILD_ARTIFACT_NOT_LIVE") {
    throw new Error("Cloud proof web truth cannot claim a live build.");
  }
  if (snapshot.canonWritten || snapshot.merged || snapshot.deployed) {
    throw new Error("Sandbox proof cannot imply canon, merge, or deployment.");
  }

  const artifactIds = new Set<number>();
  const platforms = new Set<string>();
  for (const artifact of snapshot.artifacts) {
    if (!Number.isInteger(artifact.id) || artifact.id <= 0 || artifact.runId !== snapshot.pushRun.id) {
      throw new Error("Artifact must be bound to the selected successful push run.");
    }
    if (artifactIds.has(artifact.id) || platforms.has(artifact.platform)) {
      throw new Error("Artifact identities and platforms must be unique.");
    }
    artifactIds.add(artifact.id);
    platforms.add(artifact.platform);
    if (!artifact.name.endsWith(snapshot.implementationSha) || !digestPattern.test(artifact.digest)) {
      throw new Error("Artifact name or digest does not match the proven tree.");
    }
    if (artifact.availability !== "RECORDED_AVAILABILITY_UNPROVEN") {
      throw new Error("Artifact availability must remain unproven.");
    }
  }
  if (!platforms.has("android") || !platforms.has("web") || snapshot.artifacts.length !== 2) {
    throw new Error("Cloud proof requires exactly one Android and one web artifact.");
  }

  return Object.freeze({
    ...snapshot,
    evidenceState: "PROVEN_HISTORICAL",
    boundaryLabels: Object.freeze([
      "NOT LIVE",
      "NOT HOSTED",
      "NOT CANONICAL",
      "NOT MERGED",
      "NOT DEPLOYED",
    ]),
  });
}

export function compareBundleToProof(
  buildIdentity: BuildIdentity,
  snapshot: CloudProofSnapshot,
):
  | "SHA MATCH · RECEIPT APPLIES TO THIS BUNDLE"
  | "DIFFERENT SHA · THIS BUNDLE IS NOT COVERED BY THE LAST RECEIPT"
  | "CURRENT BUNDLE UNBOUND · NO MATCH CLAIM" {
  if (buildIdentity.state !== "CI_BOUND") {
    return "CURRENT BUNDLE UNBOUND · NO MATCH CLAIM";
  }
  return buildIdentity.sha === snapshot.implementationSha
    ? "SHA MATCH · RECEIPT APPLIES TO THIS BUNDLE"
    : "DIFFERENT SHA · THIS BUNDLE IS NOT COVERED BY THE LAST RECEIPT";
}

export const CLOUD_PROOF_SNAPSHOT: CloudProofSnapshot = Object.freeze({
  implementationSha: "8c6f8f78d3cd6202e41a2f7f348e5175343b822b",
  pushRun: Object.freeze({ id: 29618004815, conclusion: "success" }),
  prRun: Object.freeze({ id: 29618006967, conclusion: "success" }),
  artifacts: Object.freeze([
    Object.freeze({
      platform: "android",
      runId: 29618004815,
      id: 8421192040,
      name: "harvey-mobile-android-8c6f8f78d3cd6202e41a2f7f348e5175343b822b",
      digest: "sha256:11ac1fed846d0329402caca07d2ef2f1b6bb2851e2a702e3590b2641a0e07342",
      availability: "RECORDED_AVAILABILITY_UNPROVEN",
    }),
    Object.freeze({
      platform: "web",
      runId: 29618004815,
      id: 8421192234,
      name: "harvey-mobile-web-8c6f8f78d3cd6202e41a2f7f348e5175343b822b",
      digest: "sha256:7357c07f45c50688043caaa41cda856b1905015511035df83b7bc94052bd4ad1",
      availability: "RECORDED_AVAILABILITY_UNPROVEN",
    }),
  ]),
  webTruth: "DOWNLOADABLE_BUILD_ARTIFACT_NOT_LIVE",
  canonWritten: false,
  merged: false,
  deployed: false,
  promotionApproval: "PENDING",
});
