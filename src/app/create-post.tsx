import { Redirect, router } from "expo-router";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import { File, UploadType } from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useConvexAuth, useMutation } from "convex/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export default function CreatePostScreen() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const requestUpload = useMutation(api.media.generateUploadUrl);
  const finalizeUpload = useMutation(api.media.finalizeUpload);
  const createPost = useMutation(api.social.createPost);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadedMediaId, setUploadedMediaId] = useState<Id<"media"> | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const chooseMedia = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: false,
      allowsEditing: false,
      videoMaxDuration: 30,
      quality: 1,
    });
    if (!result.canceled) {
      setAsset(result.assets[0] ?? null);
      setUploadedMediaId(null);
      setProgress(0);
    }
  };

  const publish = async () => {
    if (!asset || isPublishing) return;
    setIsPublishing(true);
    setError(null);
    try {
      let mediaId = uploadedMediaId;
      if (!mediaId) {
        const mediaType = asset.type === "video" ? "video" : "image";
        const contentType =
          asset.mimeType ?? (mediaType === "video" ? "video/mp4" : "image/jpeg");
        const file = new File(asset.uri);
        const byteSize = asset.fileSize ?? file.size;
        const maxBytes = mediaType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
        if (!byteSize || byteSize > maxBytes) {
          setError(mediaType === "image" ? t("createPost.photoLimit", { maxMb: 15 }) : t("createPost.videoLimit", { maxMb: 50 }));
          return;
        }
        const durationSeconds = asset.duration == null ? undefined : asset.duration / 1000;
        if (mediaType === "video" && (!durationSeconds || durationSeconds > 30)) {
          setError(t("createPost.videoDuration", { maxSeconds: 30 }));
          return;
        }

        const upload = await requestUpload({
          mediaType,
          contentType,
          byteSize,
          ...(durationSeconds ? { durationSeconds } : {}),
        });
        const task = file.createUploadTask(upload.uploadUrl, {
          httpMethod: "POST",
          uploadType: UploadType.BINARY_CONTENT,
          headers: { "Content-Type": contentType },
          onProgress: ({ bytesSent, totalBytes }) => {
            setProgress(totalBytes > 0 ? Math.min(1, bytesSent / totalBytes) : 0);
          },
        });
        const result = await task.uploadAsync().finally(() => task.release());
        if (result.status < 200 || result.status >= 300) {
          setError(t("createPost.uploadFailed", { status: result.status }));
          return;
        }
        const uploadResult = JSON.parse(result.body) as { storageId?: Id<"_storage"> };
        if (!uploadResult.storageId) {
          setError(t("createPost.uploadResponseInvalid"));
          return;
        }
        await finalizeUpload({ mediaId: upload.mediaId, storageId: uploadResult.storageId });
        mediaId = upload.mediaId;
        setUploadedMediaId(mediaId);
      }

      await createPost({ mediaId, caption });
      router.replace("/home");
    } catch {
      setError(t("createPost.publishFailed"));
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isLoading && !isAuthenticated) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("createPost.close")} onPress={() => router.back()}>
          <Text style={styles.cancel}>{t("common.cancel")}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>{t("createPost.title")}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!asset || isPublishing}
          onPress={() => void publish()}
          style={[styles.publishButton, (!asset || isPublishing) && styles.disabled]}
        >
          <Text style={styles.publishLabel}>{isPublishing ? t("createPost.posting") : t("createPost.share")}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={asset ? t("createPost.chooseAnother") : t("createPost.chooseMedia")}
          onPress={() => void chooseMedia()}
          style={styles.preview}
        >
          {asset?.type === "video" ? (
            <VideoPreview uri={asset.uri} />
          ) : asset ? (
            <Image source={{ uri: asset.uri }} contentFit="contain" style={styles.previewMedia} />
          ) : (
            <View style={styles.emptyPreview}>
              <Text style={styles.plus}>+</Text>
              <Text style={styles.previewTitle}>{t("createPost.previewTitle")}</Text>
              <Text style={styles.previewHint}>{t("createPost.previewHint")}</Text>
            </View>
          )}
        </Pressable>

        {asset ? (
          <Pressable accessibilityRole="button" onPress={() => void chooseMedia()} style={styles.changeMedia}>
            <Text style={styles.changeMediaText}>{t("createPost.changeMedia")}</Text>
          </Pressable>
        ) : null}

        <TextInput
          accessibilityLabel={t("createPost.caption")}
          maxLength={2200}
          multiline
          onChangeText={setCaption}
          placeholder={t("createPost.captionPlaceholder")}
          placeholderTextColor="#8A9099"
          style={styles.caption}
          value={caption}
        />

        {isPublishing ? (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              {uploadedMediaId ? t("createPost.publishingPost") : t("createPost.uploadingPercent", { percent: Math.round(progress * 100) })}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
            </View>
          </View>
        ) : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {isLoading ? <ActivityIndicator color="#3A86FF" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function VideoPreview({ uri }: { uri: string }) {
  const { t } = useTranslation();
  const player = useVideoPlayer(uri, (instance) => {
    instance.muted = true;
    instance.loop = true;
  });
  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      style={styles.previewMedia}
      accessibilityLabel={t("createPost.videoPreview")}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    height: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  cancel: { color: "#626B77", fontSize: 14 },
  title: { color: "#20242C", fontSize: 16, fontWeight: "700" },
  publishButton: {
    minWidth: 52,
    alignItems: "flex-end",
    paddingVertical: 10,
  },
  publishLabel: { color: "#3A86FF", fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.45 },
  content: { padding: 16, paddingBottom: 30 },
  preview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F4F5F7",
  },
  previewMedia: { width: "100%", height: "100%" },
  emptyPreview: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  plus: { color: "#3A86FF", fontSize: 40, lineHeight: 48 },
  previewTitle: { marginTop: 8, color: "#303640", fontSize: 15, fontWeight: "600" },
  previewHint: { marginTop: 6, color: "#7A828E", fontSize: 12, textAlign: "center" },
  changeMedia: { alignSelf: "center", paddingVertical: 14 },
  changeMediaText: { color: "#3A86FF", fontSize: 13, fontWeight: "600" },
  caption: {
    minHeight: 96,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#F7F8FA",
    color: "#24272C",
    fontSize: 15,
    textAlignVertical: "top",
  },
  progressSection: { marginTop: 16 },
  progressLabel: { color: "#626B77", fontSize: 13, marginBottom: 8 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: "#E8EBF0", overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: "#3A86FF" },
  error: { marginTop: 14, color: "#B42318", fontSize: 13, lineHeight: 19 },
});