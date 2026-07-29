import { StyleSheet, Text, View } from "react-native";

import {
  getFlockNetworkSnapshot,
  type FlockNetworkLadderStep,
} from "../data/flockNetworkSnapshot";

function NetworkFact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.fact}>
      <Text selectable style={styles.factLabel}>{label}</Text>
      <Text selectable style={styles.factValue}>{value}</Text>
    </View>
  );
}

function LadderStep({ step }: { readonly step: FlockNetworkLadderStep }) {
  return (
    <View accessible accessibilityLabel={`${step.state}: evidence not observed`} style={styles.ladderStep}>
      <View accessibilityElementsHidden style={styles.ladderMark}>
        <Text style={styles.ladderMarkText}>–</Text>
      </View>
      <Text selectable style={styles.ladderText}>{step.state}</Text>
    </View>
  );
}

function BoundaryItem({ children }: { readonly children: string }) {
  return (
    <View accessible accessibilityLabel={children} style={styles.boundaryItem}>
      <Text accessibilityElementsHidden style={styles.boundaryMark}>✓</Text>
      <Text selectable style={styles.boundaryText}>{children}</Text>
    </View>
  );
}

export function FlockNetworkPeersCard() {
  const snapshot = getFlockNetworkSnapshot();

  return (
    <View
      accessible={false}
      accessibilityLabel={`Network peers. ${snapshot.sender} to ${snapshot.receiver}. ${snapshot.status}.`}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text selectable style={styles.eyebrow}>NETWORK / PEERS</Text>
          <Text accessibilityRole="header" selectable style={styles.title}>
            {snapshot.sender}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={`Network status: ${snapshot.status}`}
          accessibilityLiveRegion="polite"
          style={styles.statusBadge}
        >
          <Text selectable style={styles.statusText}>{snapshot.status}</Text>
        </View>
      </View>

      <Text selectable style={styles.summary}>
        No immutable invitation from Swanson@Doss has been received.
      </Text>

      <View style={styles.facts}>
        <NetworkFact label="FROM" value={snapshot.sender} />
        <NetworkFact label="TO" value={snapshot.receiver} />
        <NetworkFact label="PROJECT SCOPE" value={snapshot.scope} />
        <NetworkFact label="OBSERVATION" value={snapshot.state} />
        <NetworkFact label="FRESHNESS" value={snapshot.freshness} />
        <NetworkFact label="SOURCE" value={snapshot.sourceStatus} />
        <NetworkFact label="CANON" value={snapshot.canonStatus} />
      </View>

      <Text accessibilityRole="header" selectable style={styles.sectionTitle}>
        INVITATION EVIDENCE LADDER
      </Text>
      <View accessibilityLabel="Invitation evidence ladder. No states reached." style={styles.ladder}>
        {snapshot.ladder.map((step) => <LadderStep key={step.state} step={step} />)}
      </View>

      <Text accessibilityRole="header" selectable style={styles.sectionTitle}>
        CURRENT BOUNDARIES
      </Text>
      <View style={styles.boundaries}>
        <BoundaryItem>No live transport</BoundaryItem>
        <BoundaryItem>No remote control</BoundaryItem>
        <BoundaryItem>No external delivery</BoundaryItem>
        <BoundaryItem>Not promoted to canon</BoundaryItem>
      </View>

      <Text selectable style={styles.footer}>
        Discovery does not imply receipt, acceptance, joining, execution, delivery, or canon promotion.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#121E31",
    borderColor: "#405779",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#020712",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  heading: { flexGrow: 1, flexShrink: 1, minWidth: 150, paddingRight: 8 },
  eyebrow: { color: "#AFC4E3", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#F7F9FC", fontSize: 22, fontWeight: "800", lineHeight: 28, marginTop: 4 },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#3A3020",
    borderColor: "#D4A449",
    borderWidth: 1,
    borderRadius: 999,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: { color: "#FFE0A3", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  summary: { color: "#D6E1EF", fontSize: 15, lineHeight: 22, marginTop: 16 },
  facts: { marginTop: 8 },
  fact: {
    width: "100%",
    backgroundColor: "#18263B",
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  factLabel: { color: "#AFC4E3", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  factValue: { color: "#F7F9FC", fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 3 },
  sectionTitle: { color: "#DCE7F6", fontSize: 12, fontWeight: "800", letterSpacing: 0.8, marginTop: 20 },
  ladder: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginTop: 4 },
  ladderStep: {
    alignItems: "center",
    backgroundColor: "#17243A",
    borderColor: "#3D5271",
    borderWidth: 1,
    borderRadius: 11,
    flexBasis: 124,
    flexDirection: "row",
    flexGrow: 1,
    marginHorizontal: 4,
    marginTop: 8,
    minHeight: 46,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  ladderMark: {
    alignItems: "center",
    borderColor: "#AABBD1",
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    marginRight: 7,
    width: 20,
  },
  ladderMarkText: { color: "#AABBD1", fontSize: 13, fontWeight: "800", lineHeight: 16 },
  ladderText: { color: "#BFCDE0", flexShrink: 1, fontSize: 11, fontWeight: "800", letterSpacing: 0.25 },
  boundaries: { marginTop: 4 },
  boundaryItem: { alignItems: "flex-start", flexDirection: "row", marginTop: 8 },
  boundaryMark: { color: "#80D7B2", fontSize: 14, fontWeight: "900", marginRight: 8, width: 14 },
  boundaryText: { color: "#CCD8E7", flexShrink: 1, fontSize: 13, lineHeight: 19 },
  footer: {
    borderTopColor: "#344964",
    borderTopWidth: StyleSheet.hairlineWidth,
    color: "#AFC4E3",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    paddingTop: 12,
  },
});
