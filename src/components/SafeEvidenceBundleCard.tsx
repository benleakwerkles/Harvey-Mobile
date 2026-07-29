import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { EvidenceBundle } from "../data/evidenceBundle";

type Props = Readonly<{ bundle: EvidenceBundle; serialized: string }>;
type PreviewState = "IDLE" | "READY" | "ERROR";

function MetadataRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <View accessible accessibilityLabel={label + ": " + value} style={styles.row}>
      <Text selectable style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>{value}</Text>
    </View>
  );
}

export function SafeEvidenceBundleCard({ bundle, serialized }: Props) {
  const [preview, setPreview] = useState<PreviewState>("IDLE");

  function prepareSafePreview() {
    try {
      if (serialized.length === 0) throw new Error("The redacted bundle is empty.");
      setPreview("READY");
    } catch {
      setPreview("ERROR");
    }
  }

  return (
    <View accessible={false} style={styles.card} testID="safe-evidence-bundle-card">
      <Text selectable style={styles.eyebrow}>SAFE EVIDENCE BUNDLE</Text>
      <Text accessibilityRole="header" selectable style={styles.title}>Redacted proof summary</Text>
      <Text selectable style={styles.intro}>Metadata only. Raw captures, credentials, secrets, and operation bodies are excluded.</Text>

      <View style={styles.provenBox}>
        <Text selectable style={styles.proven}>PROVEN</Text>
        <Text selectable style={styles.stateTitle}>Immutable source checkpoint</Text>
        <Text selectable style={styles.value}>{bundle.provenance.sourceSha}</Text>
      </View>
      <View style={styles.unprovenBox}>
        <Text selectable style={styles.unproven}>UNPROVEN</Text>
        <Text selectable style={styles.stateTitle}>Live and promoted state</Text>
        <Text selectable style={styles.copy}>Current availability, deployment, external delivery, execution, merge, and canon promotion are not established.</Text>
      </View>

      <MetadataRow label="BUNDLE ID" value={bundle.bundleId} />
      <MetadataRow label="CREATED" value={bundle.createdAt} />
      <MetadataRow label="BUILD QUEUE" value={String(bundle.summaries.buildQueue.totalCount) + " metadata items"} />
      <MetadataRow label="CAPTURE TRIAGE" value={String(bundle.summaries.captureTriage.totalCount) + " metadata items"} />
      <MetadataRow label="RELAY" value={bundle.summaries.relay.truth} />

      <Text selectable style={styles.boundary}>SESSION ONLY · NOT SAVED OR SENT</Text>

      {preview === "IDLE" ? (
        <Pressable
          accessibilityHint="Builds a redacted selectable preview in this session. Does not save or send."
          accessibilityLabel="Prepare safe copy"
          accessibilityRole="button"
          onPress={prepareSafePreview}
          style={styles.action}
        >
          <Text selectable style={styles.actionText}>Prepare safe copy</Text>
        </Pressable>
      ) : null}

      {preview === "READY" ? (
        <>
          <Text accessibilityLiveRegion="polite" selectable style={styles.success}>Safe redacted text ready. Long press the selectable text to copy. Nothing was saved or sent.</Text>
          <View style={styles.preview}><Text selectable style={styles.previewText}>{serialized}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => setPreview("IDLE")} style={styles.secondary}>
            <Text selectable style={styles.secondaryText}>Clear preview</Text>
          </Pressable>
        </>
      ) : null}

      {preview === "ERROR" ? (
        <>
          <Text accessibilityLiveRegion="assertive" accessibilityRole="alert" selectable style={styles.error}>Safe evidence text was not prepared. Nothing was saved or sent.</Text>
          <Pressable accessibilityRole="button" onPress={prepareSafePreview} style={styles.secondary}><Text selectable style={styles.secondaryText}>Retry</Text></Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", minWidth: 0, backgroundColor: "#0D1A2A", borderColor: "#20344C", borderRadius: 20, borderWidth: 1, marginTop: 12, padding: 16 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#F4F7FB", fontSize: 21, fontWeight: "800", marginTop: 5 },
  intro: { color: "#AFC0D4", fontSize: 12, lineHeight: 18, marginTop: 8 },
  provenBox: { backgroundColor: "#142F24", borderColor: "#397857", borderRadius: 14, borderWidth: 1, marginTop: 10, padding: 12 },
  unprovenBox: { backgroundColor: "#342A1D", borderColor: "#9B7438", borderRadius: 14, borderWidth: 1, marginTop: 10, padding: 12 },
  proven: { color: "#8EE4B5", fontSize: 10, fontWeight: "900" },
  unproven: { color: "#FFD38C", fontSize: 10, fontWeight: "900" },
  stateTitle: { color: "#F4F7FB", fontSize: 14, fontWeight: "800", marginTop: 5 },
  copy: { color: "#C4D0DF", fontSize: 12, lineHeight: 18, marginTop: 4 },
  row: { borderBottomColor: "#20344C", borderBottomWidth: StyleSheet.hairlineWidth, minWidth: 0, paddingVertical: 10 },
  label: { color: "#8EA0B7", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  value: { color: "#52D3FF", fontSize: 10, lineHeight: 16, marginTop: 4 },
  boundary: { color: "#FFCA78", fontSize: 10, fontWeight: "900", marginTop: 14 },
  action: { alignItems: "center", backgroundColor: "#52D3FF", borderRadius: 12, justifyContent: "center", marginTop: 14, minHeight: 48, padding: 12 },
  actionText: { color: "#05101A", fontSize: 13, fontWeight: "900" },
  secondary: { alignItems: "center", borderColor: "#405875", borderRadius: 12, borderWidth: 1, justifyContent: "center", marginTop: 10, minHeight: 48, padding: 12 },
  secondaryText: { color: "#F4F7FB", fontSize: 12, fontWeight: "800" },
  success: { color: "#8EE4B5", fontSize: 12, lineHeight: 18, marginTop: 14 },
  preview: { backgroundColor: "#07111D", borderColor: "#405875", borderRadius: 13, borderWidth: 1, marginTop: 9, minWidth: 0, padding: 12 },
  previewText: { color: "#F4F7FB", fontSize: 10, lineHeight: 16 },
  error: { color: "#FFB7AD", fontSize: 12, lineHeight: 18, marginTop: 14 },
});
