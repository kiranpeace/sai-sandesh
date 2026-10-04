import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ErrorView, Loading } from "../../components/LoadState";
import { getArchive } from "../../lib/api";
import { C, SERIF, shadow } from "../../lib/theme";

export function prettyDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ArchiveScreen() {
  const router = useRouter();
  const [dates, setDates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDates(await getArchive());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the archive.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (dates.length === 0) return <Loading label="Loading archive…" />;

  return (
    <View style={styles.wrap}>
      <FlatList
        data={dates}
        keyExtractor={(d) => d}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
            onPress={() => router.push({ pathname: "/day/[date]", params: { date: item } })}
          >
            <View style={styles.iconDot}>
              <Ionicons name="sunny" size={18} color={index === 0 ? C.saffron : C.indigo800} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.title}>{prettyDate(item)}</Text>
              {index === 0 ? <Text style={styles.badge}>Latest</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.inkSoft} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.cream },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...shadow,
  },
  iconDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.creamDark,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, gap: 2 },
  title: { fontFamily: SERIF, fontSize: 16, fontWeight: "700", color: C.ink },
  badge: { fontSize: 12, fontWeight: "700", color: C.saffronDeep },
});
