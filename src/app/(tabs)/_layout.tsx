import { useAuth } from "@clerk/expo";
import { useQuery } from "convex/react";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const profile = useQuery(api.social.myProfile, isSignedIn ? {} : "skip");

  if (!isLoaded || (isSignedIn && profile === undefined)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator color="#287BFF" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  if (profile === null) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <NativeTabs
      tintColor="#3A86FF"
      labelStyle={{ fontSize: 9, fontWeight: "500" }}
      disableTransparentOnScrollEdge
      tabBarRespectsIMEInsets
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>{t("tabs.home")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home_filled" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>{t("tabs.messages")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="bubble.left.and.bubble.right"
          md={{ default: "chat_bubble_outline", selected: "chat_bubble" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>{t("tabs.explore")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t("tabs.profile")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md={{ default: "person_outline", selected: "person" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}