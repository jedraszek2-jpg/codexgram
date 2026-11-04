import { useAuth } from "@clerk/expo";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ProfileContent } from "../../components/ProfileContent";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const profileId = id as Id<"profiles">;
  const data = useQuery(
    api.social.profileById,
    isSignedIn && id ? { profileId } : "skip",
  );
  const toggleFollow = useMutation(api.social.toggleFollow);
  const [followPending, setFollowPending] = useState(false);

  const follow = async () => {
    if (!data || followPending || data.profile.isOwnProfile) return;
    setFollowPending(true);
    try {
      await toggleFollow({ profileId: data.profile._id });
    } catch (cause) {
      Alert.alert("Follow failed", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setFollowPending(false);
    }
  };

  if (data === undefined) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
        <ActivityIndicator style={styles.loading} color="#287BFF" />
      </SafeAreaView>
    );
  }

  if (data === null) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
        <StatusBar style="dark" />
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <View style={styles.unavailable}>
          <Text style={styles.unavailableTitle}>Profile unavailable</Text>
          <Text style={styles.unavailableText}>This profile may have been removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>{data.profile.displayName}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ProfileContent
          profile={data.profile}
          posts={data.posts}
          onFollow={() => void follow()}
          followPending={followPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingBottom: 4 },
  header: { height: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  backButton: { minWidth: 48, height: 36, justifyContent: "center" },
  backLabel: { color: "#287BFF", fontSize: 14, fontWeight: "600" },
  title: { flex: 1, textAlign: "center", color: "#111114", fontSize: 14, fontWeight: "700" },
  headerSpacer: { minWidth: 48 },
  loading: { flex: 1 },
  unavailable: { flex: 1, alignItems: "center", justifyContent: "center" },
  unavailableTitle: { color: "#111114", fontSize: 16, fontWeight: "700" },
  unavailableText: { marginTop: 6, color: "#687386", fontSize: 13 },
});