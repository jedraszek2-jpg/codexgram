import { useUser } from "@clerk/expo";
import { api } from "../../convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function ConvexProfileBootstrap({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn, user } = useUser();
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const profile = useQuery(
    api.social.myProfile,
    isSignedIn && isAuthenticated ? {} : "skip",
  );
  const ensureMyProfile = useMutation(api.social.ensureMyProfile);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clerkUsername = user?.username?.trim().replace(/^@/, "").toLowerCase();
  const username =
    clerkUsername && /^[a-z0-9._]{3,30}$/.test(clerkUsername)
      ? clerkUsername
      : user
        ? "user_" + user.id.slice(-24).toLowerCase()
        : undefined;
  const displayName =
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    username ||
    "New member";
  const avatarUrl = user?.imageUrl || undefined;

  useEffect(() => {
    if (!isAuthenticated || !user || !username || profile !== null) return;
    void ensureMyProfile({
      username,
      displayName,
      ...(avatarUrl ? { avatarUrl } : {}),
    }).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "Your profile could not be created.");
    });
  }, [avatarUrl, displayName, ensureMyProfile, isAuthenticated, profile, retry, user, username]);

  if (!clerkLoaded || (isSignedIn && (convexLoading || profile === undefined))) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#3A86FF" />
      </View>
    );
  }

  if (isSignedIn && profile === null) {
    return (
      <View style={styles.loading}>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setError(null);
                setRetry((value) => value + 1);
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color="#3A86FF" />
            <Text style={styles.loadingText}>Setting up your profile…</Text>
          </>
        )}
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  loadingText: {
    marginTop: 12,
    color: "#626B77",
    fontSize: 14,
  },
  error: {
    color: "#B42318",
    textAlign: "center",
    fontSize: 14,
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#3A86FF",
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});