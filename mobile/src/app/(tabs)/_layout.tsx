import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, SERIF } from "../../lib/theme";

function header(title: string) {
  return {
    title,
    headerStyle: { backgroundColor: C.indigo950 },
    headerTintColor: "#fff",
    headerTitleStyle: { fontFamily: SERIF, fontWeight: "700" as const },
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.tabInactive,
        tabBarStyle: { backgroundColor: C.indigo950, borderTopColor: C.indigo800 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" as const },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          ...header("Sai Sandesh"),
          tabBarLabel: "Today",
          tabBarIcon: ({ color, size }) => <Ionicons name="sunny" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          ...header("Topics"),
          tabBarIcon: ({ color, size }) => <Ionicons name="book" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          ...header("Search"),
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          ...header("Archive"),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
