import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { C, SERIF } from "../lib/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="topic/[slug]"
          options={{
            headerStyle: { backgroundColor: C.indigo950 },
            headerTintColor: "#fff",
            headerTitleStyle: { fontFamily: SERIF, fontWeight: "700" },
            title: "Topic",
          }}
        />
        <Stack.Screen
          name="day/[date]"
          options={{
            headerStyle: { backgroundColor: C.indigo950 },
            headerTintColor: "#fff",
            headerTitleStyle: { fontFamily: SERIF, fontWeight: "700" },
            title: "Daily",
          }}
        />
      </Stack>
    </>
  );
}
