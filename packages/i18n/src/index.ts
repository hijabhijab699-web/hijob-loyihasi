import ru from './locales/ru.json';
import uz from './locales/uz.json';

export const resources = {
  ru: { translation: ru },
  uz: { translation: uz },
} as const;

export const defaultLanguage = 'ru' as const;

export const supportedLanguages = ['uz', 'ru'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

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

export { ru, uz };
