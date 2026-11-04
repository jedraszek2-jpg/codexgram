import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en";
import pl from "../locales/pl";

export type AppLanguage = "pl" | "en";

const LANGUAGE_STORAGE_KEY = "@codexgram/language";
const deviceLanguage = getLocales()[0]?.languageCode;
const systemLanguage: AppLanguage = deviceLanguage?.toLowerCase().startsWith("pl") ? "pl" : "en";

const resources = {
  en: { translation: en },
  pl: { translation: pl },
} as const;

export const i18nReady = (async () => {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).catch(() => null);
  const initialLanguage: AppLanguage =
    savedLanguage === "pl" || savedLanguage === "en" ? savedLanguage : systemLanguage;

  await i18next.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: "en",
    supportedLngs: ["pl", "en"],
    interpolation: { escapeValue: false },
  });
})();

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18next.changeLanguage(language);
}

export default i18next;