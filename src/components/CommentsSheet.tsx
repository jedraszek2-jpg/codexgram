import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  postId: Id<"posts"> | null;
  visible: boolean;
  onClose: () => void;
};

export function CommentsSheet({ postId, visible, onClose }: Props) {
  const comments = useQuery(api.social.commentsForPost, postId ? { postId } : "skip");
  const addComment = useMutation(api.social.addComment);
  const removeComment = useMutation(api.social.removeComment);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!postId || !body.trim() || sending) return;
    setSending(true);
    try {
      await addComment({ postId, body });
      setBody("");
    } catch (cause) {
      Alert.alert("Comment failed", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = (commentId: Id<"comments">) => {
    Alert.alert("Delete comment?", "This comment will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void removeComment({ commentId }).catch((cause: unknown) => {
            Alert.alert("Delete failed", cause instanceof Error ? cause.message : "Please try again.");
          });
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close comments" onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>Comments</Text>
            <View style={styles.headerSpacer} />
          </View>

          <FlatList
            data={comments ?? []}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {comments === undefined ? "Loading comments..." : "Be the first to comment."}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarLetter}>{item.authorName.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.commentText}>
                  <Text style={styles.commentBody}>
                    <Text style={styles.username}>{item.authorName}</Text>
                    {"  "}{item.body}
                  </Text>
                </View>
                {item.canDelete ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete comment"
                    hitSlop={8}
                    onPress={() => confirmDelete(item._id)}
                  >
                    <Text style={styles.delete}>Delete</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          />

          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Write a comment"
              maxLength={500}
              multiline
              onChangeText={setBody}
              placeholder="Add a comment..."
              placeholderTextColor="#8A9099"
              style={styles.input}
              value={body}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Post comment"
              disabled={!body.trim() || sending}
              onPress={() => void submit()}
              style={[styles.sendButton, (!body.trim() || sending) && styles.disabled]}
            >
              <Text style={styles.sendText}>{sending ? "..." : "Post"}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1 },
  header: {
    height: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  close: { color: "#3A86FF", fontSize: 14, minWidth: 44 },
  title: { color: "#1F1F1F", fontSize: 16, fontWeight: "700" },
  headerSpacer: { width: 44 },
  list: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  empty: { color: "#78808C", fontSize: 14, textAlign: "center", marginTop: 30 },
  commentRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarFallback: { backgroundColor: "#E9EEF8", alignItems: "center", justifyContent: "center" },
  avatarLetter: { color: "#46566F", fontWeight: "700" },
  commentText: { flex: 1, paddingHorizontal: 10 },
  commentBody: { color: "#252932", fontSize: 13, lineHeight: 19 },
  username: { color: "#1F1F1F", fontWeight: "700" },
  delete: { color: "#7A828E", fontSize: 11, paddingTop: 3 },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    maxHeight: 96,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F4F5F7",
    color: "#20242C",
    fontSize: 14,
  },
  sendButton: { paddingHorizontal: 10, paddingVertical: 9 },
  sendText: { color: "#3A86FF", fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.45 },
});