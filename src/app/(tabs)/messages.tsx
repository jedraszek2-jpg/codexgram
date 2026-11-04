import { useAuth } from "@clerk/expo";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MessagesTab() {
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const conversations = useQuery(
    api.messages.getMyConversations,
    isSignedIn ? {} : "skip",
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Messages</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New message"
          onPress={() => router.push("/new-message")}
          style={({ pressed }) => [styles.newMessageButton, pressed && styles.pressed]}
        >
          <SymbolView name={{ ios: "square.and.pencil", android: "edit", web: "edit" }} tintColor="#287BFF" size={23} />
        </Pressable>
      </View>

      {conversations === undefined ? (
        <ActivityIndicator style={styles.loading} color="#287BFF" />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <SymbolView name={{ ios: "bubble.left.and.bubble.right", android: "chat", web: "chat" }} tintColor="#287BFF" size={28} />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>Start a conversation with someone you follow.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/new-message")} style={styles.emptyAction}>
            <Text style={styles.emptyActionText}>New message</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {conversations.map((conversation) => {
            const { otherUser, lastMessage } = conversation;
            const preview = lastMessage
              ? `${lastMessage.isMine ? "You: " : ""}${lastMessage.body}`
              : "Start a conversation";
            return (
              <Pressable
                key={conversation.conversationId}
                accessibilityRole="button"
                accessibilityLabel={`Open conversation with ${otherUser.displayName}`}
                onPress={() => router.push({ pathname: "/chat", params: { conversationId: conversation.conversationId } })}
                style={({ pressed }) => [styles.conversation, pressed && styles.pressed]}
              >
                {otherUser.avatarUrl ? (
                  <Image source={{ uri: otherUser.avatarUrl }} contentFit="cover" style={styles.avatar} accessibilityLabel={`${otherUser.displayName} profile photo`} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarLetter}>{otherUser.displayName.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.conversationText}>
                  <View style={styles.conversationTopline}>
                    <Text numberOfLines={1} style={styles.name}>{otherUser.displayName}</Text>
                    {lastMessage ? <Text style={styles.time}>{formatTime(lastMessage.createdAt)}</Text> : null}
                  </View>
                  <Text numberOfLines={1} style={styles.preview}>{preview}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  headingRow: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  heading: { color: "#11141B", fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  newMessageButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  pressed: { opacity: 0.72 },
  loading: { flex: 1 },
  list: { paddingBottom: 20 },
  conversation: { flexDirection: "row", alignItems: "center", minHeight: 76, paddingHorizontal: 18, paddingVertical: 10 },
  avatar: { width: 49, height: 49, borderRadius: 25, marginRight: 12 },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9EEF8" },
  avatarLetter: { color: "#46566F", fontSize: 18, fontWeight: "700" },
  conversationText: { flex: 1 },
  conversationTopline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  name: { flex: 1, color: "#16191F", fontSize: 15, fontWeight: "600" },
  time: { color: "#7C8390", fontSize: 11 },
  preview: { marginTop: 5, color: "#717986", fontSize: 12 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingBottom: 50 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: "#EDF4FF" },
  emptyTitle: { marginTop: 18, color: "#11141B", fontSize: 18, fontWeight: "700" },
  emptyText: { marginTop: 7, color: "#717986", fontSize: 13, textAlign: "center", lineHeight: 19 },
  emptyAction: { marginTop: 18, minHeight: 42, paddingHorizontal: 22, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#287BFF" },
  emptyActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
