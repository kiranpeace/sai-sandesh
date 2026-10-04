import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import DevotionalView from "../../components/Devotional";
import { ErrorView, Loading } from "../../components/LoadState";
import { getDay } from "../../lib/api";
import { C } from "../../lib/theme";
import { prettyDate } from "../(tabs)/archive";
import type { Devotional } from "../../lib/types";

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const navigation = useNavigation();
  const [data, setData] = useState<Devotional | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await getDay(date);
      setData(d);
      navigation.setOptions({ title: prettyDate(d.date) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this day.");
    }
  }, [date, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.wrap}>
      {error && !data ? (
        <ErrorView message={error} onRetry={load} />
      ) : !data ? (
        <Loading label="Loading…" />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <DevotionalView data={data} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
});
