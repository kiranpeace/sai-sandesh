import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DevotionalView from "../../components/Devotional";
import { ErrorView, Loading } from "../../components/LoadState";
import { getToday } from "../../lib/api";
import { C } from "../../lib/theme";
import type { Devotional } from "../../lib/types";

export default function TodayScreen() {
  const [data, setData] = useState<Devotional | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getToday());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load today's devotional.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {error && !data ? (
        <ErrorView message={error} onRetry={load} />
      ) : !data ? (
        <Loading label="Loading today's devotional…" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <DevotionalView data={data} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
});
