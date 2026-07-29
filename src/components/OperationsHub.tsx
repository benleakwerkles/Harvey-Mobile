import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  HARVEY_MOBILE_REPOSITORY,
  OPERATION_ACTIONS,
  type OperationActionId,
  type OperationIntentReceipt,
} from "../data/operationIntent";

type OperationsHubProps = Readonly<{
  sourcePath: string;
  sourceSha: string;
  receipt: OperationIntentReceipt | null;
  onCreateIntent: (actionId: OperationActionId) => void;
  onClearIntent: () => void;
}>;

export function OperationsHub({
  sourcePath,
  sourceSha,
  receipt,
  onCreateIntent,
  onClearIntent,
}: OperationsHubProps) {
  const [selectedAction, setSelectedAction] = useState<OperationActionId | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const selection = OPERATION_ACTIONS.find((action) => action.id === selectedAction) ?? null;
  const disabled = selection === null || !acknowledged;

  const chooseAction = (actionId: OperationActionId) => {
    setSelectedAction(actionId);
    setAcknowledged(false);
  };

  return (
    <>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>OPERATIONS · SESSION ONLY</Text>
        <Text style={styles.title}>Prepare an action without sending it</Text>
        <Text style={styles.support}>
          This records intent in this app session only. It does not run, send, approve, merge, or deploy anything.
        </Text>
      </View>

      <View accessibilityRole="radiogroup" style={styles.card}>
        <Text style={styles.step}>01 · CHOOSE A SANDBOX ACTION</Text>
        {OPERATION_ACTIONS.map((action) => (
          <Pressable
            accessibilityHint="Selects a local operation plan. Nothing runs or leaves this device session."
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedAction === action.id }}
            key={action.id}
            onPress={() => chooseAction(action.id)}
            style={[styles.option, selectedAction === action.id && styles.optionSelected]}
          >
            <Text style={styles.optionTitle}>{action.title}</Text>
            <Text style={styles.optionId}>{action.id}</Text>
            <Text style={styles.optionPurpose}>{action.purpose}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.step}>02 · REVIEW PREFLIGHT</Text>
        <Text style={styles.label}>REPOSITORY</Text>
        <Text selectable style={styles.value}>{HARVEY_MOBILE_REPOSITORY}</Text>
        <Text style={styles.label}>SOURCE PATH</Text>
        <Text selectable style={styles.value}>{sourcePath}</Text>
        <Text style={styles.label}>FULL SOURCE SHA</Text>
        <Text selectable style={styles.sha}>{sourceSha}</Text>
        <Text style={styles.label}>EXECUTION OWNER</Text>
        <Text style={styles.value}>CODEX_ROOT</Text>
        <Text style={styles.label}>APPROVAL</Text>
        <Text style={styles.pending}>PENDING_HUMAN_GATE</Text>
        <Text style={styles.label}>SELECTED GATE</Text>
        <Text style={styles.gate}>{selection?.humanGate ?? "Choose an action to reveal its human gate."}</Text>

        <Pressable
          accessibilityHint="Required before a local intent receipt can be created. This does not approve or execute the action."
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acknowledged }}
          onPress={() => setAcknowledged((current) => !current)}
          style={[styles.acknowledge, acknowledged && styles.acknowledged]}
        >
          <Text style={styles.check}>{acknowledged ? "☑" : "☐"}</Text>
          <Text style={styles.acknowledgeCopy}>I understand this creates a local plan only and sends nothing.</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.step}>03 · CREATE LOCAL INTENT RECEIPT</Text>
        <Pressable
          accessibilityHint="Creates session-only proof of planned intent. It cannot dispatch, run, approve, merge, or deploy."
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => selection && onCreateIntent(selection.id)}
          style={[styles.action, disabled && styles.disabled]}
        >
          <Text style={styles.actionText}>Create local intent receipt</Text>
        </Pressable>
        <Text style={styles.noDispatch}>NOT DISPATCHED · NOT EXECUTED · NOT VERIFIED</Text>
      </View>

      {receipt ? (
        <View accessibilityLabel="Operation receipt local only. Planned. Request not sent. Not run. Not verified." style={styles.receipt}>
          <Text style={styles.receiptTitle}>OPERATION RECEIPT · LOCAL ONLY</Text>
          <Text style={styles.planned}>PLANNED_LOCAL</Text>
          <Text style={styles.label}>ACTION</Text>
          <Text style={styles.value}>{receipt.actionTitle}</Text>
          <Text selectable style={styles.optionId}>{receipt.actionId}</Text>
          <Text style={styles.label}>INTENT / IDEMPOTENCY KEY</Text>
          <Text selectable style={styles.key}>{receipt.idempotencyKey}</Text>
          <Text style={styles.label}>TRUTH</Text>
          <Text style={styles.pending}>{receipt.truth}</Text>
          <Text style={styles.receiptBoundary}>
            Transport NONE · request not sent · execution not proven · external Ender {receipt.externalEnderState}
          </Text>
          <Pressable accessibilityRole="button" onPress={onClearIntent} style={styles.clear}>
            <Text style={styles.clearText}>Clear local receipt</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 28, marginBottom: 13 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#F4F7FB", fontSize: 24, lineHeight: 29, fontWeight: "800", marginTop: 7 },
  support: { color: "#8EA0B7", fontSize: 13, lineHeight: 20, marginTop: 9 },
  card: { backgroundColor: "#0D1A2A", borderColor: "#20344C", borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  step: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginBottom: 12 },
  option: { minHeight: 48, borderColor: "#20344C", borderWidth: 1, borderRadius: 15, padding: 14, marginTop: 9 },
  optionSelected: { borderColor: "#52D3FF", backgroundColor: "#122338" },
  optionTitle: { color: "#F4F7FB", fontSize: 15, fontWeight: "800" },
  optionId: { color: "#52D3FF", fontSize: 10, lineHeight: 16, marginTop: 5 },
  optionPurpose: { color: "#8EA0B7", fontSize: 12, lineHeight: 18, marginTop: 6 },
  label: { color: "#8EA0B7", fontSize: 9, fontWeight: "900", letterSpacing: 1.0, marginTop: 12 },
  value: { color: "#F4F7FB", fontSize: 12, lineHeight: 18, marginTop: 4 },
  sha: { color: "#52D3FF", fontSize: 10, lineHeight: 16, marginTop: 4 },
  pending: { color: "#FFB45D", fontSize: 10, fontWeight: "900", lineHeight: 16, marginTop: 4 },
  gate: { color: "#F4F7FB", fontSize: 12, lineHeight: 18, marginTop: 4 },
  acknowledge: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, borderColor: "#20344C", borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 16 },
  acknowledged: { borderColor: "#52D3FF" },
  check: { color: "#52D3FF", fontSize: 19 },
  acknowledgeCopy: { color: "#F4F7FB", fontSize: 12, lineHeight: 18, flex: 1 },
  action: { minHeight: 48, justifyContent: "center", alignItems: "center", borderRadius: 14, backgroundColor: "#52D3FF", paddingHorizontal: 16 },
  disabled: { opacity: 0.35 },
  actionText: { color: "#05101A", fontSize: 14, fontWeight: "900" },
  noDispatch: { color: "#FFB45D", fontSize: 10, lineHeight: 16, fontWeight: "900", textAlign: "center", marginTop: 12 },
  receipt: { backgroundColor: "#122338", borderColor: "#52D3FF", borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  receiptTitle: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.0 },
  planned: { color: "#FFB45D", fontSize: 12, fontWeight: "900", marginTop: 10 },
  key: { color: "#52D3FF", fontSize: 9, lineHeight: 15, marginTop: 4 },
  receiptBoundary: { color: "#8EA0B7", fontSize: 11, lineHeight: 17, marginTop: 13 },
  clear: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center", borderColor: "#20344C", borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, marginTop: 14 },
  clearText: { color: "#F4F7FB", fontSize: 11, fontWeight: "800" },
});
