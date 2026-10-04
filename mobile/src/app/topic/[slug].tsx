import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { ErrorView, Loading } from "../../components/LoadState";
import { getTopic } from "../../lib/api";
import { C, SERIF, shadow } from "../../lib/theme";
import type { TopicQA } from "../../lib/types";

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{children}</Text>
      <View style={styles.labelLine} />
    </View>
  );
}

function Quote({ quote, cite }: { quote: string; cite?: string }) {
  return (
    <View style={styles.quoteCard}>
      <Text style={styles.quote}>“{quote}”</Text>
      {cite ? <Text style={styles.cite}>{cite}</Text> : null}
    </View>
  );
}

export default function TopicDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();
  const [qa, setQa] = useState<TopicQA | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const doc = await getTopic(slug);
      setQa(doc);
      navigation.setOptions({ title: doc.title });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this topic.");
    }
  }, [slug, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !qa) return <ErrorView message={error} onRetry={load} />;
  if (!qa) return <Loading label="Loading…" />;

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{qa.title}</Text>

        <SectionLabel>SWAMI'S DEFINITION</SectionLabel>
        <Quote quote={qa.definition.quote} cite={qa.definition.citation} />

        {qa.vahinis.length > 0 ? (
          <>
            <SectionLabel>IN THE VAHINIS</SectionLabel>
            {qa.vahinis.map((v, i) => (
              <Quote key={i} quote={v.quote} cite={v.source} />
            ))}
          </>
        ) : null}

        {qa.discourses.length > 0 ? (
          <>
            <SectionLabel>IN THE DISCOURSES</SectionLabel>
            {qa.discourses.map((d, i) => (
              <Quote key={i} quote={d.quote} cite={d.citation} />
            ))}
          </>
        ) : null}

        {qa.actionable_steps.length > 0 ? (
          <>
            <SectionLabel>ACTIONABLE STEPS</SectionLabel>
            {qa.actionable_steps.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepText}>{s.step}</Text>
                  <Text style={styles.cite}>{s.citation}</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        <SectionLabel>MAKE IT REAL</SectionLabel>
        <View style={[styles.quoteCard, styles.makeReal]}>
          <Text style={styles.makeRealText}>{qa.make_it_real}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.cream },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontFamily: SERIF, fontSize: 30, fontWeight: "700", color: C.indigo900, marginBottom: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 22, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 2, color: C.saffronDeep },
  labelLine: { flex: 1, height: 1, backgroundColor: "#ecd9b8" },
  quoteCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10, ...shadow },
  quote: { fontFamily: SERIF, fontSize: 16, lineHeight: 25, color: C.ink },
  cite: { fontSize: 13, color: C.inkSoft, marginTop: 8 },
  stepCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    ...shadow,
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.indigo800,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { color: "#fff", fontWeight: "700" },
  stepBody: { flex: 1 },
  stepText: { fontSize: 15, lineHeight: 23, color: C.ink },
  makeReal: { backgroundColor: C.creamDark },
  makeRealText: { fontFamily: SERIF, fontSize: 17, lineHeight: 26, color: C.indigo900 },
});
