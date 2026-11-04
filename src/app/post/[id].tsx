import { useAuth } from "@clerk/expo";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const { width } = useWindowDimensions();
  const postId = id as Id<"posts"> | undefined;
  const post = useQuery(
    api.social.postById,
    isSignedIn && postId ? { postId } : "skip",
  );
  const comments = useQuery(
    api.social.commentsForPost,
    isSignedIn && postId ? { postId } : "skip",
  );
  const toggleLike = useMutation(api.social.toggleLike);
  const addComment = useMutation(api.social.addComment);
  const removeComment = useMutation(api.social.removeComment);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [likePending, setLikePending] = useState(false);

  const openAuthorProfile = () => {
    if (post) router.push({ pathname: "/user/[id]", params: { id: post.author._id } });
  };

  const showPostOptions = () => {
    if (!post) return;
    Alert.alert("Opcje posta", undefined, [
      { text: "Zobacz profil", onPress: openAuthorProfile },
      { text: "Zobacz post", onPress: () => router.push({ pathname: "/post/[id]", params: { id: post._id } }) },
      { text: "Anuluj", style: "cancel" },
    ]);
  };

  const handleLike = async () => {
    if (!post || likePending) return;
    setLikePending(true);
    try {
      await toggleLike({ postId: post._id });
    } catch (cause) {
      Alert.alert("Like failed", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setLikePending(false);
    }
  };

  const handleAddComment = async () => {
    const body = commentText.trim();
    if (!post || !body || posting) return;
    setPosting(true);
    try {
      await addComment({ postId: post._id, body });
      setCommentText("");
    } catch (cause) {
      Alert.alert("Comment failed", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const confirmRemoveComment = (commentId: Id<"comments">) => {
    Alert.alert("Delete comment?", undefined, [
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void removeComment({ commentId }).catch((cause: unknown) => {
            Alert.alert("Delete failed", cause instanceof Error ? cause.message : "Please try again.");
          });
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left", "bottom"]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.topButton}>
          <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} tintColor="#16191F" size={23} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.screenTitle}>Post</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="More post options" onPress={showPostOptions} style={styles.topButton}>
          <SymbolView name={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }} tintColor="#16191F" size={23} />
        </Pressable>
      </View>

      {post === undefined ? (
        <ActivityIndicator color="#3A86FF" style={styles.loading} />
      ) : !post ? (
        <View style={styles.unavailable}>
          <Text style={styles.unavailableTitle}>Post unavailable</Text>
          <Text style={styles.unavailableText}>This post may have been removed.</Text>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.authorRow}>
              <Pressable accessibilityRole="button" accessibilityLabel={"View " + post.author.displayName + "'s profile"} onPress={openAuthorProfile} style={styles.authorIdentity}>
                <AuthorAvatar name={post.author.displayName} uri={post.author.avatarUrl} size={44} />
                <View style={styles.authorCopy}>
                  <Text style={styles.authorName}>{post.author.displayName}</Text>
                  <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="More post options" hitSlop={8} onPress={showPostOptions} style={styles.moreButton}>
                <SymbolView name={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }} tintColor="#16191F" size={22} />
              </Pressable>
            </View>

            {post.mediaType === "video" ? (
              <DetailVideo uri={post.mediaUrl} size={width - 32} />
            ) : (
              <Image source={{ uri: post.mediaUrl }} contentFit="cover" transition={150} style={[styles.media, { width: width - 32, height: width - 32 }]} />
            )}

            {post.caption ? (
              <Text style={styles.caption}>
                <Text style={styles.captionAuthor}>{post.author.displayName}</Text>{"  "}{post.caption}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel={post.isLiked ? "Unlike post" : "Like post"} accessibilityState={{ selected: post.isLiked, disabled: likePending }} disabled={likePending} onPress={() => void handleLike()} style={styles.actionItem}>
                <SymbolView name={{ ios: post.isLiked ? "heart.fill" : "heart", android: post.isLiked ? "favorite" : "favorite_border", web: post.isLiked ? "favorite" : "favorite_border" }} tintColor={post.isLiked ? "#F04466" : "#16191F"} size={25} />
                <Text style={styles.actionCount}>{post.likeCount.toLocaleString()}</Text>
              </Pressable>
              <View style={styles.actionItem}>
                <SymbolView name={{ ios: "bubble.left", android: "chat_bubble_outline", web: "chat_bubble_outline" }} tintColor="#16191F" size={24} />
                <Text style={styles.actionCount}>{post.commentCount.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.commentsHeading}>Comments</Text>
            {comments === undefined ? (
              <Text style={styles.commentsStatus}>Loading comments...</Text>
            ) : comments.length === 0 ? (
              <Text style={styles.commentsStatus}>Be the first to comment.</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment._id} style={styles.commentRow}>
                  <AuthorAvatar name={comment.authorName} uri={comment.avatarUrl} size={40} />
                  <View style={styles.commentContent}>
                    <View style={styles.commentTopline}>
                      <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                      {comment.canDelete ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Delete comment" onPress={() => confirmRemoveComment(comment._id)} hitSlop={8}>
                          <Text style={styles.deleteLabel}>Delete</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <Text style={styles.commentBody}>{comment.body}</Text>
                    <Text style={styles.commentDate}>{formatDate(comment.createdAt, true)}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Add a comment"
              maxLength={500}
              onChangeText={setCommentText}
              onSubmitEditing={() => void handleAddComment()}
              placeholder="Add a comment..."
              placeholderTextColor="#858B96"
              returnKeyType="send"
              style={styles.commentInput}
              value={commentText}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Post comment" disabled={!commentText.trim() || posting} onPress={() => void handleAddComment()} style={[styles.postButton, (!commentText.trim() || posting) && styles.postButtonDisabled]}>
              <Text style={styles.postButtonText}>{posting ? "..." : "Post"}</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function AuthorAvatar({ name, uri, size }: { name: string; uri: string | null; size: number }) {
  return uri ? (
    <Image source={{ uri }} contentFit="cover" accessibilityLabel={name + " profile photo"} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarLetter}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

function DetailVideo({ uri, size }: { uri: string; size: number }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.muted = true;
    instance.loop = true;
  });
  return <VideoView player={player} nativeControls contentFit="cover" accessibilityLabel="Video post" style={[styles.media, { width: size, height: size }]} />;
}

function formatDate(value: number, includeTime = false) {
  return new Date(value).toLocaleString(undefined, includeTime
    ? { month: "numeric", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { month: "numeric", day: "numeric", year: "numeric" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  topBar: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  topButton: { width: 34, height: 40, alignItems: "center", justifyContent: "center" },
  screenTitle: { color: "#151821", fontSize: 18, fontWeight: "700" },
  loading: { marginTop: 60 },
  unavailable: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  unavailableTitle: { color: "#171A20", fontSize: 18, fontWeight: "700" },
  unavailableText: { marginTop: 8, color: "#747C88", fontSize: 14, textAlign: "center" },
  scrollContent: { paddingBottom: 20 },
  authorRow: { height: 66, flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  authorIdentity: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" },
  authorCopy: { marginLeft: 12 },
  authorName: { color: "#151821", fontSize: 15, fontWeight: "700" },
  postDate: { marginTop: 2, color: "#7B8290", fontSize: 12 },
  moreButton: { width: 34, height: 38, alignItems: "flex-end", justifyContent: "center" },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9F1FF" },
  avatarLetter: { color: "#3183F5", fontSize: 16, fontWeight: "700" },
  media: { alignSelf: "center", backgroundColor: "#F4F5F7", borderRadius: 14 },
  caption: { marginHorizontal: 20, marginTop: 14, color: "#171A20", fontSize: 15, lineHeight: 22 },
  captionAuthor: { fontWeight: "700" },
  actions: { height: 62, flexDirection: "row", alignItems: "center", gap: 22, paddingHorizontal: 20 },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionCount: { color: "#171A20", fontSize: 15 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20, backgroundColor: "#D8DCE2" },
  commentsHeading: { marginHorizontal: 20, marginTop: 22, marginBottom: 10, color: "#151821", fontSize: 18, fontWeight: "700" },
  commentsStatus: { marginHorizontal: 20, paddingVertical: 14, color: "#777F8B", fontSize: 14 },
  commentRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginHorizontal: 20, paddingVertical: 12 },
  commentContent: { flex: 1, minWidth: 0 },
  commentTopline: { minHeight: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  commentAuthor: { color: "#171A20", fontSize: 14, fontWeight: "700" },
  deleteLabel: { color: "#7B8290", fontSize: 12 },
  commentBody: { marginTop: 2, color: "#171A20", fontSize: 14, lineHeight: 20 },
  commentDate: { marginTop: 6, color: "#89909A", fontSize: 12 },
  composer: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E2E5E9", backgroundColor: "#FFFFFF" },
  commentInput: { flex: 1, minHeight: 48, maxHeight: 90, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, color: "#171A20", fontSize: 14, backgroundColor: "#F3F4F6" },
  postButton: { minWidth: 76, height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 24, backgroundColor: "#3A86FF" },
  postButtonDisabled: { opacity: 0.55 },
  postButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
