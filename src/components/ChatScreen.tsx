import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import {
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

type SentMessage = {
  id: string;
  text: string;
};

export default function ChatScreen() {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 250, 1.5);
  const [draft, setDraft] = useState("");
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const scrollRef = useRef<ScrollView | null>(null);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    setSentMessages((current) => [...current, { id: Date.now().toString(), text }]);
    setDraft("");
  };

  const showUnavailable = (title: string) => {
    Alert.alert(title, "This action is not connected yet.");
  };

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

          <Image
            accessibilityLabel="Kasia's profile photo"
            contentFit="cover"
            source={require("../../assets/images/home-story-kasia.png")}
            style={[styles.headerAvatar, { width: 28 * scale, height: 28 * scale }]}
          />

          <View style={[styles.headerDetails, { marginLeft: 7 * scale }]}>
            <Text style={[styles.headerName, { fontSize: 12 * scale }]}>Kasia</Text>
            <Text style={[styles.headerStatus, { fontSize: 8 * scale, marginTop: 2 * scale }]}>
              Active 1h ago
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call Kasia"
            hitSlop={8}
            onPress={() => showUnavailable("Call")}
            style={[styles.headerAction, { marginLeft: "auto" }]}
          >
            <SymbolView
              name={{ ios: "phone", android: "call", web: "call" }}
              tintColor="#17191D"
              size={17 * scale}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More conversation options"
            hitSlop={8}
            onPress={() => showUnavailable("Conversation options")}
            style={[styles.headerAction, { marginLeft: 7 * scale }]}
          >
            <SymbolView
              name={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }}
              tintColor="#17191D"
              size={20 * scale}
            />
          </Pressable>
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
            <View style={styles.incomingRow}>
              <Image
                accessibilityLabel="Kasia"
                contentFit="cover"
                source={require("../../assets/images/home-story-kasia.png")}
                style={[
                  styles.messageAvatar,
                  { width: 21 * scale, height: 21 * scale, marginRight: 8 * scale },
                ]}
              />
              <View style={styles.incomingContent}>
                <View style={[styles.incomingBubble, { borderRadius: 14 * scale, paddingHorizontal: 9 * scale, paddingVertical: 6 * scale }]}>
                  <Text style={[styles.incomingText, { fontSize: 10 * scale, lineHeight: 13 * scale }]}>
                    Cześć! Jak tam podróż?
                  </Text>
                </View>
                <Text style={[styles.timestamp, { fontSize: 8 * scale, marginTop: 4 * scale }]}>
                  10:24
                </Text>
              </View>
            </View>

            <View style={[styles.outgoingGroup, { marginTop: 7 * scale }]}>
              <View
                style={[
                  styles.outgoingBubble,
                  {
                    maxWidth: 145 * scale,
                    borderRadius: 12 * scale,
                    paddingHorizontal: 10 * scale,
                    paddingVertical: 6 * scale,
                  },
                ]}
              >
                <Text style={[styles.outgoingText, { fontSize: 10 * scale, lineHeight: 13 * scale }]}>
                  Cudownie! Zobacz to miejsce 😍😎
                </Text>
              </View>
              <Image
                accessibilityLabel="A photo of the Amalfi coast"
                contentFit="cover"
                source={require("../../assets/images/chat-coast-photo.png")}
                style={[
                  styles.sharedPhoto,
                  {
                    width: 153 * scale,
                    height: 88 * scale,
                    borderRadius: 11 * scale,
                    marginTop: 3 * scale,
                  },
                ]}
              />
              <Text style={[styles.timestamp, { fontSize: 8 * scale, marginTop: 3 * scale }]}>
                10:29
              </Text>
            </View>

            <View style={[styles.incomingRow, { marginTop: 7 * scale }]}>
              <Image
                accessibilityLabel="Kasia"
                contentFit="cover"
                source={require("../../assets/images/home-story-kasia.png")}
                style={[
                  styles.messageAvatar,
                  { width: 21 * scale, height: 21 * scale, marginRight: 8 * scale },
                ]}
              />
              <View style={styles.incomingContent}>
                <View style={[styles.incomingBubble, { borderRadius: 14 * scale, paddingHorizontal: 9 * scale, paddingVertical: 6 * scale }]}>
                  <Text style={[styles.incomingText, { fontSize: 10 * scale, lineHeight: 13 * scale }]}>
                    Wow ! 😍
                  </Text>
                </View>
                <View
                  style={[
                    styles.incomingBubble,
                    { borderRadius: 14 * scale, paddingHorizontal: 9 * scale, paddingVertical: 6 * scale, marginTop: 6 * scale },
                  ]}
                >
                  <Text style={[styles.incomingText, { fontSize: 10 * scale, lineHeight: 13 * scale }]}>
                    Kiedy tam jedziesz?
                  </Text>
                </View>
                <Text style={[styles.timestamp, { fontSize: 8 * scale, marginTop: 4 * scale }]}>
                  10:28
                </Text>
              </View>
            </View>

            <View style={[styles.outgoingGroup, { marginTop: 7 * scale }]}>
              <View
                style={[
                  styles.outgoingBubble,
                  {
                    maxWidth: 145 * scale,
                    borderRadius: 12 * scale,
                    paddingHorizontal: 10 * scale,
                    paddingVertical: 6 * scale,
                  },
                ]}
              >
                <Text style={[styles.outgoingText, { fontSize: 10 * scale, lineHeight: 13 * scale }]}>
                  Może w przyszłym miesiącu 😌
                </Text>
              </View>
              <Text style={[styles.timestamp, { fontSize: 8 * scale, marginTop: 3 * scale }]}>
                10:29
              </Text>
            </View>

            {sentMessages.map((message) => (
              <View key={message.id} style={[styles.outgoingGroup, { marginTop: 7 * scale }]}>
                <View
                  style={[
                    styles.outgoingBubble,
                    {
                      maxWidth: 205 * scale,
                      borderRadius: 12 * scale,
                      paddingHorizontal: 10 * scale,
                      paddingVertical: 7 * scale,
                    },
                  ]}
                >
                  <Text style={[styles.outgoingText, { fontSize: 10 * scale, lineHeight: 13 * scale }]}>
                    {message.text}
                  </Text>
                </View>
                <Text style={[styles.timestamp, { fontSize: 8 * scale, marginTop: 3 * scale }]}>
                  Now
                </Text>
              </View>
            ))}
          </ScrollView>

          <View
            style={[
              styles.composer,
              { paddingHorizontal: 11 * scale, paddingTop: 6 * scale, paddingBottom: 6 * scale },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More message actions"
              onPress={() => showUnavailable("More actions")}
              style={[
                styles.addButton,
                { width: 24 * scale, height: 24 * scale, borderRadius: 12 * scale },
              ]}
            >
              <SymbolView
                name={{ ios: "plus", android: "add", web: "add" }}
                tintColor="#FFFFFF"
                size={16 * scale}
              />
            </Pressable>

            <View
              style={[
                styles.inputPill,
                {
                  height: 30 * scale,
                  borderRadius: 17 * scale,
                  paddingLeft: 9 * scale,
                  paddingRight: 5 * scale,
                  marginLeft: 5 * scale,
                },
              ]}
            >
              <TextInput
                accessibilityLabel="Message"
                onChangeText={setDraft}
                onSubmitEditing={sendMessage}
                placeholder="Message..."
                placeholderTextColor="#858B96"
                returnKeyType="send"
                style={[styles.messageInput, { fontSize: 10 * scale }]}
                value={draft}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach a photo"
                hitSlop={6}
                onPress={() => showUnavailable("Photo sharing")}
                style={styles.composerIcon}
              >
                <SymbolView
                  name={{ ios: "photo", android: "image", web: "image" }}
                  tintColor="#252A31"
                  size={16 * scale}
                />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={draft.trim() ? "Send message" : "Record a voice message"}
              onPress={draft.trim() ? sendMessage : () => showUnavailable("Voice messages")}
              style={[styles.voiceButton, { width: 29 * scale, height: 30 * scale, marginLeft: 4 * scale }]}
            >
              <SymbolView
                name={
                  draft.trim()
                    ? { ios: "arrow.up", android: "send", web: "send" }
                    : { ios: "mic", android: "mic", web: "mic" }
                }
                tintColor={draft.trim() ? "#FFFFFF" : "#1D2229"}
                size={16 * scale}
              />
            </Pressable>
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
});