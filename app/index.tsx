import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { CommandBoard, type BuildTask } from "../src/components/CommandBoard";
import { QuickCapture, type SessionCapture } from "../src/components/QuickCapture";
import { createCaptureDraftReceipt, type CaptureDraftReceipt } from "../src/data/captureDraft";
import { getProjectSnapshotView, type ProjectSnapshot } from "../src/data/projectSnapshot";

type Mode = "Home" | "Build" | "Capture";

const MODES = ["Home", "Build", "Capture"] as const;

const SNAPSHOT: ProjectSnapshot = Object.freeze({
  project: "Werkles",
  sourcePath: "docs/flock/STATE.json",
  sourceSha: "fbfe3f3bf35b6811b32a0efefd79026c9d04affc",
  observedAt: "2026-07-17T18:36:03.000Z",
  truth: "SNAPSHOT_NOT_LIVE",
});

const STARTING_TASKS: readonly BuildTask[] = Object.freeze([
  Object.freeze({ id: "1", title: "Prove the sandbox command board", area: "Mobile shell", done: true }),
  Object.freeze({ id: "2", title: "Return external Ender receiver proof", area: "Flock relay", done: false }),
  Object.freeze({ id: "3", title: "Verify secret-safe local capture", area: "Capture", done: false }),
  Object.freeze({ id: "4", title: "Pass the sandbox promotion gate", area: "Cloud proof", done: false }),
]);

export default function HarveyHome() {
  const [mode, setMode] = useState<Mode>("Home");
  const [tasks, setTasks] = useState<readonly BuildTask[]>(STARTING_TASKS);
  const [draft, setDraft] = useState("");
  const [captures, setCaptures] = useState<readonly SessionCapture[]>([]);
  const [receipt, setReceipt] = useState<CaptureDraftReceipt | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const snapshot = useMemo(() => getProjectSnapshotView(SNAPSHOT, new Date()), []);

  const toggleTask = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    );
  };

  const changeDraft = (value: string) => {
    setDraft(value);
    setCaptureError(null);
  };

  const createReceipt = () => {
    const result = createCaptureDraftReceipt(draft, new Date());
    if (!result.ok) {
      setCaptureError(result.message);
      return;
    }

    const body = draft.trim();
    setCaptures((current) => [
      {
        id: result.receipt.requestId,
        body,
        time: new Date(result.receipt.createdAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      },
      ...current,
    ]);
    setReceipt(result.receipt);
    setDraft("");
    setCaptureError(null);
  };

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

        <Text style={styles.subtitle}>
          A phone-first sandbox for moving builds without manufacturing live, saved, or delivered claims.
        </Text>

        <View accessibilityRole="tablist" style={styles.nav}>
          {MODES.map((item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === item }}
              key={item}
              onPress={() => setMode(item)}
              style={[styles.navButton, mode === item && styles.navActive]}
            >
              <Text style={[styles.navLabel, mode === item && styles.navLabelActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {mode === "Home" ? (
          <>
            <CommandBoard snapshot={snapshot} tasks={tasks} variant="home" onToggleTask={toggleTask} />
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{tasks.filter((task) => !task.done).length}</Text>
                <Text style={styles.small}>Open moves</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.captureCount}>{captures.length}</Text>
                <Text style={styles.small}>Session captures</Text>
              </View>
            </View>
          </>
        ) : null}

        {mode === "Build" ? (
          <CommandBoard snapshot={snapshot} tasks={tasks} variant="build" onToggleTask={toggleTask} />
        ) : null}

        {mode === "Capture" ? (
          <QuickCapture
            captures={captures}
            draft={draft}
            error={captureError}
            onClearReceipt={() => setReceipt(null)}
            onCreateReceipt={createReceipt}
            onDraftChange={changeDraft}
            receipt={receipt}
          />
        ) : null}

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
  navLabel: { color: "#8EA0B7", fontSize: 14, fontWeight: "700" },
  navLabelActive: { color: "#F4F7FB" },
  stats: { flexDirection: "row", gap: 12, marginTop: 12 },
  stat: { flex: 1, backgroundColor: "#0D1A2A", borderRadius: 18, padding: 17, borderWidth: 1, borderColor: "#20344C" },
  statValue: { color: "#57E39B", fontSize: 26, fontWeight: "800" },
  captureCount: { color: "#52D3FF", fontSize: 26, fontWeight: "800" },
  small: { color: "#8EA0B7", fontSize: 12, marginTop: 5 },
  footer: { color: "#8EA0B7", opacity: 0.55, fontSize: 9, letterSpacing: 1.25, textAlign: "center", marginTop: 34 },
});
