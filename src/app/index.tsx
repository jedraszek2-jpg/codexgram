import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Link, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";

const logo = require("../../design/logo.png");

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const profile = useQuery(api.social.myProfile, isSignedIn ? {} : "skip");

  if (!isLoaded || (isSignedIn && profile === undefined)) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#287BFF" />
      </SafeAreaView>
    );
  }

  if (isSignedIn) {
    return <Redirect href={profile ? "/home" : "/onboarding"} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.hero}>
        <Image
          source={require("../../assets/images/auth-scene.png")}
          style={styles.heroImage}
          contentFit="cover"
          accessibilityLabel="A quiet sunset overlooking the sea"
        />
        <View pointerEvents="none" style={styles.heroShade} />
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} contentFit="contain" accessibilityLabel="Codexgram logo" />
          <Text style={styles.brandName}>Codexgram</Text>
          <Text style={styles.tagline}>Share the moments that bring you together.</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.intro}>
          <Text style={styles.heading}>Your moments, together.</Text>
          <Text style={styles.description}>A place to share everyday life with the people you love.</Text>
        </View>
        <Link href="/sign-in" asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>Continue with Email</Text>
          </Pressable>
        </Link>
        <Link href="/sign-in" asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.pressed]}>
            <Text style={styles.googleLabel}>Continue with Google</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  hero: { flex: 1.12, minHeight: 280, justifyContent: "center", overflow: "hidden" },
  heroImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  heroShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(17, 28, 48, 0.32)" },
  brand: { alignItems: "center", paddingHorizontal: 24 },
  logo: { width: 76, height: 76, marginBottom: 12 },
  brandName: { color: "#FFFFFF", fontSize: 36, fontWeight: "800", letterSpacing: 0.2 },
  tagline: { color: "#F5F7FB", fontSize: 15, marginTop: 8, textAlign: "center" },
  actions: { flex: 0.9, width: "100%", maxWidth: 440, alignSelf: "center", justifyContent: "center", gap: 12, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 18 },
  intro: { marginBottom: 8 },
  heading: { color: "#17212F", fontSize: 23, fontWeight: "700", letterSpacing: -0.4 },
  description: { color: "#687386", fontSize: 14, lineHeight: 20, marginTop: 6 },
  button: { minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 28 },
  primaryButton: { backgroundColor: "#287BFF" },
  googleButton: { borderWidth: 1, borderColor: "#D8DEE8", backgroundColor: "#FFFFFF" },
  primaryLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  googleLabel: { color: "#20242C", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.78 },
});
