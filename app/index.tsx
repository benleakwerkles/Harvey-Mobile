import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { CommandBoard } from "../src/components/CommandBoard";
import { DailyMissionCard } from "../src/components/DailyMissionCard";
import { FieldBriefCard } from "../src/components/FieldBriefCard";
import { ShiftHandoffCard } from "../src/components/ShiftHandoffCard";
import { ResumeCheckpointCard } from "../src/components/ResumeCheckpointCard";
import { EvidenceHub } from "../src/components/EvidenceHub";
import { OperationsHub } from "../src/components/OperationsHub";
import { QuickCapture, type SessionCapture } from "../src/components/QuickCapture";
import type { CaptureDraftMetadata } from "../src/components/CaptureTriageBar";
import { BUILD_IDENTITY } from "../src/data/buildIdentity";
import { addBuildQueueItem, advanceBuildQueueStatus, createBuildQueueItem, getBuildQueueView, reprioritizeBuildQueueItem, type BuildQueueItem, type BuildQueuePriority } from "../src/data/buildQueue";
import { CLOUD_PROOF_SNAPSHOT, getCloudProofView } from "../src/data/cloudProofSnapshot";
import { FLOCK_RELAY_SNAPSHOT, getFlockRelayView } from "../src/data/flockRelaySnapshot";
import { createCaptureDraftReceipt, type CaptureDraftReceipt } from "../src/data/captureDraft";
import { advanceCaptureTriageStatus, createCaptureTriageItem, getCaptureTriageView, type CaptureTriageItem } from "../src/data/captureTriage";
import { createEvidenceBundle, serializeEvidenceBundle } from "../src/data/evidenceBundle";
import { C7_C12_CHECKPOINTS, createConsolidatedCycleReceipt } from "../src/data/consolidatedCycleReceipt";
import { getResilienceFreshnessView } from "../src/data/resilienceFreshness";
import { getPromotionReadinessView } from "../src/data/promotionReadiness";
import { acknowledgeDailyMission, advanceDailyMissionFocus, createDailyMissionSession, getDailyMissionView } from "../src/data/dailyMission";
import { advanceFieldBriefFocus, getFieldBriefView, resetFieldBriefSession, reviewFieldBriefItem } from "../src/data/fieldBrief";
import { advanceShiftHandoffFocus, getShiftHandoffView, resetShiftHandoffSession, reviewShiftHandoffItem } from "../src/data/shiftHandoff";
import { advanceResumeCheckpointFocus, getResumeCheckpointView, resetResumeCheckpointSession, reviewResumeCheckpointItem } from "../src/data/resumeCheckpoint";
import { createOperationIntent, type OperationActionId, type OperationIntentReceipt } from "../src/data/operationIntent";
import { PROJECT_COCKPIT_SNAPSHOT, getProjectCockpitView } from "../src/data/projectCockpit";
import { getProjectSnapshotView, type ProjectSnapshot } from "../src/data/projectSnapshot";

type Mode = "Home" | "Build" | "Operate" | "Capture" | "Evidence";
const MODES = ["Home", "Build", "Operate", "Capture", "Evidence"] as const;

const SNAPSHOT: ProjectSnapshot = Object.freeze({
  project: "Werkles",
  sourcePath: "docs/flock/STATE.json",
  sourceSha: "fbfe3f3bf35b6811b32a0efefd79026c9d04affc",
  observedAt: "2026-07-17T18:36:03.000Z",
  truth: "SNAPSHOT_NOT_LIVE",
});

const STARTING_QUEUE: readonly BuildQueueItem[] = Object.freeze([
  createBuildQueueItem({ id: "build-command-board", title: "Review the sandbox command board", area: "Mobile shell", priority: "P1", createdAt: "2026-07-29T14:58:00.000Z" }),
  createBuildQueueItem({ id: "build-receiver-boundary", title: "Document the external Ender receiver boundary", area: "Flock relay", priority: "P1", createdAt: "2026-07-29T14:59:00.000Z" }),
  createBuildQueueItem({ id: "build-capture-contracts", title: "Verify secret-safe local capture", area: "Capture", priority: "P0", createdAt: "2026-07-29T15:00:00.000Z" }),
  createBuildQueueItem({ id: "build-promotion-evidence", title: "Prepare sandbox promotion-gate evidence", area: "Cloud proof", priority: "P2", createdAt: "2026-07-29T15:01:00.000Z" }),
]);

export default function HarveyHome() {
  const [mode, setMode] = useState<Mode>("Home");
  const [queueItems, setQueueItems] = useState<readonly BuildQueueItem[]>(STARTING_QUEUE);
  const [draft, setDraft] = useState("");
  const [captures, setCaptures] = useState<readonly SessionCapture[]>([]);
  const [triageItems, setTriageItems] = useState<readonly CaptureTriageItem[]>([]);
  const [receipt, setReceipt] = useState<CaptureDraftReceipt | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [operationReceipt, setOperationReceipt] = useState<OperationIntentReceipt | null>(null);
  const snapshot = useMemo(() => getProjectSnapshotView(SNAPSHOT, new Date()), []);
  const relay = useMemo(() => getFlockRelayView(FLOCK_RELAY_SNAPSHOT, new Date()), []);
  const cloudProof = useMemo(() => getCloudProofView(CLOUD_PROOF_SNAPSHOT), []);
  const cockpit = useMemo(() => getProjectCockpitView(PROJECT_COCKPIT_SNAPSHOT, new Date()), []);
  const buildQueue = useMemo(() => getBuildQueueView(queueItems), [queueItems]);
  const captureTriage = useMemo(() => getCaptureTriageView(triageItems), [triageItems]);
  const evidenceBundle = useMemo(() => createEvidenceBundle({ sourcePath: "docs/flock/packets/F_DINK_EVIDENCE_BUNDLE_MODEL_20260729_C10_A.md", sourceSha: "595dcef7dbbe3a3c42091e665af284cfb6e0d665", observedAt: "2026-07-29T15:08:02.000Z", createdAt: new Date(), buildIdentity: BUILD_IDENTITY, cockpit, buildQueue, captureTriage, relay }), [buildQueue, captureTriage, cockpit, relay]);
  const evidenceBundleText = useMemo(() => serializeEvidenceBundle(evidenceBundle), [evidenceBundle]);
  const evidenceFreshness = useMemo(() => getResilienceFreshnessView({ subject: "EVIDENCE_BUNDLE", observedAt: evidenceBundle.provenance.observedAt, now: new Date() }), [evidenceBundle]);
  const dailyMissionNow = useMemo(() => evidenceFreshness.checkedAt ? new Date(evidenceFreshness.checkedAt) : new Date(Number.NaN), [evidenceFreshness.checkedAt]);
  const promotionReadiness = useMemo(() => getPromotionReadinessView({ evidenceBundle, buildIdentity: BUILD_IDENTITY, now: dailyMissionNow }), [dailyMissionNow, evidenceBundle]);
  const dailyMission = useMemo(() => getDailyMissionView({ buildQueue, cockpit, evidenceFreshness, promotionReadiness, now: dailyMissionNow }), [buildQueue, cockpit, dailyMissionNow, evidenceFreshness, promotionReadiness]);
  const fieldBrief = useMemo(() => getFieldBriefView({ dailyMission, evidenceFreshness, promotionReadiness, buildIdentity: BUILD_IDENTITY, now: dailyMissionNow }), [dailyMission, dailyMissionNow, evidenceFreshness, promotionReadiness]);
  const [dailyMissionSession, setDailyMissionSession] = useState(() => createDailyMissionSession(dailyMission));
  useEffect(() => setDailyMissionSession(createDailyMissionSession(dailyMission)), [dailyMission]);
  const [fieldBriefSession, setFieldBriefSession] = useState(() => resetFieldBriefSession(fieldBrief));
  useEffect(() => setFieldBriefSession(resetFieldBriefSession(fieldBrief)), [fieldBrief.identityKey]);
  const shiftHandoff = useMemo(() => getShiftHandoffView({ fieldBrief, fieldBriefSession, buildIdentity: BUILD_IDENTITY, now: dailyMissionNow }), [dailyMissionNow, fieldBrief, fieldBriefSession]);
  const [shiftHandoffSession, setShiftHandoffSession] = useState(() => resetShiftHandoffSession(shiftHandoff));
  useEffect(() => setShiftHandoffSession(resetShiftHandoffSession(shiftHandoff)), [shiftHandoff.identityKey]);
  const resumeCheckpoint = useMemo(() => getResumeCheckpointView({ shiftHandoff, shiftHandoffSession, buildIdentity: BUILD_IDENTITY, now: dailyMissionNow }), [dailyMissionNow, shiftHandoff, shiftHandoffSession]);
  const [resumeCheckpointSession, setResumeCheckpointSession] = useState(() => resetResumeCheckpointSession(resumeCheckpoint));
  useEffect(() => setResumeCheckpointSession(resetResumeCheckpointSession(resumeCheckpoint)), [resumeCheckpoint.identityKey]);
  const cycleReceipt = useMemo(() => createConsolidatedCycleReceipt({ sourcePath: "docs/flock/packets/F_DINK_CONSOLIDATED_RECEIPT_MODEL_20260729_C12_B.md", sourceSha: "a56cd9daff46fdbb3477fa38de1dd3e307d00f31", createdAt: new Date(), cycles: C7_C12_CHECKPOINTS }), []);

  const addBuildTask = (title: string, priority: BuildQueuePriority) => {
    setQueueItems((current) => addBuildQueueItem(current, createBuildQueueItem({ id: `build-session-${current.length + 1}`, title, area: "Session queue", priority, createdAt: new Date().toISOString() })));
  };
  const advanceBuildTask = (id: string) => setQueueItems((current) => advanceBuildQueueStatus(current, id));
  const reprioritizeBuildTask = (id: string, priority: BuildQueuePriority) => setQueueItems((current) => reprioritizeBuildQueueItem(current, id, priority));

  const changeDraft = (value: string) => {
    setDraft(value);
    setCaptureError(null);
  };

  const createReceipt = (metadata: CaptureDraftMetadata) => {
    const result = createCaptureDraftReceipt(draft, new Date());
    if (!result.ok) {
      setCaptureError(result.message);
      return;
    }
    const body = draft.trim();
    setCaptures((current) => [{
      id: result.receipt.requestId,
      body,
      time: new Date(result.receipt.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }, ...current]);
    setTriageItems((current) => [createCaptureTriageItem({ receipt: result.receipt, category: metadata.category, priority: metadata.priority }), ...current]);
    setReceipt(result.receipt);
    setDraft("");
    setCaptureError(null);
  };

  const advanceTriage = (triageId: string) => {
    setTriageItems((current) => current.map((item) => item.id === triageId ? advanceCaptureTriageStatus(item) : item));
  };

  const createLocalOperationReceipt = (actionId: OperationActionId) => {
    setOperationReceipt(createOperationIntent({ actionId, sourcePath: SNAPSHOT.sourcePath, sourceSha: SNAPSHOT.sourceSha, now: new Date() }));
  };

  const acknowledgeMission = (missionId: string) => setDailyMissionSession((current) => acknowledgeDailyMission(dailyMission, current, missionId));
  const advanceMissionFocus = () => setDailyMissionSession((current) => advanceDailyMissionFocus(dailyMission, current));
  const reviewBriefItem = (itemId: string) => setFieldBriefSession((current) => reviewFieldBriefItem(fieldBrief, current, itemId));
  const advanceBriefFocus = () => setFieldBriefSession((current) => advanceFieldBriefFocus(fieldBrief, current));
  const reviewHandoffItem = (itemId: string) => setShiftHandoffSession((current) => reviewShiftHandoffItem(shiftHandoff, current, itemId));
  const advanceHandoffFocus = () => setShiftHandoffSession((current) => advanceShiftHandoffFocus(shiftHandoff, current));
  const reviewCheckpointItem = (itemId: string) => setResumeCheckpointSession((current) => reviewResumeCheckpointItem(resumeCheckpoint, current, itemId));
  const advanceCheckpointFocus = () => setResumeCheckpointSession((current) => advanceResumeCheckpointFocus(resumeCheckpoint, current));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.brand}>HARVEY / THINKIT</Text>
            <Text style={styles.title}>Build Werkles anywhere.</Text>
          </View>
          <Text style={styles.snapshotPill}>SNAPSHOT</Text>
        </View>
        <Text style={styles.subtitle}>A phone-first sandbox for moving builds without manufacturing live, saved, delivered, or executed claims.</Text>

        <View accessibilityRole="tablist" style={styles.nav}>
          {MODES.map((item) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === item }} key={item} onPress={() => setMode(item)} style={[styles.navButton, mode === item && styles.navActive]}>
              <Text style={[styles.navLabel, mode === item && styles.navLabelActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {mode === "Home" ? (
          <>
            <DailyMissionCard onAcknowledge={acknowledgeMission} onAdvanceFocus={advanceMissionFocus} session={dailyMissionSession} view={dailyMission} />
            <FieldBriefCard onAdvanceFocus={advanceBriefFocus} onReview={reviewBriefItem} session={fieldBriefSession} view={fieldBrief} />
            <ShiftHandoffCard onAdvanceFocus={advanceHandoffFocus} onReview={reviewHandoffItem} session={shiftHandoffSession} view={shiftHandoff} />
            <ResumeCheckpointCard onAdvanceFocus={advanceCheckpointFocus} onReview={reviewCheckpointItem} session={resumeCheckpointSession} view={resumeCheckpoint} />
            <CommandBoard buildIdentity={BUILD_IDENTITY} cockpit={cockpit} onAddTask={addBuildTask} onAdvanceTask={advanceBuildTask} onReprioritizeTask={reprioritizeBuildTask} queue={buildQueue} snapshot={snapshot} variant="home" />
            <View style={styles.stats}>
              <View style={styles.stat}><Text style={styles.statValue}>{buildQueue.openCount}</Text><Text style={styles.small}>Open moves</Text></View>
              <View style={styles.stat}><Text style={styles.captureCount}>{captures.length}</Text><Text style={styles.small}>Session captures</Text></View>
            </View>
          </>
        ) : null}

        {mode === "Build" ? <CommandBoard buildIdentity={BUILD_IDENTITY} cockpit={cockpit} onAddTask={addBuildTask} onAdvanceTask={advanceBuildTask} onReprioritizeTask={reprioritizeBuildTask} queue={buildQueue} snapshot={snapshot} variant="build" /> : null}
        {mode === "Operate" ? <OperationsHub onClearIntent={() => setOperationReceipt(null)} onCreateIntent={createLocalOperationReceipt} receipt={operationReceipt} sourcePath={SNAPSHOT.sourcePath} sourceSha={SNAPSHOT.sourceSha} /> : null}
        {mode === "Capture" ? <QuickCapture captures={captures} draft={draft} error={captureError} onAdvanceTriage={advanceTriage} onClearReceipt={() => setReceipt(null)} onCreateReceipt={createReceipt} onDraftChange={changeDraft} receipt={receipt} triageItems={triageItems} /> : null}
        {mode === "Evidence" ? <EvidenceHub buildIdentity={BUILD_IDENTITY} cloudProof={cloudProof} cycleReceipt={cycleReceipt} evidenceBundle={evidenceBundle} evidenceBundleText={evidenceBundleText} evidenceFreshness={evidenceFreshness} operationReceipt={operationReceipt} relay={relay} /> : null}

        <Text style={styles.footer}>SANDBOX · BENLEAKWERKLES/HARVEY-MOBILE · NOT CANON</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#07111D" },
  page: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 48 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  flex: { flex: 1 },
  brand: { color: "#52D3FF", fontSize: 12, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: "#F4F7FB", fontSize: 34, lineHeight: 39, fontWeight: "800", marginTop: 8, maxWidth: 310 },
  snapshotPill: { color: "#FFB45D", backgroundColor: "rgba(255,180,93,0.12)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  subtitle: { color: "#8EA0B7", fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 560 },
  nav: { flexDirection: "row", backgroundColor: "#05101A", borderRadius: 16, padding: 5, marginTop: 24, borderWidth: 1, borderColor: "#20344C" },
  navButton: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 12 },
  navActive: { backgroundColor: "#122338" },
  navLabel: { color: "#8EA0B7", fontSize: 11, fontWeight: "700" },
  navLabelActive: { color: "#F4F7FB" },
  stats: { flexDirection: "row", gap: 12, marginTop: 12 },
  stat: { flex: 1, backgroundColor: "#0D1A2A", borderRadius: 18, padding: 17, borderWidth: 1, borderColor: "#20344C" },
  statValue: { color: "#57E39B", fontSize: 26, fontWeight: "800" },
  captureCount: { color: "#52D3FF", fontSize: 26, fontWeight: "800" },
  small: { color: "#8EA0B7", fontSize: 12, marginTop: 5 },
  footer: { color: "#8EA0B7", opacity: 0.55, fontSize: 9, letterSpacing: 1.25, textAlign: "center", marginTop: 34 },
});
