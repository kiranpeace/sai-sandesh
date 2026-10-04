import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { C } from "../lib/theme";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.saffron} />
      <Text style={styles.msg}>{label}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.err}>{message}</Text>
      <Pressable style={({ pressed }) => [styles.retry, pressed && { opacity: 0.85 }]} onPress={onRetry}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  msg: { color: C.inkSoft, fontSize: 15 },
  err: { color: C.ink, fontSize: 16, textAlign: "center", lineHeight: 24 },
  retry: { backgroundColor: C.indigo800, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
