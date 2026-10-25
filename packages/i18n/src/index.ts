import ru from './locales/ru.json';
import uz from './locales/uz.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

export const resources = {
  ru: { translation: ru },
  uz: { translation: uz },
  en: { translation: en },
  ar: { translation: ar },
} as const;

export const defaultLanguage = 'uz' as const;

export const supportedLanguages = ['uz', 'ru', 'en', 'ar'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

/**
 * TZ Phase 9 — right-to-left languages. Arabic flips the whole layout
 * so the mobile app wraps RN's I18nManager + stores need to know which
 * languages this covers. Add more codes here when you add RTL locales.
 */
export const rtlLanguages: readonly SupportedLanguage[] = ['ar'] as const;

export function isRtl(lang: string): boolean {
  return (rtlLanguages as readonly string[]).includes(lang);
}

export type TranslationKeys = typeof ru;

/**
 * TypeScript uchun autocompletion. i18next `t()` chaqiruvida ishlaydi.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: TranslationKeys };
    defaultNS: 'translation';
  }
}

export { ru, uz, en, ar };
