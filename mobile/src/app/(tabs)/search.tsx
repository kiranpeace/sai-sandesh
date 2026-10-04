import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ErrorView } from "../../components/LoadState";
import { getTopics, search } from "../../lib/api";
import { C, SERIF, shadow } from "../../lib/theme";
import type { SearchResult, TopicSummary } from "../../lib/types";

export default function SearchScreen() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    getTopics().then(setTopics).catch(() => {});
  }, []);

  const run = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      setResults(await search(q, topic ?? undefined));
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }, [query, topic]);

  return (
    <View style={styles.wrap}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search discourses & Vahinis…"
          placeholderTextColor={C.inkSoft}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={run}
          returnKeyType="search"
        />
        <Pressable
          style={({ pressed }) => [styles.go, pressed && { opacity: 0.85 }]}
          onPress={run}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.goText}>Go</Text>}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Pressable
          style={[styles.chip, topic === null && styles.chipActive]}
          onPress={() => setTopic(null)}
        >
          <Text style={[styles.chipText, topic === null && styles.chipTextActive]}>All</Text>
        </Pressable>
        {topics.map((t) => (
          <Pressable
            key={t.slug}
            style={[styles.chip, topic === t.slug && styles.chipActive]}
            onPress={() => setTopic(t.slug)}
          >
            <Text style={[styles.chipText, topic === t.slug && styles.chipTextActive]}>{t.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? (
        <ErrorView message={error} onRetry={run} />
      ) : searched && results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No passages found. Try different words.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => `${i}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.citation}>{item.citation}</Text>
              <Text style={styles.excerpt}>{item.excerpt}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.cream },
  searchBar: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.ink,
    ...shadow,
  },
  go: {
    backgroundColor: C.saffron,
    borderRadius: 14,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  goText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  chips: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexGrow: 0 },
  chip: {
    borderWidth: 1.5,
    borderColor: C.indigo800,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: C.indigo800 },
  chipText: { color: C.indigo800, fontWeight: "600", fontSize: 14 },
  chipTextActive: { color: "#fff" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: C.inkSoft, fontSize: 15, textAlign: "center" },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, ...shadow },
  citation: { fontSize: 13, fontWeight: "700", color: C.saffronDeep, marginBottom: 6 },
  excerpt: { fontFamily: SERIF, fontSize: 15, lineHeight: 23, color: C.ink },
});
