import { useAuth } from "@clerk/expo";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Activity = {
  _id: Id<"activities">;
  type: "like" | "comment" | "follow";
  postId: Id<"posts"> | null;
  createdAt: number;
  isRead: boolean;
  actor: {
    _id: Id<"profiles">;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export default function ActivityScreen() {
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const activities = useQuery(api.activities.getMyActivities, isSignedIn ? {} : "skip");

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} tintColor="#1F1F1F" size={21} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>Activity</Text>
        <View style={styles.headerButton} />
      </View>

      <FlatList
        data={activities ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ActivityRow activity={item} />}
        contentContainerStyle={activities?.length ? styles.listContent : styles.emptyContent}
        ListEmptyComponent={
          activities === undefined ? (
            <ActivityIndicator color="#3A86FF" />
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <SymbolView name={{ ios: "bell", android: "notifications_none", web: "notifications_none" }} tintColor="#3A86FF" size={28} />
              </View>
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptyText}>Likes, comments, and new followers will show up here.</Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const openDestination = () => {
    if (activity.type !== "follow" && activity.postId) {
      router.push({ pathname: "/post/[id]", params: { id: activity.postId } });
      return;
    }
    router.push({ pathname: "/user/[id]", params: { id: activity.actor._id } });
  };

  const action = activity.type === "like"
    ? "liked your post"
    : activity.type === "comment"
      ? "commented on your post"
      : "started following you";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${activity.actor.displayName} ${action}`}
      onPress={openDestination}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {activity.actor.avatarUrl ? (
        <Image
          source={{ uri: activity.actor.avatarUrl }}
          contentFit="cover"
          style={styles.avatar}
          accessibilityLabel={`${activity.actor.displayName} profile photo`}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>{activity.actor.displayName.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.activityText}>
        <Text style={styles.message}>
          <Text style={styles.actorName}>{activity.actor.displayName}</Text>{" "}{action}
        </Text>
        <Text style={styles.time}>{timeAgo(activity.createdAt)}</Text>
      </View>
      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
        tintColor="#A0A5AC"
        size={16}
      />
    </Pressable>
  );
}

function timeAgo(createdAt: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(createdAt).toLocaleDateString();
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ECEEF1",
  },
  headerButton: { width: 42, height: 42, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { color: "#1F1F1F", fontSize: 17, fontWeight: "700" },
  listContent: { paddingVertical: 6 },
  emptyContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 36 },
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9EEF8" },
  avatarLetter: { color: "#46566F", fontSize: 17, fontWeight: "700" },
  activityText: { flex: 1 },
  message: { color: "#333943", fontSize: 13, lineHeight: 19 },
  actorName: { color: "#1F1F1F", fontWeight: "700" },
  time: { marginTop: 3, color: "#969DA7", fontSize: 11 },
  emptyState: { alignItems: "center" },
  emptyIcon: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF5FF" },
  emptyTitle: { marginTop: 16, color: "#1F1F1F", fontSize: 17, fontWeight: "700" },
  emptyText: { marginTop: 6, color: "#7A828E", fontSize: 13, lineHeight: 19, textAlign: "center" },
  pressed: { backgroundColor: "#F7F9FC" },
});
