import { useClerk } from "@clerk/expo";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { SymbolView } from "expo-symbols";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileContent } from "../../components/ProfileContent";

export default function ProfileTab() {
  const { width } = useWindowDimensions();
  const { signOut } = useClerk();
  const currentProfile = useQuery(api.social.myProfile, {});
  const data = useQuery(
    api.social.profileById,
    currentProfile ? { profileId: currentProfile._id } : "skip",
  );
  const scale = Math.min(width / 250, 1.45);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      Alert.alert("Sign out failed", "Please try again.");
    }
  };

  const showProfileOptions = () => {
    Alert.alert("Profile options", "", [
      { text: "Sign out", style: "destructive", onPress: () => void handleSignOut() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (currentProfile === undefined || (currentProfile && data === undefined)) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
        <ActivityIndicator style={styles.loading} color="#287BFF" />
      </SafeAreaView>
    );
  }

  if (!currentProfile || !data) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
        <Text style={styles.emptyText}>Your profile is unavailable.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, { height: 34 * scale, paddingHorizontal: 10 * scale }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile home"
            onPress={() => Alert.alert("Codexgram", "You are viewing your profile.")}
            hitSlop={8}
            style={styles.topAction}
          >
            <SymbolView name={{ ios: "house", android: "home", web: "home" }} tintColor="#1F1F1F" size={17 * scale} />
          </Pressable>
          <Text style={[styles.handle, { fontSize: 13 * scale }]} numberOfLines={1}>
            {data.profile.username}
          </Text>
          <View style={styles.topRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Camera"
              onPress={() => Alert.alert("Camera", "Camera is coming soon.")}
              hitSlop={8}
              style={styles.topAction}
            >
              <SymbolView name={{ ios: "camera", android: "photo_camera", web: "photo_camera" }} tintColor="#1F1F1F" size={16 * scale} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile options"
              onPress={showProfileOptions}
              hitSlop={8}
              style={styles.topAction}
            >
              <SymbolView name={{ ios: "line.3.horizontal", android: "menu", web: "menu" }} tintColor="#1F1F1F" size={17 * scale} />
            </Pressable>
          </View>
        </View>
        <ProfileContent profile={data.profile} posts={data.posts} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 4 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topAction: { width: 28, height: 32, alignItems: "center", justifyContent: "center" },
  topRightActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  handle: { position: "absolute", left: 50, right: 50, textAlign: "center", color: "#111114", fontWeight: "700" },
  loading: { flex: 1 },
  emptyText: { flex: 1, textAlign: "center", textAlignVertical: "center", color: "#687386" },
});