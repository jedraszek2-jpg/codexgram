import { useAuth } from "@clerk/expo";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Redirect } from "expo-router";
import { View } from "react-native";

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });

  if (!isLoaded && !isSignedIn) {
    return <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} />;
  }

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <NativeTabs
      tintColor="#3A86FF"
      labelStyle={{ fontSize: 9, fontWeight: "500" }}
      disableTransparentOnScrollEdge
      tabBarRespectsIMEInsets
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home_filled" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="bubble.left.and.bubble.right"
          md={{ default: "chat_bubble_outline", selected: "chat_bubble" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md={{ default: "person_outline", selected: "person" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}