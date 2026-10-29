import { useAuth } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

const logo = (
  <Image
    source={require("../../design/logo.png")}
    style={{ width: 36, height: 36 }}
    contentFit="contain"
    accessibilityLabel="Codexgram"
  />
);

export default function SignUpScreen() {
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn, router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthView
        mode="signInOrUp"
        logo={logo}
        isDismissible={false}
        onHostBack={() => router.back()}
      />
    </>
  );
}
