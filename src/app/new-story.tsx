import { useMutation } from "convex/react";
import { File, UploadType } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const MAX_STORY_BYTES = 10 * 1024 * 1024;

function getImageContentType(asset: ImagePicker.ImagePickerAsset) {
  if (asset.mimeType) return asset.mimeType;
  const path = asset.uri.split(/[?#]/, 1)[0].toLowerCase();
  const extension = path.slice(path.lastIndexOf(".") + 1);
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}

export default function NewStoryScreen() {
  const generateUploadUrl = useMutation(api.stories.generateStoryUploadUrl);
  const createStory = useMutation(api.stories.createStory);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const acceptAsset = (candidate: ImagePicker.ImagePickerAsset | undefined) => {
    if (!candidate) return;
    const file = new File(candidate.uri);
    if (file.size <= 0) {
      setError("The selected photo could not be read.");
      return;
    }
    if (file.size > MAX_STORY_BYTES) {
      setError("Story photos must be 10 MB or smaller.");
      return;
    }
    setError(null);
    setProgress(0);
    setAsset(candidate);
  };

  const chooseFromLibrary = async () => {
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Allow photo library access to choose a story photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.9,
      });
      if (!result.canceled) acceptAsset(result.assets[0]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The photo library could not be opened.");
    }
  };

  const takePhoto = async () => {
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Allow camera access to take a story photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.9,
      });
      if (!result.canceled) acceptAsset(result.assets[0]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The camera could not be opened.");
    }
  };

  const publish = async () => {
    if (!asset || publishing) return;
    setPublishing(true);
    setError(null);
    setProgress(0);
    try {
      const file = new File(asset.uri);
      if (file.size <= 0 || file.size > MAX_STORY_BYTES) {
        throw new Error("Story photos must be between 1 byte and 10 MB.");
      }

      const uploadUrl = await generateUploadUrl({});
      const task = file.createUploadTask(uploadUrl, {
        httpMethod: "POST",
        uploadType: UploadType.BINARY_CONTENT,
        headers: { "Content-Type": getImageContentType(asset) },
        onProgress: ({ bytesSent, totalBytes }) => {
          setProgress(totalBytes > 0 ? Math.min(1, bytesSent / totalBytes) : 0);
        },
      });
      const response = await task.uploadAsync().finally(() => task.release());
      if (!response || response.status < 200 || response.status >= 300) {
        throw new Error(`Photo upload failed (${response?.status ?? "no response"}).`);
      }

      const uploadResult = JSON.parse(response.body) as { storageId?: string };
      if (!uploadResult.storageId) throw new Error("The photo upload response was invalid.");
      await createStory({ mediaId: uploadResult.storageId as Id<"_storage"> });
      router.replace("/home");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The story could not be published.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "bottom", "left"]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          disabled={publishing}
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} tintColor="#6B7280" size={22} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>New story</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!asset || publishing}
          onPress={() => void publish()}
          style={[styles.publishButton, (!asset || publishing) && styles.disabled]}
        >
          <Text style={styles.publishLabel}>{publishing ? "Publishing" : "Publish"}</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={asset ? "Choose another story photo" : "Choose a story photo"}
          disabled={publishing}
          onPress={() => void chooseFromLibrary()}
          style={[styles.preview, asset && styles.previewSelected]}
        >
          {asset ? (
            <Image source={{ uri: asset.uri }} contentFit="cover" style={styles.previewImage} />
          ) : (
            <View style={styles.emptyPreview}>
              <SymbolView name={{ ios: "camera", android: "photo_camera", web: "photo_camera" }} tintColor="#1681F8" size={44} />
              <Text style={styles.previewTitle}>Choose a photo</Text>
              <Text style={styles.previewLink}>Open photo library</Text>
            </View>
          )}
        </Pressable>

        {publishing ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={publishing}
            onPress={() => void takePhoto()}
            style={({ pressed }) => [styles.actionButton, styles.cameraButton, pressed && styles.pressed]}
          >
            <SymbolView name={{ ios: "camera", android: "photo_camera", web: "photo_camera" }} tintColor="#FFFFFF" size={22} />
            <Text style={styles.cameraLabel}>Camera</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={publishing}
            onPress={() => void chooseFromLibrary()}
            style={({ pressed }) => [styles.actionButton, styles.libraryButton, pressed && styles.pressed]}
          >
            <SymbolView name={{ ios: "photo", android: "image", web: "image" }} tintColor="#1681F8" size={22} />
            <Text style={styles.libraryLabel}>Library</Text>
          </Pressable>
        </View>

        <Text style={styles.helperText}>Share a photo for 24 hours. Visible to signed-in members. Up to 10 MB.</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {publishing ? <ActivityIndicator style={styles.spinner} color="#1681F8" /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  headerSide: { width: 68, height: 44, justifyContent: "center" },
  title: { color: "#15171B", fontSize: 18, fontWeight: "700" },
  publishButton: { minWidth: 86, height: 42, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#63A5F8" },
  publishLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  disabled: { opacity: 0.45 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  preview: { flex: 1, minHeight: 240, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#B9C4D4", borderRadius: 24, overflow: "hidden", backgroundColor: "#F8FAFD" },
  previewSelected: { borderStyle: "solid", borderColor: "#E7EAF0" },
  previewImage: { width: "100%", height: "100%" },
  emptyPreview: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  previewTitle: { marginTop: 20, color: "#20242C", fontSize: 18, fontWeight: "500" },
  previewLink: { marginTop: 18, color: "#1681F8", fontSize: 16, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionButton: { flex: 1, minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 30 },
  cameraButton: { backgroundColor: "#1681F8" },
  libraryButton: { backgroundColor: "#EAF3FF" },
  cameraLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  libraryLabel: { color: "#1681F8", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.78 },
  helperText: { marginTop: 18, color: "#777F8D", fontSize: 14, lineHeight: 21 },
  progressTrack: { height: 4, borderRadius: 2, marginTop: 10, overflow: "hidden", backgroundColor: "#E8EEF7" },
  progressFill: { height: 4, backgroundColor: "#1681F8" },
  error: { marginTop: 10, color: "#B42318", fontSize: 13, lineHeight: 18 },
  spinner: { marginTop: 10 },
});
