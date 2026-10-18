/**
 * Maps backend error codes/messages to user-friendly, localized text.
 *
 * NestJS throws codes like `USERNAME_TAKEN`, `STYLED_IMAGE_UNREACHABLE`,
 * `INVALID_CREDENTIALS` as `message` strings. Showing them raw to users
 * is confusing. Keep the mapping in one place so new codes can be added
 * without hunting through every call site.
 */
import { i18n } from '../i18n/i18n';

const MESSAGES: Record<string, { uz: string; ru: string }> = {
  USERNAME_TAKEN: {
    uz: 'Bu foydalanuvchi nomi band',
    ru: 'Это имя пользователя занято',
  },
  PHONE_TAKEN: {
    uz: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan',
    ru: 'Этот номер телефона уже зарегистрирован',
  },
  EMAIL_TAKEN: {
    uz: 'Bu email allaqachon ro\'yxatdan o\'tgan',
    ru: 'Этот email уже зарегистрирован',
  },
  INVALID_CREDENTIALS: {
    uz: 'Telefon yoki parol noto\'g\'ri',
    ru: 'Неверный номер телефона или пароль',
  },
  USER_NOT_FOUND: {
    uz: 'Foydalanuvchi topilmadi',
    ru: 'Пользователь не найден',
  },
  INVALID_TOKEN: {
    uz: 'Sessiya tugadi. Qayta kiring',
    ru: 'Сессия истекла. Войдите снова',
  },
  STYLED_IMAGE_UNREACHABLE: {
    uz: 'Virtual primerka vaqtincha ishlamayapti. Keyinroq urining',
    ru: 'Виртуальная примерка временно недоступна. Попробуйте позже',
  },
  TRYON_FAILED: {
    uz: 'Virtual primerka amalga oshmadi',
    ru: 'Виртуальная примерка не удалась',
  },
  FACE_NOT_DETECTED: {
    uz: 'Yuz aniqlanmadi. Yorug\' joyda qayta urining',
    ru: 'Лицо не распознано. Попробуйте при хорошем освещении',
  },
  INSUFFICIENT_PERMISSIONS: {
    uz: 'Sizda bu amalni bajarish uchun ruxsat yo\'q',
    ru: 'У вас нет прав для этого действия',
  },
  VALIDATION_ERROR: {
    uz: 'Ma\'lumotlar noto\'g\'ri kiritilgan',
    ru: 'Неверно заполнены данные',
  },
  NETWORK_ERROR: {
    uz: 'Tarmoq xatosi. Internet ulanishini tekshiring',
    ru: 'Ошибка сети. Проверьте подключение к интернету',
  },
  SERVER_ERROR: {
    uz: 'Server xatosi. Keyinroq urining',
    ru: 'Ошибка сервера. Попробуйте позже',
  },
  OUT_OF_STOCK: {
    uz: 'Mahsulot omborda yo\'q',
    ru: 'Товара нет в наличии',
  },
  CART_EMPTY: {
    uz: 'Savat bo\'sh',
    ru: 'Корзина пуста',
  },
  ADDRESS_REQUIRED: {
    uz: 'Yetkazish uchun manzil tanlang',
    ru: 'Выберите адрес доставки',
  },
};

const TITLES = {
  uz: 'Xatolik',
  ru: 'Ошибка',
};

export function getCurrentLang(): 'uz' | 'ru' {
  return (i18n.language?.slice(0, 2) === 'ru' ? 'ru' : 'uz');
}

export function errorTitle(): string {
  return TITLES[getCurrentLang()];
}

/**
 * Extracts a user-friendly message from an axios error, backend code, or raw
 * exception. Falls back to the raw backend message when the code is unknown,
 * then to a generic network-error message.
 */
export function errorMessage(err: unknown): string {
  const lang = getCurrentLang();
  const generic = MESSAGES.NETWORK_ERROR![lang];

  if (!err) return generic;

  // Axios shape: { response: { data: { message } } }
  const anyErr = err as any;
  const raw =
    anyErr?.response?.data?.message ??
    anyErr?.response?.data?.error ??
    anyErr?.message;

  if (!raw) return generic;

  // NestJS validation errors can be an array of strings — use the first.
  const key = Array.isArray(raw) ? String(raw[0] ?? '') : String(raw);

  // Match UPPER_SNAKE_CASE code
  const normalized = key.toUpperCase().replace(/[^A-Z_]/g, '_');
  const match = MESSAGES[normalized];
  if (match) return match[lang];

  // Not a known code — if it looks like a readable sentence, show it;
  // otherwise fall back to generic.
  if (/^[A-Z_]+$/.test(key)) {
    // Looks like an unmapped UPPER_SNAKE code — show generic error so the
    // user doesn't see something like "STYLED_IMAGE_UNREACHABLE".
    return MESSAGES.SERVER_ERROR![lang];
  }

  return key;
}
