import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { CaptureDraftReceipt } from "../data/captureDraft";

export type SessionCapture = Readonly<{
  id: string;
  body: string;
  time: string;
}>;

type QuickCaptureProps = Readonly<{
  draft: string;
  captures: readonly SessionCapture[];
  receipt: CaptureDraftReceipt | null;
  error: string | null;
  onDraftChange: (value: string) => void;
  onCreateReceipt: () => void;
  onClearReceipt: () => void;
}>;

export function QuickCapture({
  draft,
  captures,
  receipt,
  error,
  onDraftChange,
  onCreateReceipt,
  onClearReceipt,
}: QuickCaptureProps) {
  const createDisabled = draft.trim() === "" || receipt !== null;

  return (
    <>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>QUICK CAPTURE</Text>
        <Text style={styles.title}>Catch it before it goes</Text>
      </View>
      <Text style={styles.support}>Current session only. Reload clears these notes.</Text>

      <View style={styles.capture}>
        <TextInput
          accessibilityLabel="Harvey local capture"
          maxLength={10_001}
          multiline
          onChangeText={onDraftChange}
          placeholder="What should Harvey remember? Do not paste credentials."
          placeholderTextColor="#8EA0B7"
          style={styles.input}
          value={draft}
        />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: createDisabled }}
          disabled={createDisabled}
          onPress={onCreateReceipt}
          style={[styles.action, createDisabled && styles.disabled]}
        >
          <Text style={styles.actionText}>Create local receipt</Text>
        </Pressable>
      </View>

      {receipt ? (
        <View style={styles.receipt}>
          <View style={styles.rowBetween}>
            <Text style={styles.receiptHeading}>LOCAL DRAFT · NOT DISPATCHED</Text>
            <Text style={styles.proof}>{receipt.proofState}</Text>
          </View>
          <Text selectable style={styles.receiptId}>{receipt.requestId}</Text>
          <Text style={styles.receiptDetail}>{receipt.characterCount} characters · {receipt.lineCount} lines</Text>
          <Text style={styles.boundary}>
            Current session only. Raw note is not present in this receipt. Nothing was saved to cloud or dispatched.
          </Text>
          <Pressable accessibilityRole="button" onPress={onClearReceipt} style={styles.clearAction}>
            <Text style={styles.clearText}>Clear receipt</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.heading}>
        <Text style={styles.eyebrow}>THIS SESSION</Text>
        <Text style={styles.title}>Captured notes</Text>
      </View>
      {captures.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.noteText}>Nothing captured yet.</Text>
          <Text style={styles.small}>A valid local note will appear here until reload.</Text>
        </View>
      ) : (
        captures.map((capture) => (
          <View key={capture.id} style={styles.note}>
            <Text style={styles.noteText}>{capture.body}</Text>
            <Text style={styles.noteTime}>{capture.time}</Text>
          </View>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 28, marginBottom: 12 },
  eyebrow: { color: "#52D3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  title: { color: "#F4F7FB", fontSize: 22, fontWeight: "800", marginTop: 6 },
  support: { color: "#8EA0B7", fontSize: 15, lineHeight: 22, marginTop: -4, marginBottom: 15 },
  capture: { backgroundColor: "#0D1A2A", borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "#20344C" },
  input: { minHeight: 150, color: "#F4F7FB", fontSize: 17, lineHeight: 24, textAlignVertical: "top" },
  error: { color: "#FFB45D", fontSize: 12, lineHeight: 18, marginTop: 8 },
  action: { backgroundColor: "#52D3FF", borderRadius: 14, alignItems: "center", paddingVertical: 14, marginTop: 12 },
  disabled: { opacity: 0.35 },
  actionText: { color: "#05101A", fontWeight: "900", fontSize: 14 },
  receipt: { backgroundColor: "#122338", borderRadius: 18, borderWidth: 1, borderColor: "rgba(87,227,155,0.45)", padding: 16, marginTop: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  receiptHeading: { color: "#57E39B", fontSize: 11, fontWeight: "900", flex: 1 },
  proof: { color: "#57E39B", fontSize: 8, fontWeight: "900" },
  receiptId: { color: "#52D3FF", fontSize: 11, marginTop: 12 },
  receiptDetail: { color: "#F4F7FB", fontSize: 12, marginTop: 8 },
  boundary: { color: "#8EA0B7", fontSize: 11, lineHeight: 17, marginTop: 9 },
  clearAction: { alignSelf: "flex-start", borderRadius: 10, borderWidth: 1, borderColor: "#20344C", paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  clearText: { color: "#F4F7FB", fontSize: 11, fontWeight: "800" },
  empty: { backgroundColor: "#0D1A2A", borderRadius: 18, padding: 20, borderWidth: 1, borderStyle: "dashed", borderColor: "#20344C" },
  note: { backgroundColor: "#0D1A2A", borderRadius: 17, padding: 16, borderWidth: 1, borderColor: "#20344C", marginBottom: 10 },
  noteText: { color: "#F4F7FB", fontSize: 15, lineHeight: 22 },
  noteTime: { color: "#52D3FF", fontSize: 11, marginTop: 10, fontWeight: "700" },
  small: { color: "#8EA0B7", fontSize: 12, marginTop: 5 },
});
