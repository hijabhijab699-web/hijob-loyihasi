import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, NativeModules, Platform } from 'react-native';
import {
  resources,
  defaultLanguage,
  supportedLanguages,
  isRtl,
  type SupportedLanguage,
} from '@n2431/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'n2431.language';

function detectLanguage(): SupportedLanguage {
  try {
    const raw =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ??
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    const code = String(raw ?? '').slice(0, 2).toLowerCase();
    if ((supportedLanguages as readonly string[]).includes(code)) {
      return code as SupportedLanguage;
    }
  } catch {}
  return defaultLanguage;
}

/**
 * Apply the RTL flip for Arabic. On React Native this needs a full reload
 * for the change to take effect — the caller tells the user and bounces
 * the app with Updates.reloadAsync when available.
 */
function applyRtl(lang: string) {
  const wantRtl = isRtl(lang);
  if (I18nManager.isRTL !== wantRtl) {
    try {
      I18nManager.allowRTL(wantRtl);
      I18nManager.forceRTL(wantRtl);
    } catch {}
    return true; // needs reload
  }
  return false;
}

export async function initI18n() {
  const stored = (await AsyncStorage.getItem(STORAGE_KEY).catch(() => null)) as
    | SupportedLanguage
    | null;

  const lang = stored && (supportedLanguages as readonly string[]).includes(stored)
    ? stored
    : detectLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: defaultLanguage,
    supportedLngs: [...supportedLanguages],
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  // Make sure the RN layout direction matches the current language on cold
  // start. If it changed between launches, the next reload picks it up.
  applyRtl(lang);
}

export async function setLanguage(lang: SupportedLanguage) {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  // RTL change only takes real effect after a reload — but calling
  // Updates.reloadAsync in development or on a build without expo-updates
  // was crashing the app (user reported "ilovadan chiqib ketyabdi").
  // Just flip the I18nManager flag; it comes into effect on next launch.
  applyRtl(lang);
}

export function needsReloadForRtl(lang: string): boolean {
  // Caller shows a "reopen the app" hint when switching to/from RTL,
  // instead of us forcing a reload that may crash the shell.
  const { I18nManager } = require('react-native');
  return I18nManager.isRTL !== isRtl(lang);
}

export { i18n };
