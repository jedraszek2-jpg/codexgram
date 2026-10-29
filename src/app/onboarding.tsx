import { useAuth } from "@clerk/expo";
import * as ImagePicker from "expo-image-picker";
import { File, UploadType } from "expo-file-system";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Link, Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const usernamePattern = /^[a-zA-Z0-9._]{3,30}$/;

export default function OnboardingScreen() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const profile = useQuery(api.social.myProfile, isSignedIn ? {} : "skip");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUsernameAvailable = useQuery(
    api.social.isUsernameAvailable,
    isSignedIn && usernamePattern.test(username.trim())
      ? { username: username.trim() }
      : "skip",
  );
  const createProfile = useMutation(api.social.createProfile);
  const generateProfileImageUploadUrl = useMutation(api.social.generateProfileImageUploadUrl);

  const selectAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Allow photo library access to choose a profile photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
    } catch (cause) {
      Alert.alert("Photo unavailable", cause instanceof Error ? cause.message : "Please try again.");
    }
  };

  const uploadAvatar = async (uri: string, mimeType: string | null | undefined) => {
    const uploadUrl = await generateProfileImageUploadUrl({});
    const file = new File(uri);
    if (file.size <= 0) throw new Error("The selected photo is empty.");
    const path = uri.split(/[?#]/, 1)[0].toLowerCase();
    const extension = path.slice(path.lastIndexOf(".") + 1);
    const fallbackMimeType =
      extension === "png" ? "image/png" :
      extension === "webp" ? "image/webp" :
      extension === "heic" ? "image/heic" :
      "image/jpeg";
    const uploadTask = file.createUploadTask(uploadUrl, {
      httpMethod: "POST",
      uploadType: UploadType.BINARY_CONTENT,
      headers: { "Content-Type": mimeType ?? fallbackMimeType },
    });
    const uploadResponse = await uploadTask.uploadAsync().finally(() => uploadTask.release());
    if (!uploadResponse || uploadResponse.status < 200 || uploadResponse.status >= 300) {
      const status = uploadResponse?.status ?? "no response";
      const responseText = uploadResponse?.body.trim().slice(0, 180);
      throw new Error(
        responseText
          ? `Convex rejected the photo upload (${status}): ${responseText}`
          : `Convex rejected the photo upload (${status}).`,
      );
    }
    const result = JSON.parse(uploadResponse.body) as { storageId?: string };
    if (!result.storageId) throw new Error("The photo upload response was invalid.");
    return result.storageId as Id<"_storage">;
  };

  const handleSignUp = async () => {
    const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
    const trimmedDisplayName = displayName.trim();
    if (!usernamePattern.test(normalizedUsername)) {
      setError("Use 3–30 letters, numbers, periods, or underscores for your username.");
      return;
    }
    if (isUsernameAvailable !== true) {
      setError("Choose an available username.");
      return;
    }
    if (!trimmedDisplayName || trimmedDisplayName.length > 50) {
      setError("Enter a display name between 1 and 50 characters.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const asset = avatarUri ? { uri: avatarUri } : null;
      const avatarStorageId = asset ? await uploadAvatar(asset.uri, "image/jpeg") : undefined;
      await createProfile({
        username: normalizedUsername,
        displayName: trimmedDisplayName,
        ...(avatarStorageId ? { avatarStorageId } : {}),
      });
      router.replace("/home");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your account could not be created.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || (isSignedIn && profile === undefined)) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#287BFF" />
      </SafeAreaView>
    );
  }
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  if (profile) return <Redirect href="/home" />;

  const usernameValid = usernamePattern.test(username.trim());
  const displayNameValid = displayName.trim().length > 0 && displayName.trim().length <= 50;
  const canSubmit = usernameValid && isUsernameAvailable === true && displayNameValid && !saving;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left", "bottom"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join Codexgram and share real moments.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <View style={[styles.inputWrap, isUsernameAvailable === true && styles.availableInput]}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              onChangeText={(value) => {
                setUsername(value.replace(/^@/, "").toLowerCase());
                setError(null);
              }}
              placeholder="Choose a username"
              placeholderTextColor="#8A9099"
              style={styles.input}
              value={username}
            />
            {isUsernameAvailable === true ? <Text style={styles.checkmark}>✓</Text> : null}
            {usernameValid && isUsernameAvailable === undefined ? <ActivityIndicator size="small" color="#287BFF" /> : null}
          </View>
          {isUsernameAvailable === true ? (
            <Text style={styles.availableText}>Username is available</Text>
          ) : isUsernameAvailable === false && usernameValid ? (
            <Text style={styles.unavailableText}>This username is already taken.</Text>
          ) : null}

          <Text style={[styles.label, styles.displayLabel]}>Display name</Text>
          <TextInput
            autoCapitalize="words"
            maxLength={50}
            onChangeText={(value) => {
              setDisplayName(value);
              setError(null);
            }}
            placeholder="Your name"
            placeholderTextColor="#8A9099"
            style={styles.textInput}
            value={displayName}
          />

          <Text style={[styles.label, styles.photoLabel]}>Add a profile photo</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose a profile photo" onPress={() => void selectAvatar()} style={styles.avatarButton}>
            <Image
              source={avatarUri ? { uri: avatarUri } : require("../../assets/images/profile-avatar.png")}
              contentFit="cover"
              style={styles.avatar}
            />
            <View style={styles.cameraBadge}>
              <SymbolView
                name={{ ios: "camera.fill", android: "photo_camera", web: "photo_camera" }}
                tintColor="#FFFFFF"
                size={13}
              />
            </View>
          </Pressable>
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          disabled={!canSubmit}
          onPress={() => void handleSignUp()}
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
        >
          <Text style={styles.submitLabel}>{saving ? "Creating..." : "Sign up"}</Text>
        </Pressable>

        <Link href="/sign-in" asChild>
          <Pressable accessibilityRole="link" style={styles.signInLink}>
            <Text style={styles.signInText}>Already have an account? <Text style={styles.signInAction}>Sign in</Text></Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 22 },
  title: { color: "#111827", fontSize: 27, lineHeight: 33, fontWeight: "700", letterSpacing: -0.6 },
  subtitle: { marginTop: 4, color: "#363C46", fontSize: 15, lineHeight: 21 },
  form: { marginTop: 68 },
  label: { marginBottom: 6, color: "#20242C", fontSize: 12, fontWeight: "600" },
  inputWrap: { minHeight: 47, flexDirection: "row", alignItems: "center", paddingHorizontal: 11, borderWidth: 1, borderColor: "#D8DEE8", borderRadius: 10 },
  availableInput: { borderColor: "#26A269" },
  input: { flex: 1, paddingVertical: 10, color: "#20242C", fontSize: 14 },
  checkmark: { color: "#22A467", fontSize: 20, fontWeight: "700" },
  availableText: { marginTop: 5, color: "#168A55", fontSize: 11 },
  unavailableText: { marginTop: 5, color: "#C43D46", fontSize: 11 },
  displayLabel: { marginTop: 17 },
  textInput: { minHeight: 47, paddingHorizontal: 11, borderWidth: 1, borderColor: "#D8DEE8", borderRadius: 10, color: "#20242C", fontSize: 14 },
  photoLabel: { marginTop: 18 },
  avatarButton: { width: 76, height: 76, alignSelf: "center", marginTop: 1 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#E9EEF8" },
  cameraBadge: { position: "absolute", right: -2, bottom: -1, width: 25, height: 25, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF", borderRadius: 13, backgroundColor: "#287BFF" },
  error: { marginTop: 12, color: "#B42318", fontSize: 12, lineHeight: 17 },
  submitButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 22, borderRadius: 25, backgroundColor: "#2F60FA" },
  submitDisabled: { opacity: 0.5 },
  submitLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  signInLink: { alignSelf: "center", marginTop: 12, padding: 4 },
  signInText: { color: "#48505C", fontSize: 11 },
  signInAction: { color: "#287BFF", fontWeight: "700" },
});
