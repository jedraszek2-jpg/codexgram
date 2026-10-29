import { router } from "expo-router";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useMutation } from "convex/react";
import { useState, type ComponentProps } from "react";
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type ProfileSection = "grid" | "videos" | "tagged";
type ProfileSymbolName = ComponentProps<typeof SymbolView>["name"];

export type ProfileContentProfile = {
  _id: Id<"profiles">;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
};

export type ProfileContentPost = {
  _id: Id<"posts">;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
};

const sections: { key: ProfileSection; label: string; icon: ProfileSymbolName }[] = [
  { key: "grid", label: "Posts", icon: { ios: "square.grid.3x3", android: "grid_view", web: "grid_view" } },
  { key: "videos", label: "Videos", icon: { ios: "play.rectangle", android: "video_library", web: "video_library" } },
  { key: "tagged", label: "Tagged", icon: { ios: "person.crop.square", android: "account_box", web: "account_box" } },
];

export function ProfileContent({
  profile,
  posts,
  onFollow,
  followPending = false,
}: {
  profile: ProfileContentProfile;
  posts: ProfileContentPost[];
  onFollow?: () => void;
  followPending?: boolean;
}) {
  const { width } = useWindowDimensions();
  const [selectedSection, setSelectedSection] = useState<ProfileSection>("grid");
  const [messagePending, setMessagePending] = useState(false);
  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);
  const scale = Math.min(width / 250, 1.45);
  const avatarSize = 56 * scale;
  const imageGap = 2;
  const tileSize = (width - imageGap * 2) / 3;
  const visiblePosts =
    selectedSection === "grid"
      ? posts.filter((post) => post.mediaType === "image")
      : selectedSection === "videos"
        ? posts.filter((post) => post.mediaType === "video")
        : [];

  return (
    <View>
      <View style={[styles.summary, { paddingHorizontal: 12 * scale }]}>
        {profile.avatarUrl ? (
          <Image
            source={{ uri: profile.avatarUrl }}
            style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
            contentFit="cover"
            accessibilityLabel={profile.displayName + " profile photo"}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
            <Text style={[styles.avatarLetter, { fontSize: 20 * scale }]}>
              {profile.displayName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { fontSize: 13 * scale }]}>{profile.postCount.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { fontSize: 9 * scale }]}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { fontSize: 13 * scale }]}>{profile.followerCount.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { fontSize: 9 * scale }]}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { fontSize: 13 * scale }]}>{profile.followingCount.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { fontSize: 9 * scale }]}>Following</Text>
          </View>
        </View>
      </View>

      <View style={[styles.bio, { paddingHorizontal: 12 * scale }]}>
        <Text style={[styles.displayName, { fontSize: 10 * scale }]}>{profile.displayName}</Text>
        <Text style={[styles.bioText, { fontSize: 10 * scale, lineHeight: 13 * scale }]}>
          {profile.bio || "Share a little about yourself."}
        </Text>
        {profile.isOwnProfile ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/edit-profile")}
            style={[styles.profileButton, { height: 20 * scale, borderRadius: 12 * scale, marginTop: 8 * scale }]}
          >
            <Text style={[styles.profileButtonLabel, { fontSize: 9 * scale }]}>Edit Profile</Text>
          </Pressable>
        ) : (
          <View style={[styles.profileActions, { marginTop: 8 * scale, gap: 6 * scale }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={(profile.isFollowing ? "Unfollow " : "Follow ") + profile.displayName}
              accessibilityState={{ selected: profile.isFollowing, disabled: followPending }}
              disabled={followPending}
              onPress={onFollow}
              style={[
                styles.profileButton,
                profile.isFollowing && styles.followingButton,
                followPending && styles.followPending,
                { height: 22 * scale, borderRadius: 12 * scale, paddingHorizontal: 12 * scale },
              ]}
            >
              <Text style={[styles.profileButtonLabel, profile.isFollowing && styles.followingLabel, { fontSize: 9 * scale }]}>
                {followPending ? "…" : profile.isFollowing ? "Following" : "Follow"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={profile.isFollowing ? `Message ${profile.displayName}` : `Follow ${profile.displayName} to message`}
              accessibilityState={{ disabled: !profile.isFollowing || messagePending }}
              disabled={!profile.isFollowing || messagePending}
              onPress={() => {
                if (!profile.isFollowing || messagePending) return;
                setMessagePending(true);
                void getOrCreateConversation({ otherUserId: profile._id })
                  .then((conversationId) => {
                    router.push({ pathname: "/chat", params: { conversationId } });
                  })
                  .catch((cause: unknown) => {
                    Alert.alert("Couldn't start conversation", cause instanceof Error ? cause.message : "Please try again.");
                  })
                  .finally(() => setMessagePending(false));
              }}
              style={[
                styles.profileButton,
                styles.messageButton,
                (!profile.isFollowing || messagePending) && styles.followPending,
                { height: 22 * scale, borderRadius: 12 * scale, paddingHorizontal: 12 * scale },
              ]}
            >
              <Text style={[styles.messageButtonLabel, { fontSize: 9 * scale }]}>
                {messagePending ? "Opening…" : profile.isFollowing ? "Message" : "Follow first"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={[styles.sectionBar, { height: 28 * scale }]}>
        {sections.map((section) => {
          const selected = selectedSection === section.key;
          return (
            <Pressable
              key={section.key}
              accessibilityRole="button"
              accessibilityLabel={section.label}
              accessibilityState={{ selected }}
              onPress={() => setSelectedSection(section.key)}
              style={styles.sectionButton}
            >
              <SymbolView
                name={section.icon}
                tintColor={selected ? "#1F1F1F" : "#687386"}
                size={15 * scale}
              />
              {selected ? <View style={styles.sectionIndicator} /> : null}
            </Pressable>
          );
        })}
      </View>

      {selectedSection === "tagged" ? (
        <View style={styles.emptySection}><Text style={styles.emptyText}>No tagged photos yet</Text></View>
      ) : visiblePosts.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>{selectedSection === "videos" ? "No videos yet" : "No posts yet"}</Text>
        </View>
      ) : (
        <View style={styles.gallery}>
          {visiblePosts.map((post, index) => (
            <View
              key={post._id}
              style={{
                width: tileSize,
                height: tileSize,
                marginRight: index % 3 === 2 ? 0 : imageGap,
                marginBottom: imageGap,
              }}
            >
              {post.mediaType === "image" ? (
                <Image
                  source={{ uri: post.mediaUrl }}
                  style={styles.tileImage}
                  contentFit="cover"
                  accessibilityLabel={post.caption || profile.displayName + " post"}
                />
              ) : (
                <View style={styles.videoTile}>
                  <SymbolView name={{ ios: "play.fill", android: "play_arrow", web: "play_arrow" }} tintColor="#FFFFFF" size={24} />
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { minHeight: 64, flexDirection: "row", alignItems: "center", paddingTop: 3, paddingBottom: 5 },
  avatar: { borderWidth: 1, borderColor: "#E5E7EB" },
  avatarFallback: { backgroundColor: "#E9EEF8", alignItems: "center", justifyContent: "center" },
  avatarLetter: { color: "#46566F", fontWeight: "700" },
  stats: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginLeft: 8 },
  stat: { minWidth: 50, alignItems: "center", justifyContent: "center" },
  statNumber: { color: "#111114", fontWeight: "700", lineHeight: 18 },
  statLabel: { color: "#343A40", lineHeight: 13, marginTop: 1 },
  bio: { paddingTop: 1, paddingBottom: 2 },
  displayName: { color: "#111114", fontWeight: "700", lineHeight: 15 },
  bioText: { color: "#1F1F1F", fontWeight: "400" },
  profileActions: { flexDirection: "row", alignItems: "center" },
  profileButton: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9EBEF" },
  profileButtonLabel: { color: "#111114", fontWeight: "600" },
  followingButton: { backgroundColor: "#E9EDF3" },
  followingLabel: { color: "#303640" },
  messageButton: { backgroundColor: "#287BFF" },
  messageButtonLabel: { color: "#FFFFFF", fontWeight: "600" },
  followPending: { opacity: 0.6 },
  sectionBar: { flexDirection: "row", alignItems: "stretch", marginTop: 4 },
  sectionButton: { flex: 1, alignItems: "center", justifyContent: "center" },
  sectionIndicator: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1, backgroundColor: "#111114" },
  gallery: { width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  tileImage: { width: "100%", height: "100%" },
  videoTile: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#283244" },
  emptySection: { minHeight: 180, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#687386", fontSize: 13 },
});
