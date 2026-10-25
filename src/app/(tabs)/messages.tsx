import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MessagesTab() {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />
      <Text style={styles.heading}>Messages</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open conversation with Kasia"
        onPress={() => router.push("/chat")}
        style={({ pressed }) => [styles.conversation, pressed && styles.pressed]}
      >
        <Image
          accessibilityLabel="Kasia's profile photo"
          contentFit="cover"
          source={require("../../../assets/images/home-story-kasia.png")}
          style={styles.avatar}
        />
        <View style={styles.conversationText}>
          <View style={styles.conversationTopline}>
            <Text style={styles.name}>Kasia</Text>
            <Text style={styles.time}>10:29</Text>
          </View>
          <Text numberOfLines={1} style={styles.preview}>
            Cudownie! Zobacz to miejsce 😍😎
          </Text>
        </View>
        <View style={styles.unreadDot} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  heading: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 14,
    color: "#11141B",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  conversation: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.72,
  },
  avatar: {
    width: 49,
    height: 49,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationText: {
    flex: 1,
  },
  conversationTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    color: "#16191F",
    fontSize: 15,
    fontWeight: "600",
  },
  time: {
    color: "#7C8390",
    fontSize: 11,
  },
  preview: {
    marginTop: 5,
    color: "#717986",
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: "#3267F5",
  },
});