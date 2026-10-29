import { router } from "expo-router";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { CommentsSheet } from "./CommentsSheet";

type FeedPost = {
  _id: Id<"posts">;
  _creationTime: number;
  author: {
    _id: Id<"profiles">;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  createdAt: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
};

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
    label: "Anna Kowalska",
    image: require("../../assets/images/home-story-anna.png"),
    ring: "#EE4B88",
  },
  {
    label: "Tomasz Nowak",
    image: require("../../assets/images/home-story-tomasz.png"),
    ring: "#9B55D8",
  },
  {
    label: "Kasia Zielinska",
    image: require("../../assets/images/home-story-kasia.png"),
    ring: "#F2784B",
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const feed = useQuery(api.social.homeFeed, {});
  const toggleLike = useMutation(api.social.toggleLike);
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(null);
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());

  const handleLike = async (postId: Id<"posts">) => {
    if (pendingLikes.has(postId)) return;
    setPendingLikes((current) => new Set(current).add(postId));
    try {
      await toggleLike({ postId });
    } catch (cause) {
      Alert.alert("Like failed", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setPendingLikes((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image
            source={require("../../design/logo.png")}
            style={styles.brandLogo}
            contentFit="contain"
            accessible={false}
          />
          <Text accessibilityRole="header" style={styles.brandName}>Codexgram</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a post"
            hitSlop={8}
            onPress={() => router.push("/create-post")}
            style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          >
            <SymbolView name={{ ios: "plus", android: "add", web: "add" }} tintColor="#FFFFFF" size={18} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
            onPress={() => Alert.alert("Notifications", "You're all caught up.")}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
          >
            <SymbolView name={{ ios: "bell", android: "notifications", web: "notifications" }} tintColor="#1F1F1F" size={23} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={feed ?? []}
        keyExtractor={(post) => post._id}
        renderItem={({ item }) => (
          <FeedPostCard
            post={item}
            width={width}
            likePending={pendingLikes.has(item._id)}
            onLike={() => void handleLike(item._id)}
            onComments={() => setSelectedPostId(item._id)}
          />
        )}
        ListHeaderComponent={<StoriesRail />}
        ListEmptyComponent={
          feed === undefined ? (
            <ActivityIndicator color="#3A86FF" style={styles.loading} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Your feed is waiting</Text>
              <Text style={styles.emptyText}>Follow people in Explore or share your first post.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/explore")}
                style={styles.exploreButton}
              >
                <Text style={styles.exploreButtonLabel}>Explore people</Text>
              </Pressable>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={feed?.length ? styles.feedContent : styles.emptyFeed}
      />

      <CommentsSheet
        postId={selectedPostId}
        visible={selectedPostId !== null}
        onClose={() => setSelectedPostId(null)}
      />
    </SafeAreaView>
  );
}

function StoriesRail() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
      {stories.map((story) => <StoryItem key={story.label} story={story} />)}
    </ScrollView>
  );
}

function FeedPostCard({
  post,
  width,
  likePending,
  onLike,
  onComments,
}: {
  post: FeedPost;
  width: number;
  likePending: boolean;
  onLike: () => void;
  onComments: () => void;
}) {
  const mediaHeight = width * (159 / 228);
  const openAuthorProfile = () => router.push({ pathname: "/user/[id]", params: { id: post.author._id } });
  const openPostDetails = () => router.push({ pathname: "/post/[id]", params: { id: post._id } });
  const showPostOptions = () => Alert.alert("Opcje posta", undefined, [
    { text: "Zobacz profil", onPress: openAuthorProfile },
    { text: "Zobacz post", onPress: openPostDetails },
    { text: "Anuluj", style: "cancel" },
  ]);

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"View " + post.author.displayName + "'s profile"}
          onPress={openAuthorProfile}
          style={styles.postAuthor}
        >
          {post.author.avatarUrl ? (
            <Image
              source={{ uri: post.author.avatarUrl }}
              style={styles.postAvatar}
              contentFit="cover"
              accessibilityLabel={post.author.displayName + " profile photo"}
            />
          ) : (
            <View style={[styles.postAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{post.author.displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.postUser}>
            <Text style={styles.username}>{post.author.displayName}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More post options"
          hitSlop={10}
          onPress={showPostOptions}
          style={styles.moreButton}
        >
          <SymbolView name={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }} tintColor="#1F1F1F" size={22} />
        </Pressable>
      </View>

      {post.mediaType === "video" ? (
        <VideoPostMedia uri={post.mediaUrl} width={width} height={mediaHeight} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View post details"
          onPress={openPostDetails}
          style={styles.postPhotoButton}
        >
          <Image
            source={{ uri: post.mediaUrl }}
            style={[styles.postImage, { width, height: mediaHeight }]}
            contentFit="cover"
            accessibilityLabel={"Post by " + post.author.displayName}
            transition={150}
          />
        </Pressable>
      )}

      <View style={styles.postDetails}>
        <View style={styles.actionRow}>
          <View style={styles.actionGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={post.isLiked ? "Unlike post" : "Like post"}
              accessibilityState={{ selected: post.isLiked, disabled: likePending }}
              disabled={likePending}
              hitSlop={8}
              onPress={onLike}
              style={styles.actionButton}
            >
              <SymbolView
                name={{
                  ios: post.isLiked ? "heart.fill" : "heart",
                  android: post.isLiked ? "favorite" : "favorite_border",
                  web: post.isLiked ? "favorite" : "favorite_border",
                }}
                tintColor={post.isLiked ? "#F04444" : "#1F1F1F"}
                size={23}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View comments"
              hitSlop={8}
              onPress={onComments}
              style={styles.actionButton}
            >
              <SymbolView name={{ ios: "bubble.left", android: "chat_bubble_outline", web: "chat_bubble_outline" }} tintColor="#1F1F1F" size={22} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share post"
              hitSlop={8}
              onPress={() => Alert.alert("Share", "Sharing is coming soon.")}
              style={styles.actionButton}
            >
              <SymbolView name={{ ios: "paperplane", android: "send", web: "send" }} tintColor="#1F1F1F" size={21} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.likes}>{post.likeCount.toLocaleString()} likes</Text>
        {post.caption ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View post details"
            onPress={openPostDetails}
          >
            <Text style={styles.caption}>
              <Text style={styles.captionName}>{post.author.displayName}</Text>
              {"  "}{post.caption}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"View " + post.commentCount + " comments"}
          onPress={onComments}
          hitSlop={4}
        >
          <Text style={styles.comments}>
            {post.commentCount > 0 ? "View all " + post.commentCount + " comments" : "Add a comment"}
          </Text>
        </Pressable>
        <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
      </View>
    </View>
  );
}

function VideoPostMedia({ uri, width, height }: { uri: string; width: number; height: number }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.muted = true;
    instance.loop = true;
  });
  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="cover"
      accessibilityLabel="Video post"
      style={[styles.postImage, { width, height }]}
    />
  );
}

function StoryItem({ story }: { story: Story }) {
  const title = story.isOwn ? "Your story" : story.label + "'s story";
  const label = story.isOwn ? "Add to your story" : "View " + title;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => Alert.alert(title, story.isOwn ? "Story creation is coming soon." : "Story viewer is coming soon.")}
      style={({ pressed }) => [styles.storyItem, pressed && styles.pressed]}
    >
      <View style={[styles.storyRing, { borderColor: story.ring }]}>
        <Image source={story.image} style={styles.storyImage} contentFit="cover" />
        {story.isOwn ? (
          <View style={styles.storyAdd}>
            <SymbolView name={{ ios: "plus", android: "add", web: "add" }} tintColor="#FFFFFF" size={12} />
          </View>
        ) : null}
      </View>
      <Text style={styles.storyLabel} numberOfLines={1}>{story.label}</Text>
    </Pressable>
  );
}

function timeAgo(createdAt: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 7 },
  brandLogo: { width: 27, height: 27, borderRadius: 7 },
  brandName: { color: "#1F1F1F", fontSize: 18, fontWeight: "700", letterSpacing: -0.45 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 13 },
  createButton: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3A86FF",
  },
  headerIconButton: { width: 28, height: 30, alignItems: "center", justifyContent: "center" },
  feedContent: { paddingBottom: 8 },
  emptyFeed: { flexGrow: 1 },
  stories: { alignItems: "flex-start", gap: 8, paddingHorizontal: 12, paddingTop: 3, paddingBottom: 8 },
  storyItem: { width: 54, alignItems: "center" },
  storyRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  storyImage: { width: 46, height: 46, borderRadius: 23 },
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
  storyLabel: { maxWidth: 62, marginTop: 4, color: "#1F1F1F", fontSize: 10, lineHeight: 13, textAlign: "center" },
  post: { marginBottom: 12, backgroundColor: "#FFFFFF" },
  postHeader: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  postAuthor: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" },
  postAvatar: { width: 34, height: 34, borderRadius: 17 },
  avatarFallback: { backgroundColor: "#E9EEF8", alignItems: "center", justifyContent: "center" },
  avatarLetter: { color: "#46566F", fontWeight: "700" },
  postUser: { flex: 1, marginLeft: 9, justifyContent: "center" },
  username: { color: "#1F1F1F", fontSize: 13, lineHeight: 16, fontWeight: "700" },
  displayName: { color: "#626B77", fontSize: 10, lineHeight: 13 },
  moreButton: { width: 28, height: 30, alignItems: "flex-end", justifyContent: "center" },
  postPhotoButton: { alignSelf: "center" },
  postImage: { alignSelf: "center", backgroundColor: "#F6F6F6" },
  postDetails: { paddingHorizontal: 15, paddingBottom: 8 },
  actionRow: { height: 38, flexDirection: "row", alignItems: "center" },
  actionGroup: { flexDirection: "row", alignItems: "center", gap: 14 },
  actionButton: { minWidth: 24, minHeight: 30, alignItems: "center", justifyContent: "center" },
  likes: { color: "#1F1F1F", fontSize: 12, lineHeight: 17, fontWeight: "600" },
  caption: { color: "#1F1F1F", fontSize: 12, lineHeight: 17, marginTop: 2 },
  captionName: { fontWeight: "700" },
  comments: { color: "#777F8B", fontSize: 11, lineHeight: 16, marginTop: 2 },
  timestamp: { color: "#A0A5AC", fontSize: 10, lineHeight: 14, marginTop: 2 },
  loading: { marginTop: 42 },
  emptyState: { alignItems: "center", paddingHorizontal: 34, paddingTop: 38 },
  emptyTitle: { color: "#1F1F1F", fontSize: 16, fontWeight: "700" },
  emptyText: { marginTop: 7, color: "#737B87", fontSize: 13, lineHeight: 19, textAlign: "center" },
  exploreButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#3A86FF",
  },
  exploreButtonLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
 pressed: { opacity: 0.72 },
});
