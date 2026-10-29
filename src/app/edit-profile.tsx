import { router } from "expo-router";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { api } from "../../convex/_generated/api";
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

type ProfileDraft = {
  displayName: string;
  username: string;
  bio: string;
};

export default function EditProfileScreen() {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 250, 1.5);
  const profile = useQuery(api.social.myProfile, {});
  const updateMyProfile = useMutation(api.social.updateMyProfile);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [location, setLocation] = useState("Poland");

  const baseDraft: ProfileDraft = {
    displayName: profile?.displayName ?? "",
    username: profile?.username ?? "",
    bio: profile?.bio ?? "",
  };
  const values: ProfileDraft = { ...baseDraft, ...draft };

  const updateField = (field: keyof ProfileDraft, value: string) => {
    setDraft((current) => ({ ...baseDraft, ...current, [field]: value }));
  };

  const chooseLocation = () => {
    Alert.alert("Location", "Choose your location", [
      { text: "Poland", onPress: () => setLocation("Poland") },
      { text: "Italy", onPress: () => setLocation("Italy") },
      { text: "France", onPress: () => setLocation("France") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateMyProfile(values);
      setDraft(null);
      router.back();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
        <ActivityIndicator style={{ flex: 1 }} color="#287BFF" />
      </SafeAreaView>
    );
  }
  if (profile === null) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
        <Text style={styles.error}>Your profile is not available.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.backLabel}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "right", "left"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { height: 40 * scale, paddingHorizontal: 12 * scale }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => router.back()}
            style={[styles.headerAction, { width: 34 * scale }]}
          >
            <SymbolView
              name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
              tintColor="#17191D"
              style={{ width: 17 * scale, height: 17 * scale }}
            />
          </Pressable>
          <Text style={[styles.title, { fontSize: 13 * scale }]}>Edit Profile</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            onPress={() => void saveProfile()}
            style={[styles.headerAction, styles.saveAction, { width: 48 * scale }]}
          >
            <Text style={[styles.saveLabel, { fontSize: 11 * scale }]}>{saving ? "Saving..." : "Save"}</Text>
          </Pressable>
        </View>

        <View style={[styles.avatarWrap, { width: 74 * scale, height: 74 * scale, marginTop: 5 * scale }]}>
          <Image
            accessibilityLabel="Profile photo"
            contentFit="cover"
            source={require("../../assets/images/profile-avatar.png")}
            style={styles.avatar}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            onPress={() => Alert.alert("Profile photo", "Photo selection is not connected yet.")}
            style={[styles.cameraButton, { width: 24 * scale, height: 24 * scale, borderRadius: 12 * scale, borderWidth: 2 * scale }]}
          >
            <SymbolView
              name={{ ios: "camera.fill", android: "photo_camera", web: "photo_camera" }}
              tintColor="#FFFFFF"
              style={{ width: 12 * scale, height: 12 * scale }}
            />
          </Pressable>
        </View>

        <View style={[styles.form, { paddingHorizontal: 16 * scale, marginTop: 10 * scale }]}>
          <ProfileField
            label="Display name"
            value={values.displayName}
            onChangeText={(value) => updateField("displayName", value)}
            scale={scale}
            maxLength={50}
          />
          <ProfileField
            label="Username"
            value={values.username}
            onChangeText={(value) => updateField("username", value)}
            scale={scale}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            containerStyle={{ marginTop: 12 * scale }}
          />
          <ProfileField
            label="Bio"
            value={values.bio}
            onChangeText={(value) => updateField("bio", value)}
            scale={scale}
            multiline
            maxLength={160}
            containerStyle={{ marginTop: 8 * scale }}
          />

          <View style={[styles.field, { marginTop: 6 * scale }]}>
            <Text style={[styles.label, { fontSize: 10 * scale, marginBottom: 3 * scale }]}>Location</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"Location, " + location}
              onPress={chooseLocation}
              style={[styles.locationInput, { height: 29 * scale, borderRadius: 7 * scale, paddingHorizontal: 8 * scale }]}
            >
              <SymbolView
                name={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }}
                tintColor="#24272C"
                style={{ width: 14 * scale, height: 14 * scale }}
              />
              <Text style={[styles.inputText, { fontSize: 11 * scale, marginLeft: 6 * scale }]}>{location}</Text>
              <SymbolView
                name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
                tintColor="#526071"
                style={{ width: 14 * scale, height: 14 * scale, marginLeft: "auto" }}
              />
            </Pressable>
          </View>
          {saveError ? <Text accessibilityRole="alert" style={[styles.error, { marginTop: 10 * scale }]}>{saveError}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  scale: number;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences";
  autoCorrect?: boolean;
  maxLength?: number;
  containerStyle?: object;
};

function ProfileField({
  label,
  value,
  onChangeText,
  scale,
  multiline = false,
  autoCapitalize = "sentences",
  autoCorrect = true,
  maxLength,
  containerStyle,
}: ProfileFieldProps) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={[styles.label, { fontSize: 10 * scale, marginBottom: 3 * scale }]}>{label}</Text>
      <View
        style={[
          styles.input,
          {
            minHeight: (multiline ? 45 : 29) * scale,
            borderRadius: 7 * scale,
            paddingHorizontal: 9 * scale,
            paddingVertical: multiline ? 6 * scale : 0,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          multiline={multiline}
          onChangeText={onChangeText}
          style={[styles.inputText, { fontSize: 11 * scale, lineHeight: 14 * scale }, multiline && styles.multilineInput]}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerAction: { height: "100%", alignItems: "flex-start", justifyContent: "center" },
  saveAction: { alignItems: "flex-end" },
  title: { color: "#15171A", fontWeight: "600", position: "absolute", left: 0, right: 0, textAlign: "center" },
  saveLabel: { color: "#2672F5", fontWeight: "500" },
  avatarWrap: { alignSelf: "center", position: "relative" },
  avatar: { width: "100%", height: "100%", borderRadius: 1000 },
  cameraButton: {
    position: "absolute",
    right: -1,
    bottom: -1,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#FFFFFF",
    backgroundColor: "#287BFF",
  },
  form: {},
  field: {},
  label: { color: "#17191D", fontWeight: "500" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#DEE1E5",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  inputText: { flex: 1, padding: 0, color: "#303640", includeFontPadding: false },
  multilineInput: { textAlignVertical: "top" },
  locationInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DEE1E5",
    backgroundColor: "#FFFFFF",
  },
  error: { color: "#B42318", textAlign: "center", fontSize: 12 },
  backLabel: { color: "#2672F5", textAlign: "center", marginTop: 10 },
});