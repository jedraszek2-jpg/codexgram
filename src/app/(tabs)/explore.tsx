import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
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

const categories = ["For you", "Nature", "Travel", "Food", "Art"] as const;
type Category = (typeof categories)[number];
type ExplorePost = {
  id: string;
  title: string;
  category: Exclude<Category, "For you">;
  keywords: string;
  image: number;
};

const posts: ExplorePost[] = [
  {
    id: "amalfi",
    title: "A morning on the Amalfi Coast",
    category: "Travel",
    keywords: "italy seaside coast flowers video",
    image: require("../../../assets/images/explore-tile-01.png"),
  },
  {
    id: "golden",
    title: "A little sunshine",
    category: "Nature",
    keywords: "golden retriever dog puppy",
    image: require("../../../assets/images/explore-tile-02.png"),
  },
  {
    id: "flowers",
    title: "Flowers for a slow Sunday",
    category: "Art",
    keywords: "garden flowers bouquet",
    image: require("../../../assets/images/explore-tile-03.png"),
  },
  {
    id: "coffee",
    title: "Coffee and a quiet morning",
    category: "Food",
    keywords: "coffee latte cappuccino",
    image: require("../../../assets/images/explore-tile-04.png"),
  },
  {
    id: "santorini",
    title: "A sunset to remember",
    category: "Travel",
    keywords: "greece travel sunset woman",
    image: require("../../../assets/images/explore-tile-05.png"),
  },
  {
    id: "mountains",
    title: "Somewhere in the Dolomites",
    category: "Nature",
    keywords: "mountain lake alpine",
    image: require("../../../assets/images/explore-tile-06.png"),
  },
  {
    id: "kitten",
    title: "Meet the new neighbor",
    category: "Nature",
    keywords: "cat kitten pet",
    image: require("../../../assets/images/explore-tile-07.png"),
  },
  {
    id: "pink-flowers",
    title: "A basket full of color",
    category: "Art",
    keywords: "flowers pink floral garden",
    image: require("../../../assets/images/explore-tile-08.png"),
  },
  {
    id: "village",
    title: "Little streets by the sea",
    category: "Travel",
    keywords: "village coast europe italy",
    image: require("../../../assets/images/explore-tile-09.png"),
  },
  {
    id: "lavender",
    title: "Lavender season",
    category: "Nature",
    keywords: "lavender field flowers sunset",
    image: require("../../../assets/images/explore-tile-10.png"),
  },
  {
    id: "terrace",
    title: "Breakfast with a view",
    category: "Food",
    keywords: "terrace breakfast cafe coffee",
    image: require("../../../assets/images/explore-tile-11.png"),
  },
  {
    id: "cove",
    title: "Hidden blue cove",
    category: "Travel",
    keywords: "sea swimming coast video",
    image: require("../../../assets/images/explore-tile-12.png"),
  },
];

const columnWeights = [151, 153, 119];
const rowHeightRatios = [161 / 430, 173 / 430, 143 / 430, 158 / 430];

export default function ExploreTab() {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 430, 1.2);
  const [activeCategory, setActiveCategory] = useState<Category>("For you");
  const [query, setQuery] = useState("");

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "For you" || post.category === activeCategory;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        `${post.title} ${post.category} ${post.keywords}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, query]);

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

  const showPostPreview = (post: ExplorePost) => {
    Alert.alert(post.title, "Post preview is coming soon.");
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

      <ScrollCategories
        activeCategory={activeCategory}
        scale={scale}
        onSelect={setActiveCategory}
      />

      <FlatList
        data={rows}
        keyExtractor={(row) => row.map((post) => post.id).join("-")}
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
                <Pressable
                  key={post.id}
                  accessibilityRole="button"
                  accessibilityLabel={post.title}
                  onPress={() => showPostPreview(post)}
                  style={[
                    styles.tile,
                    {
                      flex: columnWeights[column],
                      marginRight: column < 2 ? 3 * scale : 0,
                    },
                  ]}
                >
                  <Image
                    accessibilityLabel={post.title}
                    contentFit="fill"
                    source={post.image}
                    style={styles.tileImage}
                  />
                </Pressable>
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
        ListEmptyComponent={
          <View style={[styles.emptyState, { marginTop: 32 * scale }]}>
            <Text style={[styles.emptyTitle, { fontSize: 16 * scale }]}>No posts found</Text>
            <Text style={[styles.emptyCopy, { fontSize: 13 * scale }]}>
              Try a different search or category.
            </Text>
          </View>
        }
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
  categoryWrap: {
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
  tile: {
    overflow: "hidden",
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