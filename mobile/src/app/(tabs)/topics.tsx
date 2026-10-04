import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ErrorView, Loading } from "../../components/LoadState";
import { getTopics } from "../../lib/api";
import { C, SERIF, shadow } from "../../lib/theme";
import type { TopicSummary } from "../../lib/types";

export default function TopicsScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTopics(await getTopics());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load topics.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (topics.length === 0) return <Loading label="Loading topics…" />;

  return (
    <View style={styles.wrap}>
      <FlatList
        data={topics}
        keyExtractor={(t) => t.slug}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
            onPress={() => router.push({ pathname: "/topic/[slug]", params: { slug: item.slug } })}
          >
            <View style={styles.iconDot}>
              <Ionicons name="flame" size={18} color={C.saffron} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
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
  title: { flex: 1, fontFamily: SERIF, fontSize: 17, fontWeight: "700", color: C.ink },
});
