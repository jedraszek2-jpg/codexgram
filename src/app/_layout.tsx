import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { enUS } from "@clerk/localizations/en-US";
import { plPL } from "@clerk/localizations/pl-PL";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";
import i18n, { i18nReady } from "../lib/i18n";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your Clerk publishable key to .env.local.");
}
if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL. Add your Convex deployment URL to .env.local.");
}

const convex = new ConvexReactClient(convexUrl);

function LocalizedAppProviders() {
  const { i18n: activeI18n } = useTranslation();
  const localization = activeI18n.resolvedLanguage === "pl" ? plPL : enUS;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      localization={localization}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default function RootLayout() {
  const [translationsReady, setTranslationsReady] = useState(i18n.isInitialized);

  useEffect(() => {
    let mounted = true;
    void i18nReady.then(() => {
      if (mounted) setTranslationsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {translationsReady ? <LocalizedAppProviders /> : null}
    </I18nextProvider>
  );
}