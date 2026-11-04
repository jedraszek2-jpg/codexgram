import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { TabList, TabSlot, Tabs, TabTrigger } from "expo-router/ui";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function TabsWebLayout() {
  const { t } = useTranslation();
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#287BFF" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger name="home" href="/home" style={styles.tab}>
          {t("tabs.home")}
        </TabTrigger>
        <TabTrigger name="messages" href="/messages" style={styles.tab}>
          {t("tabs.messages")}
        </TabTrigger>
        <TabTrigger name="explore" href="/explore" style={styles.tab}>
          {t("tabs.explore")}
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" style={styles.tab}>
          {t("tabs.profile")}
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
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