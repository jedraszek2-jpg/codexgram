import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export default function NewMessageScreen() {
  const following = useQuery(api.social.myFollowing, {});
  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);
  const [openingUserId, setOpeningUserId] = useState<Id<"profiles"> | null>(null);

  const openConversation = async (otherUserId: Id<"profiles">) => {
    if (openingUserId) return;
    setOpeningUserId(otherUserId);
    try {
      const conversationId = await getOrCreateConversation({ otherUserId });
      router.push({ pathname: "/chat", params: { conversationId } });
    } catch (cause) {
      Alert.alert("Couldn't start conversation", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setOpeningUserId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "bottom", "left"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.backButton}>
          <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} tintColor="#20242C" size={20} />
        </Pressable>
        <Text style={styles.title}>New message</Text>
        <View style={styles.headerSpacer} />
      </View>
      <Text style={styles.sectionTitle}>People you follow</Text>

      {following === undefined ? (
        <ActivityIndicator style={styles.loading} color="#287BFF" />
      ) : following.length === 0 ? (
        <View style={styles.emptyState}>
          <SymbolView name={{ ios: "person.2", android: "people", web: "people" }} tintColor="#8993A2" size={30} />
          <Text style={styles.emptyTitle}>No one to message yet</Text>
          <Text style={styles.emptyText}>Follow someone first, then you can start a conversation here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {following.map((person) => {
            const isOpening = openingUserId === person._id;
            return (
              <Pressable
                key={person._id}
                accessibilityRole="button"
                accessibilityLabel={`Start a conversation with ${person.displayName}`}
                accessibilityState={{ disabled: openingUserId !== null }}
                disabled={openingUserId !== null}
                onPress={() => void openConversation(person._id)}
                style={({ pressed }) => [styles.personRow, pressed && styles.pressed, openingUserId !== null && !isOpening && styles.dimmed]}
              >
                {person.avatarUrl ? (
                  <Image source={{ uri: person.avatarUrl }} contentFit="cover" style={styles.avatar} accessibilityLabel={`${person.displayName} profile photo`} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarLetter}>{person.displayName.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.personDetails}>
                  <Text style={styles.displayName}>{person.displayName}</Text>
                  <Text style={styles.username}>@{person.username}</Text>
                </View>
                {isOpening ? (
                  <ActivityIndicator color="#287BFF" />
                ) : (
                  <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} tintColor="#9AA2AE" size={16} />
                )}
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
  header: { height: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  backButton: { width: 42, height: 42, justifyContent: "center" },
  title: { flex: 1, color: "#11141B", fontSize: 17, fontWeight: "700", textAlign: "center" },
  headerSpacer: { width: 42 },
  sectionTitle: { marginHorizontal: 18, marginTop: 14, marginBottom: 8, color: "#687386", fontSize: 13, fontWeight: "600" },
  loading: { flex: 1 },
  list: { paddingBottom: 24 },
  personRow: { minHeight: 70, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 9 },
  pressed: { opacity: 0.72 },
  dimmed: { opacity: 0.62 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9EEF8" },
  avatarLetter: { color: "#46566F", fontSize: 18, fontWeight: "700" },
  personDetails: { flex: 1 },
  displayName: { color: "#17191D", fontSize: 15, fontWeight: "600" },
  username: { marginTop: 3, color: "#7C8390", fontSize: 12 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingBottom: 60 },
  emptyTitle: { marginTop: 15, color: "#17191D", fontSize: 16, fontWeight: "700" },
  emptyText: { marginTop: 7, color: "#717986", fontSize: 13, lineHeight: 19, textAlign: "center" },
});
