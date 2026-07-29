import { Pressable, StyleSheet, Text, View } from "react-native";

import { CAPTURE_CATEGORIES, CAPTURE_PRIORITIES, type CaptureCategory, type CapturePriority } from "../data/captureTriage";

export type CaptureTriageFilter = "ALL" | "UNTRIAGED" | "TRIAGED";
export type CaptureDraftMetadata = Readonly<{ category: CaptureCategory; priority: CapturePriority }>;

type CaptureTriageBarProps = Readonly<{
  category: CaptureCategory;
  priority: CapturePriority;
  filter: CaptureTriageFilter;
  counts: Readonly<{ all: number; untriaged: number; triaged: number }>;
  visibleCount: number;
  onCategoryChange: (value: CaptureCategory) => void;
  onPriorityChange: (value: CapturePriority) => void;
  onFilterChange: (value: CaptureTriageFilter) => void;
}>;

type ChoiceProps<T extends string> = Readonly<{ label: string; accessibilityLabel: string; value: T; selected: boolean; disabled?: boolean; onSelect: (value: T) => void }>;
function Choice<T extends string>({ label, accessibilityLabel, value, selected, disabled = false, onSelect }: ChoiceProps<T>) {
  return (
    <Pressable accessibilityHint="Changes session-only metadata. Nothing is saved or dispatched." accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => onSelect(value)} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, disabled && styles.choiceDisabled, pressed && styles.choicePressed]}>
      <Text selectable style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function CaptureTriageBar({ category, priority, filter, counts, visibleCount, onCategoryChange, onPriorityChange, onFilterChange }: CaptureTriageBarProps) {
  return (
    <View style={styles.card} testID="capture-triage-bar">
      <Text selectable style={styles.eyebrow}>SESSION-ONLY TRIAGE</Text>
      <Text accessibilityRole="header" selectable style={styles.title}>Sort without saving</Text>
      <View accessible accessibilityLabel="Session-only capture triage. Raw note text is not included in receipts or durable evidence." style={styles.truthBanner}>
        <Text selectable style={styles.truthTitle}>LOCAL SESSION ONLY</Text>
        <Text selectable style={styles.truthBody}>Reload clears captures and metadata. Raw note text never enters receipts or durable evidence. Nothing is saved or dispatched.</Text>
      </View>
      <Text accessibilityLiveRegion="polite" selectable style={styles.summary}>{filter} · Showing {visibleCount} of {counts.all} session captures</Text>
      {visibleCount === 0 && counts.all > 0 ? <Text selectable style={styles.empty}>No captures match this session-only filter.</Text> : null}

      <Text accessibilityRole="header" selectable style={styles.sectionTitle}>FILTER</Text>
      <View style={styles.choiceRow}>
        <Choice accessibilityLabel={`Show all session captures. ${counts.all} captures.`} label={`ALL ${counts.all}`} onSelect={onFilterChange} selected={filter === "ALL"} value="ALL" />
        <Choice accessibilityLabel={`Show untriaged session captures. ${counts.untriaged} captures.`} disabled={counts.untriaged === 0} label={`UNTRIAGED ${counts.untriaged}`} onSelect={onFilterChange} selected={filter === "UNTRIAGED"} value="UNTRIAGED" />
        <Choice accessibilityLabel={`Show triaged session captures. ${counts.triaged} captures.`} disabled={counts.triaged === 0} label={`TRIAGED ${counts.triaged}`} onSelect={onFilterChange} selected={filter === "TRIAGED"} value="TRIAGED" />
      </View>

      <Text accessibilityRole="header" selectable style={styles.sectionTitle}>NEW CAPTURE CATEGORY</Text>
      <View style={styles.choiceRow}>{CAPTURE_CATEGORIES.map((value) => <Choice accessibilityLabel={`Set new capture category to ${value}`} key={value} label={value} onSelect={onCategoryChange} selected={category === value} value={value} />)}</View>
      <Text accessibilityRole="header" selectable style={styles.sectionTitle}>NEW CAPTURE PRIORITY</Text>
      <View style={styles.choiceRow}>{CAPTURE_PRIORITIES.map((value) => <Choice accessibilityLabel={`Set new capture priority to ${value}`} key={value} label={value} onSelect={onPriorityChange} selected={priority === value} value={value} />)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", backgroundColor: "#0D1A2A", borderColor: "#20344C", borderRadius: 18, borderWidth: 1, marginTop: 20, padding: 14 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#F4F7FB", fontSize: 19, fontWeight: "800", lineHeight: 25, marginTop: 5 },
  truthBanner: { backgroundColor: "#15263A", borderColor: "#405875", borderRadius: 12, borderWidth: 1, marginTop: 12, padding: 11 },
  truthTitle: { color: "#57E39B", fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  truthBody: { color: "#C8D4E3", fontSize: 12, lineHeight: 18, marginTop: 5 },
  summary: { color: "#F4F7FB", fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 12 },
  empty: { color: "#FFB45D", fontSize: 11, marginTop: 7 },
  sectionTitle: { color: "#8EA0B7", fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginTop: 15 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginTop: 3 },
  choice: { alignItems: "center", backgroundColor: "#101F31", borderColor: "#30465F", borderRadius: 11, borderWidth: 1, flexBasis: 88, flexGrow: 1, justifyContent: "center", marginHorizontal: 4, marginTop: 8, minHeight: 48, paddingHorizontal: 8, paddingVertical: 10 },
  choiceSelected: { backgroundColor: "#16364C", borderColor: "#52D3FF", borderWidth: 2 },
  choiceDisabled: { opacity: 0.42 },
  choicePressed: { opacity: 0.78 },
  choiceText: { color: "#AFC0D4", fontSize: 10, fontWeight: "800", textAlign: "center" },
  choiceTextSelected: { color: "#F4F7FB" },
});
