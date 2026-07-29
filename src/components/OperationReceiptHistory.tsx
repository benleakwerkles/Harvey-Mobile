import { StyleSheet, Text, View } from "react-native";

import type { OperationIntentReceipt } from "../data/operationIntent";

type OperationReceiptHistoryProps = Readonly<{
  receipt: OperationIntentReceipt | null;
}>;

const UNPROVEN_STAGES = Object.freeze([
  Object.freeze({ stage: "REQUESTED", copy: "No external request sent." }),
  Object.freeze({ stage: "EXECUTED", copy: "No execution proven." }),
  Object.freeze({ stage: "VERIFIED", copy: "No verification receipt bound." }),
] as const);

export function OperationReceiptHistory({ receipt }: OperationReceiptHistoryProps) {
  return (
    <View style={styles.shell}>
      <Text style={styles.eyebrow}>OPERATION EVIDENCE</Text>
      <Text style={styles.title}>Operation receipt · local only</Text>
      <Text style={styles.ender}>EXTERNAL ENDER RECEIVER · BLOCKED_UNBOUND</Text>

      {receipt ? (
        <>
          <View accessibilityLabel="Planned local stage recorded. Request not sent. Not executed. Not verified." style={styles.stageActive}>
            <Text style={styles.stageActiveLabel}>PLANNED_LOCAL</Text>
            <Text style={styles.stageCopy}>Session-only intent recorded. This is not execution evidence.</Text>
          </View>
          {UNPROVEN_STAGES.map((item) => (
            <View accessibilityLabel={`${item.stage}. ${item.copy}`} key={item.stage} style={styles.stageInactive}>
              <Text style={styles.stageInactiveLabel}>{item.stage} · UNPROVEN</Text>
              <Text style={styles.stageCopy}>{item.copy}</Text>
            </View>
          ))}

          <View style={styles.facts}>
            <Text style={styles.label}>REPOSITORY</Text>
            <Text selectable style={styles.value}>{receipt.repository}</Text>
            <Text style={styles.label}>SOURCE PATH</Text>
            <Text selectable style={styles.value}>{receipt.sourcePath}</Text>
            <Text style={styles.label}>FULL SOURCE SHA</Text>
            <Text selectable style={styles.sha}>{receipt.sourceSha}</Text>
            <Text style={styles.label}>INTENT ID</Text>
            <Text selectable style={styles.sha}>{receipt.intentId}</Text>
            <Text style={styles.label}>CREATED</Text>
            <Text selectable style={styles.value}>{receipt.createdAt}</Text>
            <Text style={styles.label}>APPROVAL / OWNER / TRANSPORT</Text>
            <Text style={styles.pending}>{receipt.approvalState} · {receipt.executionOwner} · {receipt.transport}</Text>
          </View>
        </>
      ) : (
        <View accessibilityLabel="No local operation intent exists in this session." style={styles.empty}>
          <Text style={styles.emptyTitle}>NO LOCAL INTENT THIS SESSION</Text>
          <Text style={styles.stageCopy}>
            Planned, requested, executed, and verified all remain unproven. Prepare an intent in Operations to record the first local-only stage.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { marginTop: 20 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: "#F4F7FB", fontSize: 24, fontWeight: "800", marginTop: 6 },
  ender: { color: "#FFB45D", fontSize: 10, fontWeight: "900", lineHeight: 16, marginTop: 12 },
  stageActive: { backgroundColor: "#122338", borderColor: "#52D3FF", borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 },
  stageInactive: { backgroundColor: "#0D1A2A", borderColor: "#20344C", borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 9 },
  stageActiveLabel: { color: "#FFB45D", fontSize: 11, fontWeight: "900" },
  stageInactiveLabel: { color: "#8EA0B7", fontSize: 11, fontWeight: "900" },
  stageCopy: { color: "#8EA0B7", fontSize: 12, lineHeight: 18, marginTop: 6 },
  facts: { backgroundColor: "#05101A", borderColor: "#20344C", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 12 },
  label: { color: "#8EA0B7", fontSize: 9, fontWeight: "900", letterSpacing: 1.0, marginTop: 9 },
  value: { color: "#F4F7FB", fontSize: 11, lineHeight: 17, marginTop: 4 },
  sha: { color: "#52D3FF", fontSize: 9, lineHeight: 15, marginTop: 4 },
  pending: { color: "#FFB45D", fontSize: 10, lineHeight: 16, fontWeight: "900", marginTop: 4 },
  empty: { backgroundColor: "#0D1A2A", borderColor: "#20344C", borderWidth: 1, borderStyle: "dashed", borderRadius: 18, padding: 18, marginTop: 14 },
  emptyTitle: { color: "#FFB45D", fontSize: 11, fontWeight: "900" },
});
