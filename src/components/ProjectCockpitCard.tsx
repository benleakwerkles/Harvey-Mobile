import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import type { ProjectCockpitView } from "../data/projectCockpit";

type ProjectCockpitCardProps = Readonly<{
  view: ProjectCockpitView;
}>;

export function ProjectCockpitCard({ view }: ProjectCockpitCardProps) {
  const [sourceError, setSourceError] = useState(false);
  const packetUrl = `https://github.com/benleakwerkles/Harvey-Mobile/blob/${view.sourceSha}/${view.sourcePath}`;

  const reviewEvidence = async () => {
    setSourceError(false);
    try {
      if (!(await Linking.canOpenURL(packetUrl))) throw new Error("Unsupported packet URL");
      await Linking.openURL(packetUrl);
    } catch {
      setSourceError(true);
    }
  };

  return (
    <View accessibilityLabel="Harvey Mobile project cockpit. Checked-in evidence, not live." style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text selectable style={styles.eyebrow}>PROJECT COCKPIT</Text>
          <Text accessibilityRole="header" selectable style={styles.title}>Highest-value next move</Text>
        </View>
        <View
          accessible
          accessibilityLabel={`Evidence freshness: ${view.freshness}`}
          accessibilityLiveRegion="polite"
          style={styles.badge}
        >
          <Text selectable style={styles.badgeText}>{view.freshness}</Text>
        </View>
      </View>

      <View accessible accessibilityLabel={`Rank one recommendation: ${view.highestValueAction.label}`} style={styles.action}>
        <Text selectable style={styles.actionLabel}>RANK 01 · SCORE {view.highestValueAction.score}</Text>
        <Text selectable style={styles.actionTitle}>{view.highestValueAction.label}</Text>
        <Text selectable style={styles.actionMeta}>{view.highestValueAction.readiness.replaceAll("_", " ")} · PLANNED LOCAL · TRANSPORT NONE</Text>
      </View>

      <View style={styles.provenance}>
        <Text accessibilityRole="header" selectable style={styles.sectionTitle}>IMMUTABLE PROVENANCE</Text>
        <Text selectable style={styles.factLabel}>SOURCE</Text>
        <Text selectable style={styles.factValue}>{view.sourcePath}</Text>
        <Text selectable style={styles.factLabel}>COMMIT</Text>
        <Text selectable style={styles.sha}>{view.sourceSha}</Text>
        <Text selectable style={styles.factLabel}>OBSERVED</Text>
        <Text selectable style={styles.factValue}>{view.observedAt}</Text>
      </View>

      <Pressable
        accessibilityHint="Opens immutable GitHub evidence. It does not execute, deliver, merge, deploy, or promote anything."
        accessibilityLabel="Review immutable project cockpit evidence"
        accessibilityRole="button"
        onPress={reviewEvidence}
        style={({ pressed }) => [styles.reviewButton, pressed && styles.reviewButtonPressed]}
      >
        <Text style={styles.reviewButtonText}>Review immutable evidence</Text>
      </Pressable>

      {sourceError ? (
        <Text accessibilityLiveRegion="assertive" selectable style={styles.error}>Evidence could not be opened. The recommendation remains local and not executed.</Text>
      ) : null}

      <View style={styles.boundaries}>
        {["No live connection", "No external delivery", "No canon promotion", "No deployment"].map((label) => (
          <Text accessible accessibilityLabel={label} key={label} selectable style={styles.boundary}>✓ {label}</Text>
        ))}
      </View>
      <Text selectable style={styles.footer}>Checked-in evidence only. Ranking is deterministic and input-order independent; all effect flags remain false.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", backgroundColor: "#101C2D", borderColor: "#2E5E70", borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 12 },
  header: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  heading: { flexGrow: 1, flexShrink: 1, minWidth: 150 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: "#F4F7FB", fontSize: 21, lineHeight: 27, fontWeight: "800", marginTop: 5 },
  badge: { backgroundColor: "#20384B", borderColor: "#69A7D0", borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  badgeText: { color: "#DDF3FF", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  action: { backgroundColor: "#17263A", borderRadius: 14, padding: 14, marginTop: 14 },
  actionLabel: { color: "#57E39B", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  actionTitle: { color: "#F4F7FB", fontSize: 18, lineHeight: 24, fontWeight: "800", marginTop: 7, flexShrink: 1 },
  actionMeta: { color: "#AFC4E3", fontSize: 10, lineHeight: 16, marginTop: 8 },
  provenance: { backgroundColor: "#0C1725", borderRadius: 14, padding: 14, marginTop: 12 },
  sectionTitle: { color: "#DCE7F6", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  factLabel: { color: "#8EA0B7", fontSize: 9, fontWeight: "900", letterSpacing: 0.9, marginTop: 11 },
  factValue: { color: "#F4F7FB", fontSize: 11, lineHeight: 17, marginTop: 3, flexShrink: 1 },
  sha: { color: "#52D3FF", fontSize: 10, lineHeight: 16, marginTop: 3, flexShrink: 1 },
  reviewButton: { alignItems: "center", backgroundColor: "#1E5B83", borderRadius: 12, minHeight: 48, justifyContent: "center", marginTop: 12, paddingHorizontal: 14, paddingVertical: 12 },
  reviewButtonPressed: { backgroundColor: "#194B6C", opacity: 0.9 },
  reviewButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", textAlign: "center" },
  error: { color: "#FFB7AD", fontSize: 12, lineHeight: 18, marginTop: 8 },
  boundaries: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  boundary: { color: "#BBD9CB", backgroundColor: "#132A27", borderRadius: 999, fontSize: 10, fontWeight: "800", paddingHorizontal: 9, paddingVertical: 7 },
  footer: { color: "#AFC4E3", fontSize: 11, lineHeight: 17, marginTop: 13 },
});
