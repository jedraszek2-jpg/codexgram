import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

type Story = {
  label: string;
  image: number;
  ring: string;
  isOwn?: boolean;
};


const stories: Story[] = [
  {
    label: "Your story",
    image: require("../../assets/images/home-story-you.png"),
    ring: "#D9DDE4",
    isOwn: true,
  },
  {
    label: "annas",
    image: require("../../assets/images/home-story-anna.png"),
    ring: "#EE4B88",
  },
  {
    label: "tomasz",
    image: require("../../assets/images/home-story-tomasz.png"),
    ring: "#9B55D8",
  },
  {
    label: "kasia.travel",
    image: require("../../assets/images/home-story-kasia.png"),
    ring: "#F2784B",
  },
  {
    label: "Friends",
    image: require("../../assets/images/home-story-anna.png"),
    ring: "#D84DAD",
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [liked, setLiked] = useState(true);
  const [saved, setSaved] = useState(false);


  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Image
          source={require("../../assets/images/home-wordmark.png")}
          style={styles.wordmark}
          contentFit="contain"
          accessibilityLabel="Codexgram"
        />
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a post"
            hitSlop={8}
            onPress={() => Alert.alert("Create a post", "Post creation is coming soon.")}
            style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          >
            <SymbolView
              name={{ ios: "plus", android: "add", web: "add" }}
              tintColor="#FFFFFF"
              size={18}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
            onPress={() => Alert.alert("Notifications", "You're all caught up.")}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
          >
            <SymbolView
              name={{ ios: "bell", android: "notifications", web: "notifications" }}
              tintColor="#1F1F1F"
              size={23}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stories}
        >
          {stories.map((story) => (
            <StoryItem key={story.label} story={story} />
          ))}
        </ScrollView>

        <View style={styles.postHeader}>
          <Image
            source={require("../../assets/images/home-story-anna.png")}
            style={styles.postAvatar}
            contentFit="cover"
            accessibilityLabel="annas profile photo"
          />
          <View style={styles.postUser}>
            <Text style={styles.username}>annas</Text>
            <Text style={styles.location}>Kraków, Polska</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More post options"
            hitSlop={10}
            onPress={() => Alert.alert("Post options", "More post options are coming soon.")}
            style={styles.moreButton}
          >
            <SymbolView
              name={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }}
              tintColor="#1F1F1F"
              size={22}
            />
          </Pressable>
        </View>

        <Image
          source={require("../../assets/images/home-post-dog.png")}
          style={[styles.postImage, { width, height: width * (159 / 228) }]}
          contentFit="cover"
          accessibilityLabel="Golden retriever in a field of purple flowers"
          transition={150}
        />

        <View style={styles.postDetails}>
          <View style={styles.actionRow}>
            <View style={styles.actionGroup}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={liked ? "Unlike post" : "Like post"}
                accessibilityState={{ selected: liked }}
                hitSlop={8}
                onPress={() => setLiked((value) => !value)}
                style={styles.actionButton}
              >
                <SymbolView
                  name={{
                    ios: liked ? "heart.fill" : "heart",
                    android: liked ? "favorite" : "favorite_border",
                    web: liked ? "favorite" : "favorite_border",
                  }}
                  tintColor={liked ? "#F04444" : "#1F1F1F"}
                  size={23}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View comments"
                hitSlop={8}
                onPress={() => Alert.alert("Comments", "Comments are coming soon.")}
                style={styles.actionButton}
              >
                <SymbolView
                  name={{
                    ios: "bubble.left",
                    android: "chat_bubble_outline",
                    web: "chat_bubble_outline",
                  }}
                  tintColor="#1F1F1F"
                  size={22}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share post"
                hitSlop={8}
                onPress={() => Alert.alert("Share", "Sharing is coming soon.")}
                style={styles.actionButton}
              >
                <SymbolView
                  name={{ ios: "paperplane", android: "send", web: "send" }}
                  tintColor="#1F1F1F"
                  size={21}
                />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? "Remove saved post" : "Save post"}
              accessibilityState={{ selected: saved }}
              hitSlop={8}
              onPress={() => setSaved((value) => !value)}
              style={styles.actionButton}
            >
              <SymbolView
                name={{
                  ios: saved ? "bookmark.fill" : "bookmark",
                  android: saved ? "bookmark" : "bookmark_border",
                  web: saved ? "bookmark" : "bookmark_border",
                }}
                tintColor="#1F1F1F"
                size={22}
              />
            </Pressable>
          </View>

          <Text style={styles.likes}>{liked ? "1 248 likes" : "1 247 likes"}</Text>
          <Text style={styles.caption}>
            <Text style={styles.captionName}>annas</Text>
            {" Najlepsze chwile "}
            <Text>❤️</Text>
          </Text>
          <Text style={styles.hashtags}>#nature #dog #summer</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all 28 comments"
            onPress={() => Alert.alert("Comments", "Comments are coming soon.")}
            hitSlop={4}
          >
            <Text style={styles.comments}>View all 28 comments</Text>
          </Pressable>
          <Text style={styles.timestamp}>2 hours ago</Text>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

function StoryItem({ story }: { story: Story }) {
  const title = story.isOwn ? "Your story" : story.label + "'s story";
  const label = story.isOwn ? "Add to your story" : "View " + title;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() =>
        Alert.alert(
          title,
          story.isOwn ? "Story creation is coming soon." : "Story viewer is coming soon.",
        )
      }
      style={({ pressed }) => [styles.storyItem, pressed && styles.pressed]}
    >
      <View style={[styles.storyRing, { borderColor: story.ring }]}>
        <Image source={story.image} style={styles.storyImage} contentFit="cover" />
        {story.isOwn ? (
          <View style={styles.storyAdd}>
            <SymbolView
              name={{ ios: "plus", android: "add", web: "add" }}
              tintColor="#FFFFFF"
              size={12}
            />
          </View>
        ) : null}
      </View>
      <Text style={styles.storyLabel} numberOfLines={1}>
        {story.label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
  },
  wordmark: {
    width: 168,
    height: 34,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  createButton: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3A86FF",
  },
  headerIconButton: {
    width: 28,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 8,
  },
  stories: {
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 3,
    paddingBottom: 8,
  },
  storyItem: {
    width: 54,
    alignItems: "center",
  },
  storyRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  storyImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  storyAdd: {
    position: "absolute",
    right: -2,
    bottom: -1,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderColor: "#FFFFFF",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3A86FF",
  },
  storyLabel: {
    maxWidth: 62,
    marginTop: 4,
    color: "#1F1F1F",
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
  },
  postHeader: {
    height: 43,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
  },
  postAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  postUser: {
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
  },
  username: {
    color: "#1F1F1F",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
  },
  location: {
    color: "#626B77",
    fontSize: 10.5,
    lineHeight: 13,
  },
  moreButton: {
    width: 28,
    height: 30,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  postImage: {
    alignSelf: "center",
    backgroundColor: "#F6F6F6",
  },
  postDetails: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  actionRow: {
    height: 37,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  actionButton: {
    minWidth: 22,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  likes: {
    color: "#1F1F1F",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  caption: {
    color: "#1F1F1F",
    fontSize: 12,
    lineHeight: 16,
  },
  captionName: {
    fontWeight: "700",
  },
  hashtags: {
    color: "#1673D1",
    fontSize: 12,
    lineHeight: 16,
  },
  comments: {
    color: "#777F8B",
    fontSize: 11,
    lineHeight: 15,
  },
  timestamp: {
    color: "#A0A5AC",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.72,
  },
});
