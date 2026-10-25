import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { TabList, TabSlot, Tabs, TabTrigger } from "expo-router/ui";
import { StyleSheet, View } from "react-native";

export default function TabsWebLayout() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });

  if (!isLoaded && !isSignedIn) {
    return <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} />;
  }

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger name="home" href="/home" style={styles.tab}>
          Home
        </TabTrigger>
        <TabTrigger name="messages" href="/messages" style={styles.tab}>
          Messages
        </TabTrigger>
        <TabTrigger name="explore" href="/explore" style={styles.tab}>
          Explore
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" style={styles.tab}>
          Profile
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    color: "#687386",
    fontSize: 12,
    textAlign: "center",
  },
});