import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import { Animated, Modal, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import type { Id } from "../../convex/_generated/dataModel";

export type StoryItem = {
  storyId: Id<"stories">;
  mediaUrl: string;
  createdAt: number;
  expiresAt: number;
};

export type StoryGroup = {
  author: {
    _id: Id<"profiles">;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  stories: StoryItem[];
};

export function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
}: {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}) {
  const [position, setPosition] = useState({ groupIndex: initialGroupIndex, storyIndex: 0 });
  const [progress] = useState(() => new Animated.Value(0));
  const currentGroup = groups[position.groupIndex];
  const currentStory = currentGroup?.stories[position.storyIndex];

  const advance = useCallback(
    (direction: 1 | -1) => {
      const group = groups[position.groupIndex];
      if (!group) {
        onClose();
        return;
      }

      const nextStoryIndex = position.storyIndex + direction;
      if (nextStoryIndex >= 0 && nextStoryIndex < group.stories.length) {
        setPosition({ groupIndex: position.groupIndex, storyIndex: nextStoryIndex });
        return;
      }

      const nextGroupIndex = position.groupIndex + direction;
      if (nextGroupIndex < 0) {
        setPosition({ groupIndex: 0, storyIndex: 0 });
        return;
      }
      if (nextGroupIndex >= groups.length) {
        onClose();
        return;
      }

      const nextGroup = groups[nextGroupIndex];
      setPosition({
        groupIndex: nextGroupIndex,
        storyIndex: direction > 0 ? 0 : Math.max(0, nextGroup.stories.length - 1),
      });
    },
    [groups, onClose, position],
  );

  useEffect(() => {
    if (!currentStory) {
      onClose();
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) advance(1);
    });
    return () => animation.stop();
  }, [advance, currentStory, onClose, progress]);

  if (!currentGroup || !currentStory) return null;

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.screen}>
        <Image source={{ uri: currentStory.mediaUrl }} contentFit="cover" style={styles.storyImage} />
        <View pointerEvents="none" style={styles.scrimTop} />
        <View pointerEvents="none" style={styles.scrimBottom} />

        <View style={styles.progressRow}>
          {currentGroup.stories.map((story, index) => (
            <View key={story.storyId} style={styles.progressTrack}>
              {index < position.storyIndex ? (
                <View style={styles.progressComplete} />
              ) : index === position.storyIndex ? (
                <Animated.View
                  style={[
                    styles.progressActive,
                    {
                      width: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.authorRow}>
          {currentGroup.author.avatarUrl ? (
            <Image
              source={{ uri: currentGroup.author.avatarUrl }}
              contentFit="cover"
              style={styles.avatar}
              accessibilityLabel={`${currentGroup.author.displayName} profile photo`}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{currentGroup.author.displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.authorText}>
            <Text numberOfLines={1} style={styles.authorName}>{currentGroup.author.displayName}</Text>
            <Text style={styles.storyTime}>{formatStoryAge(currentStory.createdAt)}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close stories" hitSlop={12} onPress={onClose} style={styles.closeButton}>
            <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} tintColor="#FFFFFF" size={22} />
          </Pressable>
        </View>

        <View style={styles.tapZones}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous story" onPress={() => advance(-1)} style={styles.tapZone} />
          <Pressable accessibilityRole="button" accessibilityLabel="Next story" onPress={() => advance(1)} style={styles.tapZone} />
        </View>
      </View>
    </Modal>
  );
}

function formatStoryAge(createdAt: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#111111" },
  storyImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  scrimTop: { position: "absolute", top: 0, right: 0, left: 0, height: 175, backgroundColor: "rgba(0,0,0,0.27)" },
  scrimBottom: { position: "absolute", right: 0, bottom: 0, left: 0, height: 110, backgroundColor: "rgba(0,0,0,0.12)" },
  progressRow: { position: "absolute", top: 54, left: 12, right: 12, zIndex: 2, flexDirection: "row", gap: 4 },
  progressTrack: { flex: 1, height: 3, overflow: "hidden", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.42)" },
  progressComplete: { width: "100%", height: "100%", backgroundColor: "#FFFFFF" },
  progressActive: { height: "100%", backgroundColor: "#FFFFFF" },
  authorRow: { position: "absolute", top: 67, left: 16, right: 12, zIndex: 3, flexDirection: "row", alignItems: "center" },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#566174" },
  avatarLetter: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  authorText: { flex: 1, marginLeft: 10 },
  authorName: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  storyTime: { marginTop: 2, color: "rgba(255,255,255,0.82)", fontSize: 11 },
  closeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  tapZones: { flex: 1, flexDirection: "row", zIndex: 1 },
  tapZone: { flex: 1 },
});
