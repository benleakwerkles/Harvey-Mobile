import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DailyMissionBlockReasonCode, DailyMissionItem, DailyMissionLane, DailyMissionSession, DailyMissionView } from "../data/dailyMission";

const BLOCK_REASON_COPY: Readonly<Record<DailyMissionBlockReasonCode, string>> = Object.freeze({
  INVALID_CHECK_TIME: "Mission evaluation time is invalid.",
  INPUT_SCHEMA_INVALID: "One or more mission inputs failed schema validation.",
  INPUT_EFFECT_CLAIM: "An input claims a prohibited external effect.",
  DUPLICATE_SOURCE_ID: "More than one input uses the same source identifier.",
  EMPTY_BUILD_QUEUE: "No build-queue item can supply a TODAY mission.",
  STALE_EVIDENCE: "Evidence is stale. No current mission success is claimed.",
  FUTURE_EVIDENCE: "Evidence is dated after the injected evaluation time.",
  INVALID_EVIDENCE: "Evidence could not be validated.",
  UNAVAILABLE_EVIDENCE: "Evidence observation is unavailable.",
  PROMOTION_UNBOUND: "Promotion readiness is not bound to an immutable current build.",
});

function MetadataRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.metadataRow}><Text selectable style={styles.metadataLabel}>{label}</Text><Text selectable style={styles.metadataValue}>{value}</Text></View>;
}

function MissionItemCard({ acknowledged, focused, item, onAcknowledge }: Readonly<{ acknowledged: boolean; focused: boolean; item: DailyMissionItem; onAcknowledge: (missionId: string) => void }>) {
  return (
    <View accessible={false} style={[styles.item, focused && styles.itemFocused]} testID={`daily-mission-${item.id}`}>
      <View style={styles.itemHeader}><Text selectable style={styles.rank}>{item.lane} · {String(item.rank).padStart(2, "0")}</Text><Text selectable style={styles.reasonCode}>{item.reasonCode}</Text></View>
      <Text accessibilityRole="header" selectable style={styles.itemTitle}>{item.title}</Text>
      <View accessible accessibilityLabel={acknowledged ? "SESSION ACKNOWLEDGED. NOT EXECUTED." : "NOT ACKNOWLEDGED. NOT EXECUTED."} style={styles.itemState}>
        <Text selectable style={styles.itemStateText}>{acknowledged ? "SESSION ACKNOWLEDGED · NOT EXECUTED" : "NOT ACKNOWLEDGED · NOT EXECUTED"}</Text>
      </View>
      {focused ? <View accessible accessibilityLabel="SESSION FOCUS. NOT EXECUTION." style={styles.focusState}><Text selectable style={styles.focusStateText}>SESSION FOCUS · NOT EXECUTION</Text></View> : null}
      <View style={styles.metadata}>
        <MetadataRow label="SOURCE" value={`${item.sourceKind} · ${item.sourceId}`} />
        <MetadataRow label="MISSION ID" value={item.id} />
        <MetadataRow label="TRUTH" value={item.truth} />
        <MetadataRow label="PERSISTENCE / TRANSPORT" value={`${item.persistence} · ${item.transport}`} />
      </View>
      <Pressable accessibilityHint="Records session acknowledgement only. It does not execute work, change the queue, save, or send." accessibilityLabel={`Acknowledge advisory item ${item.id}`} accessibilityRole="button" accessibilityState={{ disabled: acknowledged, selected: acknowledged }} disabled={acknowledged} hitSlop={4} onPress={() => onAcknowledge(item.id)} style={({ pressed }) => [styles.acknowledgeAction, acknowledged && styles.actionDisabled, pressed && !acknowledged && styles.pressed]}>
        <Text selectable style={styles.actionText}>{acknowledged ? "Acknowledged in this session" : "Acknowledge advisory item"}</Text>
      </Pressable>
    </View>
  );
}

function LaneSection({ acknowledgedMissionIds, focusedMissionId, items, lane, onAcknowledge }: Readonly<{ acknowledgedMissionIds: readonly string[]; focusedMissionId: string | null; items: readonly DailyMissionItem[]; lane: DailyMissionLane; onAcknowledge: (missionId: string) => void }>) {
  return (
    <View accessible={false} style={styles.lane} testID={`daily-mission-lane-${lane.toLowerCase()}`}>
      <Text accessibilityRole="header" selectable style={styles.laneTitle}>{lane}</Text>
      {items.length === 0 ? <View accessible accessibilityLabel={`${lane}: no advisory items`} style={styles.emptyLane}><Text selectable style={styles.emptyLaneText}>NO {lane} ADVISORY ITEMS</Text></View> : items.map((item) => <MissionItemCard acknowledged={acknowledgedMissionIds.includes(item.id)} focused={focusedMissionId === item.id} item={item} key={item.id} onAcknowledge={onAcknowledge} />)}
    </View>
  );
}

export function DailyMissionCard({ session, view, onAcknowledge, onAdvanceFocus }: Readonly<{ session: DailyMissionSession; view: DailyMissionView; onAcknowledge: (missionId: string) => void; onAdvanceFocus: () => void }>) {
  const blocked = view.state === "BLOCKED";
  const noItems = view.allItems.length === 0;
  return (
    <View accessible={false} style={styles.card} testID="daily-mission-card">
      <Text selectable style={styles.eyebrow}>DAILY MISSION</Text>
      <Text accessibilityRole="header" selectable style={styles.title}>Today’s advisory path</Text>
      <View accessible accessibilityLabel={`Daily mission state: ${blocked ? "BLOCKED. ADVISORY ONLY." : "READY. ADVISORY ONLY."} ${view.truth}`} accessibilityLiveRegion="polite" style={[styles.summary, blocked ? styles.summaryBlocked : styles.summaryReady]}>
        <Text selectable style={[styles.summaryState, blocked ? styles.summaryStateBlocked : styles.summaryStateReady]}>{blocked ? "BLOCKED · ADVISORY ONLY" : "READY · ADVISORY ONLY"}</Text>
        <Text selectable style={styles.summaryTruth}>{view.truth} · LIVE FALSE</Text>
        <Text selectable style={styles.summaryTime}>CREATED {view.createdAt ?? "UNAVAILABLE"}</Text>
      </View>
      <View accessible accessibilityLabel="HUMAN GATE REQUIRED. Daily mission guidance is not approval or authorization." style={styles.humanGate}><Text selectable style={styles.humanGateTitle}>HUMAN GATE REQUIRED</Text><Text selectable style={styles.humanGateCopy}>Daily mission guidance is not approval or authorization.</Text></View>
      {view.blockReasonCodes.length > 0 ? <View style={styles.blockReasons}><Text accessibilityRole="header" selectable style={styles.sectionTitle}>BLOCKED REASONS</Text>{view.blockReasonCodes.map((code, index) => <View accessible accessibilityLabel={`Blocked reason ${index + 1}, ${code}: ${BLOCK_REASON_COPY[code]}`} key={code} style={styles.blockReason}><Text selectable style={styles.blockCode}>{String(index + 1).padStart(2, "0")} · {code}</Text><Text selectable style={styles.blockCopy}>{BLOCK_REASON_COPY[code]}</Text></View>)}</View> : null}
      {noItems ? <View accessible accessibilityLabel="NO DAILY MISSION ITEMS. No work was executed." style={styles.empty}><Text selectable style={styles.emptyTitle}>NO DAILY MISSION ITEMS</Text><Text selectable style={styles.emptyCopy}>The canonical view supplied no advisory item. No work was executed.</Text></View> : <>
        <LaneSection acknowledgedMissionIds={session.acknowledgedMissionIds} focusedMissionId={session.focusedMissionId} items={view.today} lane="TODAY" onAcknowledge={onAcknowledge} />
        <LaneSection acknowledgedMissionIds={session.acknowledgedMissionIds} focusedMissionId={session.focusedMissionId} items={view.next} lane="NEXT" onAcknowledge={onAcknowledge} />
        <LaneSection acknowledgedMissionIds={session.acknowledgedMissionIds} focusedMissionId={session.focusedMissionId} items={view.watch} lane="WATCH" onAcknowledge={onAcknowledge} />
        <Pressable accessibilityHint="Moves session focus to the next advisory item. It does not execute or change work." accessibilityLabel="Focus next advisory item" accessibilityRole="button" accessibilityState={{ disabled: noItems }} disabled={noItems} hitSlop={4} onPress={onAdvanceFocus} style={({ pressed }) => [styles.focusAction, pressed && styles.pressed]}><Text selectable style={styles.actionText}>Focus next advisory item</Text></Pressable>
      </>}
      <View style={styles.sessionTruth}><MetadataRow label="SESSION TRUTH" value={session.truth} /><MetadataRow label="PERSISTENCE / TRANSPORT" value={`${session.persistence} · ${session.transport}`} /><MetadataRow label="FOCUSED MISSION" value={session.focusedMissionId ?? "NONE"} /></View>
      <Text selectable style={styles.boundary}>No work was executed, saved, sent, approved, merged, deployed, delivered, hosted, or promoted to canon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", minWidth: 0, backgroundColor: "#0D1A2A", borderColor: "#20344C", borderRadius: 20, borderWidth: 1, marginTop: 20, padding: 16 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#F4F7FB", fontSize: 22, fontWeight: "800", lineHeight: 29, marginTop: 5 },
  summary: { borderRadius: 14, borderWidth: 1, marginTop: 14, padding: 12 }, summaryReady: { backgroundColor: "#142F24", borderColor: "#397857" }, summaryBlocked: { backgroundColor: "#342320", borderColor: "#935C52" },
  summaryState: { fontSize: 11, fontWeight: "900", letterSpacing: 0.7 }, summaryStateReady: { color: "#8EE4B5" }, summaryStateBlocked: { color: "#FFB7AD" }, summaryTruth: { color: "#C4D0DF", fontSize: 10, lineHeight: 16, marginTop: 6 }, summaryTime: { color: "#8EA0B7", fontSize: 9, lineHeight: 15, marginTop: 5 },
  humanGate: { backgroundColor: "#271F32", borderColor: "#765A91", borderRadius: 14, borderWidth: 1, marginTop: 10, padding: 12 }, humanGateTitle: { color: "#D9B8FA", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 }, humanGateCopy: { color: "#F4F7FB", fontSize: 12, lineHeight: 18, marginTop: 5 },
  sectionTitle: { color: "#D9E4F2", fontSize: 11, fontWeight: "900", letterSpacing: 0.8, marginTop: 18 }, blockReasons: { width: "100%", minWidth: 0 }, blockReason: { backgroundColor: "#342320", borderColor: "#935C52", borderRadius: 13, borderWidth: 1, marginTop: 8, padding: 11 }, blockCode: { color: "#FFB7AD", fontSize: 9, fontWeight: "900", lineHeight: 15 }, blockCopy: { color: "#F4F7FB", fontSize: 11, lineHeight: 17, marginTop: 5 },
  empty: { backgroundColor: "#172232", borderColor: "#46566D", borderRadius: 14, borderStyle: "dashed", borderWidth: 1, marginTop: 14, padding: 12 }, emptyTitle: { color: "#D9E4F2", fontSize: 11, fontWeight: "900" }, emptyCopy: { color: "#AFC0D4", fontSize: 11, lineHeight: 17, marginTop: 5 },
  lane: { width: "100%", minWidth: 0, marginTop: 18 }, laneTitle: { color: "#52D3FF", fontSize: 12, fontWeight: "900", letterSpacing: 1 }, emptyLane: { backgroundColor: "#172232", borderColor: "#46566D", borderRadius: 12, borderStyle: "dashed", borderWidth: 1, marginTop: 8, padding: 11 }, emptyLaneText: { color: "#AFC0D4", fontSize: 10, fontWeight: "800" },
  item: { width: "100%", minWidth: 0, backgroundColor: "#07111D", borderColor: "#405875", borderRadius: 14, borderWidth: 1, marginTop: 8, padding: 12 }, itemFocused: { borderColor: "#D9B8FA", borderWidth: 2 }, itemHeader: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }, rank: { color: "#8EA0B7", fontSize: 9, fontWeight: "900" }, reasonCode: { color: "#52D3FF", fontSize: 9, fontWeight: "900", lineHeight: 15 }, itemTitle: { color: "#F4F7FB", fontSize: 15, fontWeight: "800", lineHeight: 21, marginTop: 8 },
  itemState: { backgroundColor: "#172232", borderRadius: 999, marginTop: 10, paddingHorizontal: 9, paddingVertical: 6 }, itemStateText: { color: "#D9E4F2", fontSize: 9, fontWeight: "900" }, focusState: { backgroundColor: "#271F32", borderRadius: 999, marginTop: 6, paddingHorizontal: 9, paddingVertical: 6 }, focusStateText: { color: "#D9B8FA", fontSize: 9, fontWeight: "900" }, metadata: { minWidth: 0, marginTop: 4 }, metadataRow: { minWidth: 0, borderBottomColor: "#20344C", borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 }, metadataLabel: { color: "#8EA0B7", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, metadataValue: { color: "#52D3FF", fontSize: 10, lineHeight: 16, marginTop: 3 },
  acknowledgeAction: { alignItems: "center", borderColor: "#405875", borderRadius: 12, borderWidth: 1, justifyContent: "center", marginTop: 10, minHeight: 48, paddingHorizontal: 12, paddingVertical: 11 }, focusAction: { alignItems: "center", backgroundColor: "#271F32", borderColor: "#765A91", borderRadius: 12, borderWidth: 1, justifyContent: "center", marginTop: 14, minHeight: 48, paddingHorizontal: 12, paddingVertical: 11 }, actionDisabled: { opacity: 0.5 }, pressed: { opacity: 0.76 }, actionText: { color: "#F4F7FB", fontSize: 12, fontWeight: "800", textAlign: "center" },
  sessionTruth: { minWidth: 0, backgroundColor: "#122338", borderColor: "#405875", borderRadius: 14, borderWidth: 1, marginTop: 14, paddingHorizontal: 12 }, boundary: { color: "#AFC0D4", fontSize: 11, lineHeight: 17, marginTop: 14, textAlign: "center" },
});
