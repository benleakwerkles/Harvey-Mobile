import { StyleSheet, Text, View } from "react-native";

import type { FlockRelayView } from "../data/flockRelaySnapshot";

type FlockRelaySnapshotCardProps = Readonly<{ snapshot: FlockRelayView }>;

function displayState(state: string): string {
  if (state === "READY_FOR_PULL_INTERNAL_ROLE_AGENT") return "READY · INTERNAL ONLY";
  if (state === "RECEIPTED_INTERNAL_ROLE_AGENT") return "INTERNAL ROLE RECEIPT";
  if (state === "READY_FOR_PULL") return "READY FOR PULL";
  if (state === "RECEIPTED") return "RECEIPTED";
  return "UNPROVEN STATE";
}

export function FlockRelaySnapshotCard({ snapshot }: FlockRelaySnapshotCardProps) {
  return (
    <>
      <View
        accessibilityLabel="External Ender delivery blocked — no transport receipt"
        style={styles.blocker}
      >
        <Text style={styles.blockerEyebrow}>EXTERNAL ENDER / CLAUDE</Text>
        <Text style={styles.blockerState}>BLOCKED · UNBOUND</Text>
        <Text style={styles.copy}>No external receiver pull, receipt, or delivery is proven.</Text>
      </View>

      <View style={styles.owner}>
        <Text style={styles.eyebrow}>EXECUTION OWNER · {snapshot.executionOwner}</Text>
        <Text style={styles.copy}>Only the execution owner may execute or push. Work mode: CLOUD ONLY.</Text>
      </View>

      <View style={styles.heading}>
        <Text style={styles.eyebrow}>COMMITTED RELAY SNAPSHOT</Text>
        <Text style={styles.title}>Flock packet ledger</Text>
        <Text style={styles.truth}>SNAPSHOT · NOT LIVE · {snapshot.ageDays} DAYS OLD</Text>
      </View>

      {snapshot.packets.map((packet) => {
        const state = displayState(packet.state);
        return (
          <View
            accessibilityLabel={[packet.address, state, "packet", packet.packetId].join(", ")}
            key={packet.packetId}
            style={styles.packet}
          >
            <Text style={styles.address}>{packet.address}</Text>
            <Text style={styles.state}>{state}</Text>
            <Text selectable style={styles.packetId}>{packet.packetId}</Text>
            <Text style={styles.copy}>
              {packet.internalRoleAgent
                ? "Internal role-agent state is not external delivery."
                : "No internal-role exception is recorded."}
            </Text>
          </View>
        );
      })}

      <View style={styles.source}>
        <Text style={styles.label}>SOURCE</Text>
        <Text selectable style={styles.value}>{snapshot.sourcePath}</Text>
        <Text style={styles.label}>CHECKPOINT</Text>
        <Text selectable style={styles.sha}>{snapshot.sourceSha}</Text>
        <Text style={styles.boundary}>{snapshot.proofBoundary}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  blocker: { backgroundColor: "rgba(255,180,93,0.10)", borderColor: "#FFB45D", borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 20 },
  blockerEyebrow: { color: "#FFB45D", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  blockerState: { color: "#FFB45D", fontSize: 25, fontWeight: "900", marginTop: 7 },
  owner: { backgroundColor: "#0D1A2A", borderColor: "#20344C", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 12 },
  heading: { marginTop: 26, marginBottom: 12 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.25 },
  title: { color: "#F4F7FB", fontSize: 24, fontWeight: "800", marginTop: 6 },
  truth: { color: "#FFB45D", fontSize: 10, fontWeight: "900", marginTop: 8, letterSpacing: 0.7 },
  packet: { backgroundColor: "#0D1A2A", borderColor: "#20344C", borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 11 },
  address: { color: "#F4F7FB", fontSize: 14, fontWeight: "800" },
  state: { color: "#52D3FF", fontSize: 11, fontWeight: "900", marginTop: 8, letterSpacing: 0.8 },
  packetId: { color: "#8EA0B7", fontSize: 10, lineHeight: 15, marginTop: 8 },
  copy: { color: "#8EA0B7", fontSize: 12, lineHeight: 18, marginTop: 7 },
  source: { backgroundColor: "#05101A", borderColor: "#20344C", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 2 },
  label: { color: "#8EA0B7", fontSize: 9, fontWeight: "800", letterSpacing: 1.1, marginTop: 7 },
  value: { color: "#F4F7FB", fontSize: 11, marginTop: 3 },
  sha: { color: "#52D3FF", fontSize: 10, marginTop: 3 },
  boundary: { color: "#8EA0B7", fontSize: 11, lineHeight: 17, marginTop: 12 },
});
