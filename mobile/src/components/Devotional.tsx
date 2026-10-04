import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import { C, SERIF, shadow } from "../lib/theme";
import { resolveUrl } from "../lib/api";
import type { Devotional } from "../lib/types";

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{children}</Text>
      <View style={styles.labelLine} />
    </View>
  );
}

function Card({ children, tint }: { children: React.ReactNode; tint?: string }) {
  return <View style={[styles.card, tint ? { backgroundColor: tint } : null]}>{children}</View>;
}

export default function DevotionalView({ data }: { data: Devotional }) {
  const [sharing, setSharing] = useState(false);
  const cardImageUrl = resolveUrl(data.share_card);

  const shareText =
    `${data.greeting}\n\n"${data.discourse.excerpt}"\n` +
    `— ${data.discourse.title}${data.discourse.volume ? `, ${data.discourse.volume}` : ""}\n\n` +
    `Sai Sandesh`;

  async function onShare() {
    if (sharing) return;
    setSharing(true);
    try {
      let url: string | undefined;
      if (cardImageUrl) {
        const dest = new File(Paths.cache, `saisandesh-${data.date}.png`);
        try {
          const task = File.createDownloadTask(cardImageUrl, dest);
          const file = await task.downloadAsync();
          if (file) url = file.uri;
        } catch {
          url = undefined; // text-only share if the image can't be fetched
        }
      }
      await Share.share({ message: shareText, url, title: "Sai Sandesh" });
    } catch (e) {
      Alert.alert("Couldn't share", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSharing(false);
    }
  }

  async function onCopyExcerpt() {
    await Clipboard.setStringAsync(
      `"${data.discourse.excerpt}"\n— ${data.discourse.title}, ${data.discourse.volume}`
    );
    Alert.alert("Copied", "The day's excerpt is on your clipboard.");
  }

  const citation = [data.discourse.date, data.discourse.occasion, data.discourse.volume]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.wrap}>
      <Text style={styles.greeting}>{data.greeting}</Text>

      <SectionLabel>ON THIS DAY</SectionLabel>
      <Card>
        {data.discourse.theme ? <Text style={styles.theme}>{data.discourse.theme}</Text> : null}
        <Text style={styles.excerpt}>{data.discourse.excerpt}</Text>
        <Text style={styles.citation}>
          {data.discourse.title}
          {citation ? ` — ${citation}` : ""}
        </Text>
      </Card>

      <SectionLabel>REFLECTION</SectionLabel>
      <Card>
        <Text style={styles.body}>{data.reflection}</Text>
      </Card>

      {data.video ? (
        <>
          <SectionLabel>WATCH</SectionLabel>
          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
            onPress={() => Linking.openURL(data.video!.url)}
          >
            <Text style={styles.btnPrimaryText}>▶  {data.video.title}</Text>
          </Pressable>
        </>
      ) : null}

      <SectionLabel>BHAJAN</SectionLabel>
      <Card>
        <Text style={styles.bhajanTitle}>{data.bhajan.title}</Text>
        {data.bhajan.url ? (
          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}
            onPress={() => Linking.openURL(data.bhajan.url!)}
          >
            <Text style={styles.btnOutlineText}>Listen</Text>
          </Pressable>
        ) : null}
      </Card>

      <SectionLabel>SEVA NUDGE</SectionLabel>
      <Card tint={C.creamDark}>
        <Text style={styles.body}>{data.seva_nudge}</Text>
      </Card>

      {cardImageUrl ? (
        <>
          <SectionLabel>SHARE CARD</SectionLabel>
          <View style={styles.cardImageWrap}>
            <Image source={{ uri: cardImageUrl }} style={styles.cardImage} resizeMode="contain" />
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnIndigo, pressed && styles.pressed]}
          onPress={onShare}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Share</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}
          onPress={onCopyExcerpt}
        >
          <Text style={styles.btnOutlineText}>Copy excerpt</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 32 },
  greeting: {
    fontFamily: SERIF,
    fontSize: 32,
    fontWeight: "700",
    color: C.indigo900,
    marginTop: 8,
    marginBottom: 12,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, marginBottom: 8 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: C.saffronDeep,
  },
  labelLine: { flex: 1, height: 1, backgroundColor: "#ecd9b8" },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    ...shadow,
  },
  theme: { fontWeight: "700", color: C.saffronDeep, marginBottom: 6, fontSize: 16 },
  excerpt: { fontFamily: SERIF, fontSize: 17, lineHeight: 26, color: C.ink },
  citation: { fontSize: 14, color: C.inkSoft, marginTop: 10 },
  body: { fontSize: 16, lineHeight: 25, color: C.ink },
  bhajanTitle: { fontFamily: SERIF, fontSize: 18, color: C.ink, marginBottom: 12 },
  cardImageWrap: {
    borderRadius: 18,
    overflow: "hidden",
    ...shadow,
  },
  cardImage: { width: "100%", aspectRatio: 9 / 16, backgroundColor: C.indigo950 },
  actions: { flexDirection: "row", gap: 12, marginTop: 24 },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: C.saffron },
  btnIndigo: { backgroundColor: C.indigo800 },
  btnOutline: { backgroundColor: "transparent", borderWidth: 2, borderColor: C.indigo800 },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
  btnOutlineText: { color: C.indigo800, fontWeight: "700", fontSize: 16 },
  pressed: { opacity: 0.85 },
});
