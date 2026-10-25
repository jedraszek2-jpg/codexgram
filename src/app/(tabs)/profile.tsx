import { useClerk } from "@clerk/expo";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useState, type ComponentProps } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ProfileSection = "grid" | "videos" | "tagged";
type ProfileSymbolName = ComponentProps<typeof SymbolView>["name"];

const profilePhotos = [
  { source: require("../../../assets/images/profile-grid-1.png"), label: "Lake and mountain view" },
  { source: require("../../../assets/images/profile-grid-2.png"), label: "Purple flowers" },
  { source: require("../../../assets/images/profile-grid-3.png"), label: "Dog in a field" },
  { source: require("../../../assets/images/profile-grid-4.png"), label: "Coastal town" },
  { source: require("../../../assets/images/profile-grid-5.png"), label: "Mountain road" },
  { source: require("../../../assets/images/profile-grid-6.png"), label: "White village and flowers" },
  { source: require("../../../assets/images/profile-grid-1.png"), label: "Lake and mountain view" },
  { source: require("../../../assets/images/profile-grid-2.png"), label: "Purple flowers" },
  { source: require("../../../assets/images/profile-grid-3.png"), label: "Dog in a field" },
];

const profileSections: {
  key: ProfileSection;
  label: string;
  icon: ProfileSymbolName;
}[] = [
  {
    key: "grid",
    label: "Posts",
    icon: { ios: "square.grid.3x3", android: "grid_view", web: "grid_view" },
  },
  {
    key: "videos",
    label: "Videos",
    icon: { ios: "play.rectangle", android: "video_library", web: "video_library" },
  },
  {
    key: "tagged",
    label: "Tagged",
    icon: { ios: "person.crop.square", android: "account_box", web: "account_box" },
  },
];

export default function ProfileTab() {
  const { width } = useWindowDimensions();
  const { signOut } = useClerk();
  const [selectedSection, setSelectedSection] = useState<ProfileSection>("grid");

  const scale = Math.min(width / 250, 1.45);
  const avatarSize = 56 * scale;
  const imageGap = 2;
  const tileSize = (width - imageGap * 2) / 3;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      Alert.alert("Sign out failed", "Please try again.");
    }
  };

  const showProfileOptions = () => {
    Alert.alert("Profile options", "", [
      { text: "Sign out", style: "destructive", onPress: () => void handleSignOut() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topBar, { height: 34 * scale, paddingHorizontal: 10 * scale }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile home"
            onPress={() => Alert.alert("Codexgram", "You are viewing your profile.")}
            hitSlop={8}
            style={styles.topAction}
          >
            <SymbolView
              name={{ ios: "house", android: "home", web: "home" }}
              tintColor="#1F1F1F"
              size={17 * scale}
            />
          </Pressable>
          <Text style={[styles.handle, { fontSize: 13 * scale }]}>iwanatravels</Text>
          <View style={styles.topRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Camera"
              onPress={() => Alert.alert("Camera", "Camera is coming soon.")}
              hitSlop={8}
              style={styles.topAction}
            >
              <SymbolView
                name={{ ios: "camera", android: "photo_camera", web: "photo_camera" }}
                tintColor="#1F1F1F"
                size={16 * scale}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile options"
              onPress={showProfileOptions}
              hitSlop={8}
              style={styles.topAction}
            >
              <SymbolView
                name={{ ios: "line.3.horizontal", android: "menu", web: "menu" }}
                tintColor="#1F1F1F"
                size={17 * scale}
              />
            </Pressable>
          </View>
        </View>

        <View style={[styles.summary, { paddingHorizontal: 12 * scale }]}>
          <Image
            source={require("../../../assets/images/profile-avatar.png")}
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
            contentFit="cover"
            accessibilityLabel="Iwona Stefaniak profile photo"
          />
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { fontSize: 13 * scale }]}>128</Text>
              <Text style={[styles.statLabel, { fontSize: 9 * scale }]}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { fontSize: 13 * scale }]}>1,4K</Text>
              <Text style={[styles.statLabel, { fontSize: 9 * scale }]}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { fontSize: 13 * scale }]}>356</Text>
              <Text style={[styles.statLabel, { fontSize: 9 * scale }]}>Following</Text>
            </View>
          </View>
        </View>

        <View style={[styles.bio, { paddingHorizontal: 12 * scale }]}>
          <Text style={[styles.displayName, { fontSize: 10 * scale }]}>Iwona Stefaniak</Text>
          <Text style={[styles.bioText, { fontSize: 10 * scale, lineHeight: 13 * scale }]}>
            Miłośniczka przyrody, podróży i pięknych{"\n"}
            chwil 🌿🌷{"\n"}
            Poland 🇵🇱
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/edit-profile")}
            style={[
              styles.editButton,
              { height: 20 * scale, borderRadius: 12 * scale, marginTop: 8 * scale },
            ]}
          >
            <Text style={[styles.editLabel, { fontSize: 9 * scale }]}>Edit Profile</Text>
          </Pressable>
        </View>

        <View style={[styles.sectionBar, { height: 28 * scale }]}>
          {profileSections.map((section) => {
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

        {selectedSection === "grid" ? (
          <View style={styles.gallery}>
            {profilePhotos.map((photo, index) => (
              <Image
                key={photo.label + "-" + index}
                source={photo.source}
                style={{
                  width: tileSize,
                  height: tileSize,
                  marginRight: index % 3 === 2 ? 0 : imageGap,
                  marginBottom: imageGap,
                }}
                contentFit="cover"
                accessibilityLabel={photo.label}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>
              {selectedSection === "videos" ? "No videos yet" : "No tagged photos yet"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topAction: {
    width: 28,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  handle: {
    position: "absolute",
    left: 50,
    right: 50,
    textAlign: "center",
    color: "#111114",
    fontWeight: "700",
  },
  summary: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 3,
    paddingBottom: 5,
  },
  avatar: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stats: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginLeft: 8,
  },
  stat: {
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    color: "#111114",
    fontWeight: "700",
    lineHeight: 18,
  },
  statLabel: {
    color: "#343A40",
    lineHeight: 13,
    marginTop: 1,
  },
  bio: {
    paddingTop: 1,
    paddingBottom: 2,
  },
  displayName: {
    color: "#111114",
    fontWeight: "700",
    lineHeight: 15,
  },
  bioText: {
    color: "#1F1F1F",
    fontWeight: "400",
  },
  editButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9EBEF",
  },
  editLabel: {
    color: "#111114",
    fontWeight: "600",
  },
  sectionBar: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 4,
  },
  sectionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "#111114",
  },
  gallery: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  emptySection: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#687386",
    fontSize: 13,
  },
});