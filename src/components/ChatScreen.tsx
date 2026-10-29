import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ChatScreen() {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 250, 1.5);
  const { conversationId: conversationIdParam } = useLocalSearchParams<{ conversationId: string }>();
  const conversationId = conversationIdParam as Id<"conversations">;
  const conversation = useQuery(
    api.messages.getMessages,
    conversationIdParam ? { conversationId } : "skip",
  );
  const sendMessageMutation = useMutation(api.messages.sendMessage);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [conversation?.messages.length]);

  const sendMessage = async () => {
    const body = draft.trim();
    if (!body || sending || !conversationIdParam) return;
    setSending(true);
    try {
      await sendMessageMutation({ conversationId, body });
      setDraft("");
    } catch (cause) {
      Alert.alert("Message not sent", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!conversationIdParam) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "right", "bottom", "left"]}>
        <StatusBar style="dark" />
        <View style={styles.emptyThread}>
          <Text style={styles.emptyThreadText}>This conversation is unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (conversation === undefined) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "right", "bottom", "left"]}>
        <StatusBar style="dark" />
        <ActivityIndicator style={styles.loading} color="#287BFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "bottom", "left"]}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <View style={[styles.header, { height: 43 * scale, paddingHorizontal: 12 * scale }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to messages"
            hitSlop={8}
            onPress={() => router.back()}
            style={[styles.backButton, { width: 25 * scale }]}
          >
            <SymbolView
              name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
              tintColor="#16181C"
              size={17 * scale}
            />
          </Pressable>

          {conversation.otherUser.avatarUrl ? (
            <Image
              accessibilityLabel={`${conversation.otherUser.displayName} profile photo`}
              contentFit="cover"
              source={{ uri: conversation.otherUser.avatarUrl }}
              style={[styles.headerAvatar, { width: 36 * scale, height: 36 * scale }]}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback, { width: 36 * scale, height: 36 * scale }]}>
              <Text style={[styles.avatarLetter, { fontSize: 14 * scale }]}>
                {conversation.otherUser.displayName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={[styles.headerDetails, { marginLeft: 7 * scale }]}>
            <Text style={[styles.headerName, { fontSize: 13 * scale }]}>
              {conversation.otherUser.displayName}
            </Text>
            <Text style={[styles.headerStatus, { fontSize: 9 * scale, marginTop: 2 * scale }]}>
              @{conversation.otherUser.username}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatBody}
        >
          <ScrollView
            style={styles.thread}
            ref={scrollRef}
            contentContainerStyle={[
              styles.threadContent,
              { paddingHorizontal: 10 * scale, paddingTop: 15 * scale, paddingBottom: 12 * scale },
            ]}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {conversation.messages.length === 0 ? (
              <View style={styles.emptyThread}>
                <Text style={styles.emptyThreadText}>Start the conversation with {conversation.otherUser.displayName}.</Text>
              </View>
            ) : (
              conversation.messages.map((message) => (
                <View key={message._id} style={[styles.messageRow, message.isMine && styles.ownMessageRow]}>
                  {!message.isMine ? (
                    message.senderAvatarUrl ? (
                      <Image
                        accessibilityLabel={`${message.senderName} profile photo`}
                        contentFit="cover"
                        source={{ uri: message.senderAvatarUrl }}
                        style={[styles.messageAvatar, { width: 25 * scale, height: 25 * scale, marginRight: 7 * scale }]}
                      />
                    ) : (
                      <View style={[styles.messageAvatar, styles.avatarFallback, { width: 25 * scale, height: 25 * scale, marginRight: 7 * scale }]}>
                        <Text style={[styles.avatarLetter, { fontSize: 10 * scale }]}>{message.senderName.slice(0, 1).toUpperCase()}</Text>
                      </View>
                    )
                  ) : null}
                  <View style={[styles.messageStack, message.isMine && styles.ownMessageStack]}>
                    <View
                      style={[
                        styles.messageBubble,
                        message.isMine ? styles.outgoingBubble : styles.incomingBubble,
                        { borderRadius: 14 * scale, paddingHorizontal: 11 * scale, paddingVertical: 8 * scale },
                      ]}
                    >
                      <Text style={[message.isMine ? styles.outgoingText : styles.incomingText, { fontSize: 13 * scale, lineHeight: 18 * scale }]}>
                        {message.body}
                      </Text>
                    </View>
                    <Text style={[styles.timestamp, { fontSize: 9 * scale, marginTop: 4 * scale }]}>
                      {formatTime(message.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={[styles.composer, { paddingHorizontal: 12 * scale, paddingTop: 8 * scale, paddingBottom: 8 * scale }]}>
            <View
              style={[
                styles.inputPill,
                {
                  minHeight: 40 * scale,
                  borderRadius: 21 * scale,
                  paddingLeft: 14 * scale,
                  paddingRight: 6 * scale,
                },
              ]}
            >
              <TextInput
                accessibilityLabel="Message"
                onChangeText={setDraft}
                onSubmitEditing={() => void sendMessage()}
                placeholder="Type a message..."
                placeholderTextColor="#858B96"
                returnKeyType="send"
                style={[styles.messageInput, { fontSize: 13 * scale }]}
                value={draft}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                accessibilityState={{ disabled: !draft.trim() || sending }}
                disabled={!draft.trim() || sending}
                onPress={() => void sendMessage()}
                style={[
                  styles.sendButton,
                  (!draft.trim() || sending) && styles.sendButtonDisabled,
                  { width: 32 * scale, height: 32 * scale, borderRadius: 16 * scale },
                ]}
              >
                <SymbolView
                  name={{ ios: "arrow.up", android: "send", web: "send" }}
                  tintColor="#FFFFFF"
                  size={16 * scale}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E9ED",
  },
  backButton: {
    height: "100%",
    justifyContent: "center",
  },
  headerAvatar: {
    borderRadius: 100,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9EEF8",
  },
  avatarLetter: {
    color: "#46566F",
    fontWeight: "700",
  },
  headerDetails: {
    justifyContent: "center",
  },
  headerName: {
    color: "#17191D",
    fontWeight: "600",
  },
  headerStatus: {
    color: "#7D8490",
  },
  headerAction: {
    width: 27,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBody: {
    flex: 1,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    flexGrow: 1,
  },
  emptyThread: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyThreadText: {
    color: "#7C8390",
    fontSize: 13,
    textAlign: "center",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 9,
  },
  ownMessageRow: {
    justifyContent: "flex-end",
  },
  messageStack: {
    maxWidth: "82%",
    alignItems: "flex-start",
  },
  ownMessageStack: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "100%",
  },
  incomingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  messageAvatar: {
    borderRadius: 100,
  },
  incomingContent: {
    alignItems: "flex-start",
  },
  incomingBubble: {
    backgroundColor: "#E9EBF0",
  },
  incomingText: {
    color: "#20242A",
  },
  timestamp: {
    color: "#858C97",
  },
  outgoingGroup: {
    alignItems: "flex-end",
  },
  outgoingBubble: {
    backgroundColor: "#3167F5",
  },
  outgoingText: {
    color: "#FFFFFF",
  },
  sharedPhoto: {
    alignSelf: "flex-end",
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F0F1F4",
  },
  addButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2D65F6",
  },
  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6F8",
    paddingVertical: 4,
  },
  messageInput: {
    flex: 1,
    padding: 0,
    color: "#17191D",
  },
  composerIcon: {
    width: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    flex: 1,
  },
  sendButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2D65F6",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
