import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Link, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";

const photo = require("../../assets/images/auth-scene.png");
const logo = require("../../assets/images/codexgram-mark.png");

export default function Index() {
  const { width, height } = useWindowDimensions();
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });


  const scale = Math.min(width / 390, 1.12);
  const compact = height < 740;
  const titleSize = (compact ? 27 : 30) * scale;
  const bodySize = 18 * scale;
  const buttonHeight = (compact ? 48 : 54) * scale;
  const sceneTop = height * 0.246;
  const sceneHeight = height * 0.472;
  const headerTop = height * 0.123;
  const footerBottom = height * 0.065;
  const paginationTop = height * 0.653;

  if (isSignedIn) {
    return <Redirect href="/home" />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.brand, { top: height * 0.075 }]}>
        <Image source={logo} style={styles.brandIcon} contentFit="contain" accessible={false} />
        <Text accessibilityRole="image" accessibilityLabel="Codexgram" style={styles.brandName}>
          Codexgram
        </Text>
      </View>

      <Image
        source={photo}
        style={[styles.scene, { top: sceneTop, height: sceneHeight }]}
        contentFit="fill"
        accessible={false}
      />

      <View
        style={[
          styles.header,
          {
            top: headerTop,
            paddingHorizontal: width * 0.08,
          },
        ]}
      >
        <Text
          accessibilityRole="header"
          style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.16 }]}
        >
          Share your world
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              fontSize: bodySize,
              lineHeight: bodySize * 1.22,
              marginTop: 18 * scale,
            },
          ]}
        >
          A minimal space for{"\n"}your moments
        </Text>
      </View>

      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.pagination, { top: paginationTop }]}
      >
        <View style={styles.activeDot} />
        <View style={styles.inactiveDot} />
        <View style={styles.inactiveDot} />
      </View>

      <View
        style={[
          styles.footer,
          {
            left: width * 0.125,
            right: width * 0.125,
            bottom: footerBottom,
          },
        ]}
      >
        {!isLoaded ? (
          <View style={{ height: buttonHeight * 2 + 9 * scale }} />
        ) : (
          <>
            <Link href="/sign-up" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create account"
                style={({ pressed }) => [
                  styles.button,
                  styles.primaryButton,
                  { height: buttonHeight },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.buttonLabel, { fontSize: 15 * scale }]}>
                  Create account
                </Text>
              </Pressable>
            </Link>

            <Link href="/sign-in" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                style={({ pressed }) => [
                  styles.button,
                  styles.secondaryButton,
                  { height: buttonHeight, marginTop: 9 * scale },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.buttonLabel,
                    styles.darkButtonLabel,
                    { fontSize: 15 * scale },
                  ]}
                >
                  Sign in
                </Text>
              </Pressable>
            </Link>

            <Text
              style={[
                styles.legal,
                {
                  fontSize: 11 * scale,
                  lineHeight: 16 * scale,
                  marginTop: 15 * scale,
                },
              ]}
            >
              By continuing, you agree to our{"\n"}Terms of Service and Privacy Policy.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FBF3EE",
    overflow: "hidden",
  },
  brand: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  brandIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  brandName: {
    color: "#111114",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.45,
  },
  scene: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
  },
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  title: {
    color: "#101114",
    fontWeight: "700",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  subtitle: {
    color: "#101114",
    fontWeight: "400",
    textAlign: "center",
  },
  pagination: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  inactiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    opacity: 0.56,
  },
  footer: {
    position: "absolute",
    alignItems: "stretch",
  },
  button: {
    width: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  primaryButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E1E1E",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: "#111111",
    shadowColor: "#1E1E1E",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  signOutButton: {
    backgroundColor: "#111111",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonLabel: {
    color: "#101114",
    fontWeight: "600",
    textAlign: "center",
  },
  darkButtonLabel: {
    color: "#FFFFFF",
  },
  accountLabel: {
    color: "#181818",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 5,
  },
  legal: {
    color: "#181818",
    fontWeight: "400",
    textAlign: "center",
  },
});
