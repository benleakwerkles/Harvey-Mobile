import { Pressable, StyleSheet, Text, View } from "react-native";

import { calculateProgress, type ProjectSnapshotView } from "../data/projectSnapshot";

export type BuildTask = Readonly<{
  id: string;
  title: string;
  area: string;
  done: boolean;
}>;

type CommandBoardProps = Readonly<{
  snapshot: ProjectSnapshotView;
  tasks: readonly BuildTask[];
  variant: "home" | "build";
  onToggleTask: (taskId: string) => void;
}>;

export function CommandBoard({ snapshot, tasks, variant, onToggleTask }: CommandBoardProps) {
  const completed = tasks.filter((task) => task.done).length;
  const progress = calculateProgress(tasks);
  const visibleTasks = variant === "home" ? tasks.slice(0, 3) : tasks;

  return (
    <>
      <View style={styles.provenance}>
        <View style={styles.rowBetween}>
          <Text style={styles.eyebrow}>COMMITTED SANDBOX SNAPSHOT</Text>
          <Text style={styles.truth}>SNAPSHOT · NOT LIVE</Text>
        </View>
        <Text style={styles.sourceLabel}>SOURCE</Text>
        <Text selectable style={styles.sourceValue}>{snapshot.sourcePath}</Text>
        <Text style={styles.sourceLabel}>COMMIT</Text>
        <Text selectable style={styles.sha}>{snapshot.sourceSha}</Text>
        <Text style={styles.sourceLabel}>OBSERVED</Text>
        <Text style={styles.sourceValue}>{snapshot.observedAt}</Text>
        <Text style={styles.freshness}>{snapshot.ageDays} DAYS OLD · {snapshot.freshness}</Text>
        <Text style={styles.boundary}>
          Task changes stay in this app session. Reload resets them. No live Werkles connection is claimed.
        </Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>ACTIVE PROJECT</Text>
          <Text style={styles.badge}>NON HEARTHLAND</Text>
        </View>
        <Text style={styles.project}>{snapshot.project}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.small}>{completed} of {tasks.length} moves complete</Text>
          <Text style={styles.percent}>{progress}%</Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.eyebrow}>{variant === "home" ? "RIGHT NOW" : "BUILD QUEUE"}</Text>
        <Text style={styles.heading}>{variant === "home" ? "Next moves" : "Move the work"}</Text>
      </View>

      {visibleTasks.map((task, index) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: task.done }}
          key={task.id}
          onPress={() => onToggleTask(task.id)}
          style={[styles.task, task.done && styles.doneCard]}
        >
          <Text style={styles.number}>{String(index + 1).padStart(2, "0")}</Text>
          <View style={styles.flex}>
            <Text style={[styles.taskTitle, task.done && styles.doneText]}>{task.title}</Text>
            <Text style={styles.area}>{task.area}</Text>
          </View>
          <Text style={[styles.state, task.done && styles.stateDone]}>{task.done ? "DONE" : "OPEN"}</Text>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  provenance: { backgroundColor: "#0D1A2A", borderRadius: 20, borderWidth: 1, borderColor: "#20344C", padding: 16, marginTop: 20 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  truth: { color: "#FFB45D", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  sourceLabel: { color: "#8EA0B7", fontSize: 9, fontWeight: "800", letterSpacing: 1.1, marginTop: 13 },
  sourceValue: { color: "#F4F7FB", fontSize: 12, marginTop: 3 },
  sha: { color: "#52D3FF", fontSize: 11, marginTop: 3 },
  freshness: { color: "#57E39B", fontSize: 10, fontWeight: "800", marginTop: 14 },
  boundary: { color: "#8EA0B7", fontSize: 11, lineHeight: 17, marginTop: 8 },
  hero: { backgroundColor: "#0D1A2A", borderRadius: 24, borderWidth: 1, borderColor: "#20344C", padding: 20, marginTop: 12 },
  label: { color: "#8EA0B7", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  badge: { color: "#FFB45D", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  project: { color: "#F4F7FB", fontSize: 28, fontWeight: "800", marginTop: 22 },
  track: { height: 7, borderRadius: 5, backgroundColor: "#05101A", marginTop: 22, marginBottom: 10, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5, backgroundColor: "#57E39B" },
  small: { color: "#8EA0B7", fontSize: 12 },
  percent: { color: "#57E39B", fontSize: 12, fontWeight: "800" },
  sectionHeading: { marginTop: 28, marginBottom: 12 },
  heading: { color: "#F4F7FB", fontSize: 22, fontWeight: "800", marginTop: 6 },
  task: { flexDirection: "row", alignItems: "center", backgroundColor: "#0D1A2A", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#20344C", marginBottom: 11, gap: 12 },
  doneCard: { opacity: 0.62, borderColor: "rgba(87,227,155,0.45)" },
  number: { color: "#52D3FF", fontSize: 12, fontWeight: "900" },
  flex: { flex: 1 },
  taskTitle: { color: "#F4F7FB", fontSize: 15, lineHeight: 20, fontWeight: "700" },
  doneText: { textDecorationLine: "line-through", color: "#8EA0B7" },
  area: { color: "#8EA0B7", fontSize: 11, marginTop: 5, textTransform: "uppercase", letterSpacing: 0.8 },
  state: { color: "#FFB45D", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  stateDone: { color: "#57E39B" },
});
