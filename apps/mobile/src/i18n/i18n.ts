import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';
import { resources, defaultLanguage, supportedLanguages } from '@n2431/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'n2431.language';

function detectLanguage(): 'uz' | 'ru' {
  try {
    const raw =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ??
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    const code = String(raw ?? '').slice(0, 2).toLowerCase();
    if (code === 'uz') return 'uz';
    if (code === 'ru') return 'ru';
  } catch {}
  return defaultLanguage;
}

export async function initI18n() {
  const stored = (await AsyncStorage.getItem(STORAGE_KEY).catch(() => null)) as
    | 'uz'
    | 'ru'
    | null;

  await i18n.use(initReactI18next).init({
    resources,
    lng: stored ?? detectLanguage(),
    fallbackLng: defaultLanguage,
    supportedLngs: [...supportedLanguages],
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export async function setLanguage(lang: 'uz' | 'ru') {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
}

export { i18n };
