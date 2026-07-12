import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Mode = "Home" | "Build" | "Capture";
type Task = { id: string; title: string; area: string; done: boolean };
type Note = { id: string; body: string; time: string };

const C = {
  ink: "#F4F7FB",
  muted: "#8EA0B7",
  bg: "#07111D",
  panel: "#0D1A2A",
  soft: "#122338",
  border: "#20344C",
  cyan: "#52D3FF",
  green: "#57E39B",
  orange: "#FFB45D",
  dark: "#05101A",
};

const STARTING_TASKS: Task[] = [
  { id: "1", title: "Shape the phone-first Werkles dashboard", area: "Mobile shell", done: true },
  { id: "2", title: "Connect Harvey to the Werkles project feed", area: "Cloud sync", done: false },
  { id: "3", title: "Add voice-to-build quick capture", area: "Capture", done: false },
  { id: "4", title: "Create safe GitHub action controls", area: "ThinkIT", done: false },
];

function Heading({ eyebrow, children }: { eyebrow: string; children: string }) {
  return (
    <View style={s.heading}>
      <Text style={s.eyebrow}>{eyebrow}</Text>
      <Text style={s.headingText}>{children}</Text>
    </View>
  );
}

export default function HarveyHome() {
  const [mode, setMode] = useState<Mode>("Home");
  const [tasks, setTasks] = useState(STARTING_TASKS);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);

  const done = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const progress = Math.round((done / tasks.length) * 100);

  const toggle = (id: string) =>
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );

  const capture = () => {
    const body = draft.trim();
    if (!body) return;
    setNotes((current) => [
      {
        id: String(Date.now()),
        body,
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      },
      ...current,
    ]);
    setDraft("");
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View>
            <Text style={s.brand}>HARVEY / THINKIT</Text>
            <Text style={s.title}>Build Werkles anywhere.</Text>
          </View>
          <View style={s.online} />
        </View>

        <Text style={s.subtitle}>
          A phone-first command lane for moving builds and catching ideas while life is happening.
        </Text>

        <View style={s.nav}>
          {(["Home", "Build", "Capture"] as Mode[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              style={[s.navButton, mode === item && s.navActive]}
            >
              <Text style={[s.navLabel, mode === item && s.navLabelActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {mode === "Home" && (
          <>
            <View style={s.hero}>
              <View style={s.rowBetween}>
                <Text style={s.label}>ACTIVE PROJECT</Text>
                <View style={s.badge}><Text style={s.badgeText}>NON HEARTHLAND</Text></View>
              </View>
              <Text style={s.project}>Werkles</Text>
              <Text style={s.copy}>
                Keep the build moving from the sidelines, the car, or anywhere your phone reaches the cloud.
              </Text>
              <View style={s.track}>
                <View style={[s.fill, { width: (progress + "%") as any }]} />
              </View>
              <View style={s.rowBetween}>
                <Text style={s.small}>{done} of {tasks.length} moves complete</Text>
                <Text style={s.percent}>{progress}%</Text>
              </View>
            </View>

            <View style={s.stats}>
              <View style={s.stat}><Text style={s.statValue}>{tasks.length - done}</Text><Text style={s.small}>Open moves</Text></View>
              <View style={s.stat}><Text style={[s.statValue, s.cyan]}>{notes.length}</Text><Text style={s.small}>Captured today</Text></View>
            </View>

            <Heading eyebrow="RIGHT NOW">Next moves</Heading>
            {tasks.slice(0, 3).map((task) => (
              <Pressable key={task.id} onPress={() => toggle(task.id)} style={[s.task, task.done && s.doneCard]}>
                <View style={[s.check, task.done && s.checked]}><Text style={s.checkText}>{task.done ? "✓" : ""}</Text></View>
                <View style={s.flex}>
                  <Text style={[s.taskTitle, task.done && s.doneText]}>{task.title}</Text>
                  <Text style={s.area}>{task.area}</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {mode === "Build" && (
          <>
            <Heading eyebrow="BUILD QUEUE">Move the work</Heading>
            <Text style={s.modeCopy}>Tap a move when it is finished. Live Werkles and GitHub sync comes next.</Text>
            {tasks.map((task, index) => (
              <Pressable key={task.id} onPress={() => toggle(task.id)} style={[s.queue, task.done && s.doneCard]}>
                <Text style={s.number}>{String(index + 1).padStart(2, "0")}</Text>
                <View style={s.flex}>
                  <Text style={[s.taskTitle, task.done && s.doneText]}>{task.title}</Text>
                  <Text style={s.area}>{task.area}</Text>
                </View>
                <Text style={[s.state, task.done && s.stateDone]}>{task.done ? "DONE" : "OPEN"}</Text>
              </Pressable>
            ))}
          </>
        )}

        {mode === "Capture" && (
          <>
            <Heading eyebrow="QUICK CAPTURE">Catch it before it goes</Heading>
            <Text style={s.modeCopy}>Drop an idea, build instruction, or observation without leaving the moment.</Text>
            <View style={s.capture}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="What should Harvey remember?"
                placeholderTextColor={C.muted}
                multiline
                style={s.input}
              />
              <Pressable onPress={capture} disabled={!draft.trim()} style={[s.captureButton, !draft.trim() && s.disabled]}>
                <Text style={s.captureText}>Save to Harvey</Text>
              </Pressable>
            </View>

            <Heading eyebrow="THIS SESSION">Captured notes</Heading>
            {notes.length === 0 ? (
              <View style={s.empty}><Text style={s.taskTitle}>Nothing captured yet.</Text><Text style={s.small}>Your first field note will appear here.</Text></View>
            ) : notes.map((note) => (
              <View key={note.id} style={s.note}>
                <Text style={s.noteText}>{note.body}</Text>
                <Text style={s.noteTime}>{note.time}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={s.footer}>CLOUD LANE · BENLEAKWERKLES/HARVEY-MOBILE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  page: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 48 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { color: C.cyan, fontSize: 12, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: C.ink, fontSize: 34, lineHeight: 39, fontWeight: "800", marginTop: 8, maxWidth: 310 },
  online: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.green, marginTop: 5 },
  subtitle: { color: C.muted, fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 560 },
  nav: { flexDirection: "row", backgroundColor: C.dark, borderRadius: 16, padding: 5, marginTop: 24, borderWidth: 1, borderColor: C.border },
  navButton: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 12 },
  navActive: { backgroundColor: C.soft },
  navLabel: { color: C.muted, fontSize: 14, fontWeight: "700" },
  navLabelActive: { color: C.ink },
  hero: { backgroundColor: C.panel, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 20, marginTop: 20 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  label: { color: C.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  badge: { backgroundColor: "rgba(255,180,93,0.12)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { color: C.orange, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  project: { color: C.ink, fontSize: 28, fontWeight: "800", marginTop: 22 },
  copy: { color: C.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  track: { height: 7, borderRadius: 5, backgroundColor: C.dark, marginTop: 22, marginBottom: 10, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5, backgroundColor: C.green },
  small: { color: C.muted, fontSize: 12, marginTop: 5 },
  percent: { color: C.green, fontSize: 12, fontWeight: "800" },
  stats: { flexDirection: "row", gap: 12, marginTop: 12 },
  stat: { flex: 1, backgroundColor: C.panel, borderRadius: 18, padding: 17, borderWidth: 1, borderColor: C.border },
  statValue: { color: C.green, fontSize: 26, fontWeight: "800" },
  cyan: { color: C.cyan },
  heading: { marginTop: 28, marginBottom: 12 },
  eyebrow: { color: C.cyan, fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  headingText: { color: C.ink, fontSize: 22, fontWeight: "800", marginTop: 6 },
  modeCopy: { color: C.muted, fontSize: 15, lineHeight: 22, marginTop: -4, marginBottom: 15 },
  task: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  doneCard: { opacity: 0.62, borderColor: "rgba(87,227,155,0.45)" },
  check: { width: 25, height: 25, borderRadius: 13, borderWidth: 1, borderColor: C.muted, alignItems: "center", justifyContent: "center", marginRight: 12 },
  checked: { backgroundColor: C.green, borderColor: C.green },
  checkText: { color: C.dark, fontWeight: "900", fontSize: 14 },
  flex: { flex: 1 },
  taskTitle: { color: C.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  doneText: { textDecorationLine: "line-through", color: C.muted },
  area: { color: C.muted, fontSize: 11, marginTop: 5, textTransform: "uppercase", letterSpacing: 0.8 },
  queue: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 11, gap: 12 },
  number: { color: C.cyan, fontSize: 12, fontWeight: "900" },
  state: { color: C.orange, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  stateDone: { color: C.green },
  capture: { backgroundColor: C.panel, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: C.border },
  input: { minHeight: 150, color: C.ink, fontSize: 17, lineHeight: 24, textAlignVertical: "top" },
  captureButton: { backgroundColor: C.cyan, borderRadius: 14, alignItems: "center", paddingVertical: 14, marginTop: 12 },
  disabled: { opacity: 0.35 },
  captureText: { color: C.dark, fontWeight: "900", fontSize: 14 },
  empty: { backgroundColor: C.panel, borderRadius: 18, padding: 20, borderWidth: 1, borderStyle: "dashed", borderColor: C.border },
  note: { backgroundColor: C.panel, borderRadius: 17, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  noteText: { color: C.ink, fontSize: 15, lineHeight: 22 },
  noteTime: { color: C.cyan, fontSize: 11, marginTop: 10, fontWeight: "700" },
  footer: { color: C.muted, opacity: 0.55, fontSize: 9, letterSpacing: 1.25, textAlign: "center", marginTop: 34 },
});
