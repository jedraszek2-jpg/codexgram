import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useMutation, useQuery } from "convex/react";

const categories = ["For you", "Nature", "Travel", "Food", "Art"] as const;
type Category = (typeof categories)[number];
type ExplorePost = {
  _id: Id<"posts">;
  author: {
    _id: Id<"profiles">;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  caption: string | null;
  mediaType: "image" | "video";
  mediaUrl: string;
};

const categoryKeywords: Record<Exclude<Category, "For you">, string[]> = {
  Nature: ["nature", "flower", "garden", "mountain", "animal", "dog", "cat"],
  Travel: ["travel", "trip", "coast", "city", "beach", "italy", "greece"],
  Food: ["food", "coffee", "breakfast", "lunch", "dinner", "cake"],
  Art: ["art", "design", "paint", "photo", "creative"],
};

const columnWeights = [151, 153, 119];
const rowHeightRatios = [161 / 430, 173 / 430, 143 / 430, 158 / 430];

export default function ExploreTab() {
  const { width } = useWindowDimensions();
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const scale = Math.min(width / 430, 1.2);
  const [activeCategory, setActiveCategory] = useState<Category>("For you");
  const [query, setQuery] = useState("");
  const people = useQuery(
    api.social.searchProfiles,
    isSignedIn ? { search: query } : "skip",
  );
  const feedPosts = useQuery(api.social.exploreFeed, isSignedIn ? {} : "skip");
  const toggleFollow = useMutation(api.social.toggleFollow);
  const [pendingProfiles, setPendingProfiles] = useState<Record<string, boolean>>({});

  const handleToggleFollow = async (profileId: Id<"profiles">) => {
    setPendingProfiles((current) => ({ ...current, [profileId]: true }));
    try {
      await toggleFollow({ profileId });
    } catch (cause) {
      Alert.alert("Follow failed", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setPendingProfiles((current) => {
        const next = { ...current };
        delete next[profileId];
        return next;
      });
    }
  };

  const openProfile = (profileId: Id<"profiles">) =>
    router.push({ pathname: "/user/[id]", params: { id: profileId } });

  const openPost = (post: ExplorePost) =>
    router.push({ pathname: "/post/[id]", params: { id: post._id } });

  const showPostOptions = (post: ExplorePost) => Alert.alert("Opcje posta", undefined, [
    { text: "Zobacz profil", onPress: () => openProfile(post.author._id) },
    { text: "Zobacz post", onPress: () => openPost(post) },
    { text: "Anuluj", style: "cancel" },
  ]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (feedPosts ?? []).filter((post) => {
      if (post.mediaType !== "image") return false;
      const searchableText = `${post.caption ?? ""} ${post.author.displayName} ${post.author.username}`.toLowerCase();
      const matchesCategory =
        activeCategory === "For you" ||
        categoryKeywords[activeCategory].some((keyword) => searchableText.includes(keyword));
      const matchesSearch = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, feedPosts, query]);

  const rows = useMemo(() => {
    const result: ExplorePost[][] = [];
    for (let index = 0; index < filteredPosts.length; index += 3) {
      result.push(filteredPosts.slice(index, index + 3));
    }
    return result;
  }, [filteredPosts]);

  const showScanMessage = () => {
    Alert.alert("Scan", "Scanning is not connected yet.");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />

      <View
        style={[
          styles.header,
          {
            height: 56 * scale,
            marginHorizontal: 20 * scale,
            marginTop: 3 * scale,
          },
        ]}
      >
        <Text style={[styles.heading, { fontSize: 37 * scale }]}>Explore</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan"
          hitSlop={8}
          onPress={showScanMessage}
          style={styles.scanButton}
        >
          <SymbolView
            name={{ ios: "viewfinder", android: "qr_code_scanner", web: "qr_code_scanner" }}
            tintColor="#10131B"
            size={25 * scale}
          />
        </Pressable>
      </View>

      <View
        style={[
          styles.searchBar,
          {
            height: 44 * scale,
            marginHorizontal: 20 * scale,
            borderRadius: 23 * scale,
            paddingHorizontal: 14 * scale,
          },
        ]}
      >
        <SymbolView
          name={{ ios: "magnifyingglass", android: "search", web: "search" }}
          tintColor="#141821"
          size={22 * scale}
        />
        <TextInput
          accessibilityLabel="Search people or posts"
          onChangeText={setQuery}
          placeholder="Search people or posts..."
          placeholderTextColor="#7B8290"
          returnKeyType="search"
          style={[styles.searchInput, { fontSize: 14 * scale, marginLeft: 12 * scale }]}
          value={query}
        />
      </View>

      <View style={[styles.peopleSection, { marginHorizontal: 20 * scale }]}>
        <Text style={[styles.peopleHeading, { fontSize: 14 * scale }]}>
          {query.trim() ? "People" : "Suggested people"}
        </Text>
        {people === undefined ? (
          <Text style={[styles.peopleEmpty, { fontSize: 12 * scale }]}>Loading people...</Text>
        ) : people.length === 0 ? (
          <Text style={[styles.peopleEmpty, { fontSize: 12 * scale }]}>
            {query.trim() ? "No matching people yet." : "No other profiles yet. Invite a friend to join."}
          </Text>
        ) : (
          people.slice(0, 4).map((person) => (
            <View key={person._id} style={styles.personRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={"Open profile for " + person.displayName}
                onPress={() => openProfile(person._id)}
                style={styles.personIdentity}
              >
              {person.avatarUrl ? (
                <Image source={{ uri: person.avatarUrl }} style={styles.personAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.personAvatar, styles.personAvatarFallback]}>
                  <Text style={styles.personAvatarLetter}>{person.displayName.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.personDetails}>
                <Text style={styles.personUsername}>{person.displayName}</Text>
                <Text style={styles.personMeta} numberOfLines={1}>
                  {person.followerCount.toLocaleString()} followers
                </Text>
              </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={(person.isFollowing ? "Unfollow " : "Follow ") + person.displayName}
                accessibilityState={{ selected: person.isFollowing, disabled: !!pendingProfiles[person._id] }}
                disabled={!!pendingProfiles[person._id]}
                onPress={() => void handleToggleFollow(person._id)}
                style={[
                  styles.followButton,
                  person.isFollowing && styles.followingButton,
                  pendingProfiles[person._id] && styles.followPending,
                ]}
              >
                <Text style={[styles.followLabel, person.isFollowing && styles.followingLabel]}>
                  {pendingProfiles[person._id] ? "..." : person.isFollowing ? "Following" : "Follow"}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
      <ScrollCategories
        activeCategory={activeCategory}
        scale={scale}
        onSelect={setActiveCategory}
      />

      <FlatList
        data={rows}
        keyExtractor={(row) => row.map((post) => post._id).join("-")}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.gridRow,
              {
                height: width * rowHeightRatios[index % rowHeightRatios.length],
                marginBottom: 3 * scale,
              },
            ]}
          >
            {[0, 1, 2].map((column) => {
              const post = item[column];
              return post ? (
                <View
                  key={post._id}
                  style={[
                    styles.tileContainer,
                    {
                      flex: columnWeights[column],
                      marginRight: column < 2 ? 3 * scale : 0,
                    },
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="View post details"
                    onPress={() => openPost(post)}
                    style={styles.tile}
                  >
                    <Image
                      accessibilityLabel={post.caption ?? "Post photo"}
                      contentFit="cover"
                      source={{ uri: post.mediaUrl }}
                      style={styles.tileImage}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="More post options"
                    hitSlop={6}
                    onPress={() => showPostOptions(post)}
                    style={styles.tileMoreButton}
                  >
                    <SymbolView
                      name={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }}
                      tintColor="#171A20"
                      size={18 * scale}
                    />
                  </Pressable>
                </View>
              ) : (
                <View
                  key={`empty-${column}`}
                  style={{
                    flex: columnWeights[column],
                    marginRight: column < 2 ? 3 * scale : 0,
                  }}
                />
              );
            })}
          </View>
        )}
        ListEmptyComponent={feedPosts === undefined ? (
          <ActivityIndicator color="#3A86FF" style={{ marginTop: 32 * scale }} />
        ) : (
          <View style={[styles.emptyState, { marginTop: 32 * scale }]}>
            <Text style={[styles.emptyTitle, { fontSize: 16 * scale }]}>No posts found</Text>
            <Text style={[styles.emptyCopy, { fontSize: 13 * scale }]}>
              Try a different search or category.
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
      />
    </SafeAreaView>
  );
}

function ScrollCategories({
  activeCategory,
  scale,
  onSelect,
}: {
  activeCategory: Category;
  scale: number;
  onSelect: (category: Category) => void;
}) {
  return (
    <View style={[styles.categoryWrap, { marginTop: 14 * scale, marginBottom: 12 * scale }]}>
      <ScrollView
        horizontal
        contentContainerStyle={{ paddingHorizontal: 20 * scale, gap: 7 * scale }}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map((category) => {
          const selected = activeCategory === category;
          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(category)}
              style={[
                styles.categoryChip,
                {
                  height: 39 * scale,
                  paddingHorizontal: 17 * scale,
                  borderRadius: 21 * scale,
                  backgroundColor: selected ? "#2F60FA" : "#F0F1F4",
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryLabel,
                  { fontSize: 13 * scale, color: selected ? "#FFFFFF" : "#151821" },
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
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
    justifyContent: "space-between",
  },
  heading: {
    color: "#10131B",
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  scanButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 40,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F1F4",
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: "#151821",
  },
  peopleSection: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F8F9FB",
  },
  peopleHeading: { color: "#181B22", fontWeight: "700", marginBottom: 7 },
  peopleEmpty: { color: "#737B87", paddingVertical: 8 },
  personRow: { minHeight: 54, flexDirection: "row", alignItems: "center", paddingVertical: 5 },
  personIdentity: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" },
  personAvatar: { width: 36, height: 36, borderRadius: 18 },
  personAvatarFallback: { backgroundColor: "#E4EAF5", alignItems: "center", justifyContent: "center" },
  personAvatarLetter: { color: "#526071", fontWeight: "700" },
  personDetails: { flex: 1, marginLeft: 9 },
  personUsername: { color: "#20242C", fontSize: 12, fontWeight: "700" },
  personMeta: { color: "#747C88", fontSize: 10, marginTop: 2 },
  followButton: { minWidth: 76, alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 16, backgroundColor: "#3A86FF" },
  followingButton: { backgroundColor: "#E9EDF3" },
  followPending: { opacity: 0.6 },
  followLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  followingLabel: { color: "#303640" },  categoryWrap: {
    flexGrow: 0,
  },
  categoryChip: {
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontWeight: "500",
  },
  grid: {
    flex: 1,
  },
  gridRow: {
    width: "100%",
    flexDirection: "row",
  },
  tileContainer: { position: "relative", overflow: "hidden" },
  tile: { flex: 1, overflow: "hidden" },
  tileMoreButton: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  gridContent: {
    paddingBottom: 3,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#141821",
    fontWeight: "600",
  },
  emptyCopy: {
    marginTop: 5,
    color: "#687181",
    textAlign: "center",
  },
});
