import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const RECEIPT_NAME = "HARVEY_ARTIFACT_RECEIPT.json";
const fullShaPattern = /^[a-f0-9]{40}$/i;

function requireSha(value, label) {
  if (!fullShaPattern.test(value ?? "")) throw new Error(`INVALID_${label}`);
  return value.toLowerCase();
}

async function inventory(root) {
  const files = [];

  async function walk(folder) {
    const entries = await readdir(folder, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = path.join(folder, entry.name);
      if (entry.isSymbolicLink()) throw new Error("SYMLINK_NOT_ALLOWED");
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (!entry.isFile() || entry.name === RECEIPT_NAME) continue;
      const relative = path.relative(root, absolute).replaceAll("\\", "/");
      if (relative.startsWith("../") || path.isAbsolute(relative)) throw new Error("PATH_ESCAPE");
      const content = await readFile(absolute);
      files.push({
        path: relative,
        bytes: content.byteLength,
        sha256: createHash("sha256").update(content).digest("hex"),
      });
    }
  }

  await walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

export async function writeBuildArtifactReceipt({
  androidRoot,
  webRoot,
  repository,
  eventName,
  runId,
  sourceHeadSha,
  buildTreeSha,
  baseSha,
}) {
  const source = requireSha(sourceHeadSha, "SOURCE_HEAD_SHA");
  const tree = requireSha(buildTreeSha, "BUILD_TREE_SHA");
  const base = baseSha ? requireSha(baseSha, "BASE_SHA") : null;
  if (!/^\d+$/.test(runId ?? "")) throw new Error("INVALID_RUN_ID");

  const [androidFiles, webFiles] = await Promise.all([inventory(androidRoot), inventory(webRoot)]);
  if (androidFiles.length === 0) throw new Error("ANDROID_EXPORT_EMPTY");
  if (!webFiles.some((file) => file.path === "index.html")) throw new Error("WEB_ENTRYPOINT_MISSING");

  const receipt = Object.freeze({
    schema_version: 1,
    kind: "HARVEY_MOBILE_BUILD_ARTIFACTS",
    state: "BUILT_NOT_DEPLOYED",
    truth: "DOWNLOADABLE BUILD ARTIFACT · NOT LIVE",
    repository,
    event_name: eventName,
    workflow_run_id: runId,
    source_head_sha: source,
    build_tree_sha: tree,
    base_sha: base,
    deployment: false,
    artifacts: [
      { platform: "android", name: `harvey-mobile-android-${tree}`, files: androidFiles },
      { platform: "web", name: `harvey-mobile-web-${tree}`, entrypoint: "index.html", files: webFiles },
    ],
    instructions: "Download and inspect these exports. They are not hosted, deployed, or connected to live Werkles data.",
  });
  const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
  await Promise.all([
    writeFile(path.join(androidRoot, RECEIPT_NAME), serialized, "utf8"),
    writeFile(path.join(webRoot, RECEIPT_NAME), serialized, "utf8"),
  ]);
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeBuildArtifactReceipt({
    androidRoot: path.resolve("dist/android"),
    webRoot: path.resolve("dist/web"),
    repository: process.env.GITHUB_REPOSITORY ?? "UNBOUND_REPOSITORY",
    eventName: process.env.GITHUB_EVENT_NAME ?? "local",
    runId: process.env.GITHUB_RUN_ID ?? "0",
    sourceHeadSha: process.env.SOURCE_HEAD_SHA,
    buildTreeSha: process.env.BUILD_TREE_SHA,
    baseSha: process.env.BASE_SHA || null,
  });
}
