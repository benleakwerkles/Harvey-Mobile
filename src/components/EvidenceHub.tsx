import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BuildIdentity } from "../data/buildIdentity";
import {
  compareBundleToProof,
  type CloudProofView,
} from "../data/cloudProofSnapshot";
import type { FlockRelayView } from "../data/flockRelaySnapshot";
import { FlockRelaySnapshotCard } from "./FlockRelaySnapshotCard";

type EvidenceMode = "Relay" | "Cloud proof";

type EvidenceHubProps = Readonly<{
  buildIdentity: BuildIdentity;
  cloudProof: CloudProofView;
  relay: FlockRelayView;
}>;

export function EvidenceHub({ buildIdentity, cloudProof, relay }: EvidenceHubProps) {
  const [mode, setMode] = useState<EvidenceMode>("Relay");
  const bundleCoverage = compareBundleToProof(buildIdentity, cloudProof);

  return (
    <>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>EVIDENCE</Text>
        <Text style={styles.title}>What is actually proven?</Text>
      </View>

      <View accessibilityRole="tablist" style={styles.segmented}>
        {(["Relay", "Cloud proof"] as const).map((item) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === item }}
            key={item}
            onPress={() => setMode(item)}
            style={[styles.segment, mode === item && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, mode === item && styles.segmentLabelActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {mode === "Relay" ? <FlockRelaySnapshotCard snapshot={relay} /> : null}

      {mode === "Cloud proof" ? (
        <>
          <View style={styles.proofHero}>
            <Text style={styles.eyebrow}>SANDBOX CLOUD PROOF</Text>
            <Text style={styles.title}>Last completed receipt</Text>
            <Text style={styles.proven}>PROVEN ARTIFACT TREE</Text>
            <Text selectable style={styles.sha}>{cloudProof.implementationSha}</Text>
            <Text style={styles.notLive}>DOWNLOADABLE BUILD ARTIFACT · NOT LIVE</Text>
            <Text style={styles.copy}>
              Successful runs and digests prove recorded sandbox artifacts for this SHA only. Current availability is unproven.
            </Text>
          </View>

          <View style={styles.compare}>
            <Text style={styles.label}>THIS BUNDLE TREE</Text>
            <Text selectable style={styles.sha}>{buildIdentity.sha ?? buildIdentity.truthLabel}</Text>
            <Text style={styles.label}>LAST PROVEN ARTIFACT TREE</Text>
            <Text selectable style={styles.sha}>{cloudProof.implementationSha}</Text>
            <Text style={styles.coverage}>{bundleCoverage}</Text>
          </View>

          <View
            accessibilityLabel={["Push run", cloudProof.pushRun.id, "success. Pull request run", cloudProof.prRun.id, "success."].join(" ")}
            style={styles.runs}
          >
            <Text style={styles.label}>SUCCESSFUL HISTORICAL RUNS</Text>
            <Text selectable style={styles.value}>PUSH · {cloudProof.pushRun.id}</Text>
            <Text selectable style={styles.value}>PULL REQUEST · {cloudProof.prRun.id}</Text>
          </View>

          {cloudProof.artifacts.map((artifact) => (
            <View
              accessibilityLabel={[artifact.platform, "artifact", artifact.id, "recorded availability unproven"].join(" ")}
              key={artifact.id}
              style={styles.artifact}
            >
              <Text style={styles.artifactTitle}>{artifact.platform.toUpperCase()} · ARTIFACT {artifact.id}</Text>
              <Text selectable style={styles.value}>{artifact.name}</Text>
              <Text selectable style={styles.digest}>{artifact.digest}</Text>
              <Text style={styles.availability}>RECORDED · AVAILABILITY UNPROVEN</Text>
            </View>
          ))}

          <View style={styles.chips}>
            {cloudProof.boundaryLabels.map((label) => (
              <Text key={label} style={styles.chip}>{label}</Text>
            ))}
          </View>
          <Text style={styles.boundary}>Canon remains unwritten and promotion approval remains pending.</Text>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 24 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: "#F4F7FB", fontSize: 25, fontWeight: "800", marginTop: 6 },
  segmented: { flexDirection: "row", backgroundColor: "#05101A", borderRadius: 16, padding: 5, marginTop: 18, borderWidth: 1, borderColor: "#20344C" },
  segment: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  segmentActive: { backgroundColor: "#122338" },
  segmentLabel: { color: "#8EA0B7", fontSize: 13, fontWeight: "800" },
  segmentLabelActive: { color: "#F4F7FB" },
  proofHero: { backgroundColor: "#0D1A2A", borderColor: "#20344C", borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 20 },
  proven: { color: "#57E39B", fontSize: 10, fontWeight: "900", letterSpacing: 0.9, marginTop: 18 },
  sha: { color: "#52D3FF", fontSize: 10, lineHeight: 16, marginTop: 4 },
  notLive: { color: "#FFB45D", fontSize: 11, fontWeight: "900", marginTop: 16 },
  copy: { color: "#8EA0B7", fontSize: 12, lineHeight: 18, marginTop: 7 },
  compare: { backgroundColor: "#05101A", borderColor: "#20344C", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 12 },
  label: { color: "#8EA0B7", fontSize: 9, fontWeight: "900", letterSpacing: 1.0, marginTop: 7 },
  coverage: { color: "#FFB45D", fontSize: 11, lineHeight: 17, fontWeight: "800", marginTop: 14 },
  runs: { backgroundColor: "#0D1A2A", borderColor: "#20344C", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 12 },
  value: { color: "#F4F7FB", fontSize: 11, lineHeight: 17, marginTop: 5 },
  artifact: { backgroundColor: "#0D1A2A", borderColor: "#20344C", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 11 },
  artifactTitle: { color: "#57E39B", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  digest: { color: "#52D3FF", fontSize: 9, lineHeight: 15, marginTop: 8 },
  availability: { color: "#FFB45D", fontSize: 10, fontWeight: "900", marginTop: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 16 },
  chip: { color: "#FFB45D", backgroundColor: "rgba(255,180,93,0.10)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, fontSize: 9, fontWeight: "900" },
  boundary: { color: "#8EA0B7", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 14 },
});
