/**
 * Safe wrapper around React Native's Alert.alert.
 *
 * iOS 26's UIAlertController crashes with `-[NSObject __retain_OA]` on nil
 * when `addAction:` runs against a controller whose message is non-string
 * (array/object/null). React Native's AlertManager passes the args through
 * without coercion, so any caller that forwards `e?.response?.data?.message`
 * from NestJS validation errors (which is an array of strings) triggers the
 * crash on physical devices with iOS 26.
 *
 * This module installs a defensive wrapper over Alert.alert at import time:
 *  - title/message are coerced to strings
 *  - buttons' text/style are sanitised
 *  - the whole call is wrapped in setTimeout so a throw doesn't abort the JS
 *    call site mid-render
 */
import { Alert, type AlertButton } from 'react-native';

type AlertFn = typeof Alert.alert;

const toStr = (v: unknown, fallback = ''): string => {
  if (v == null) return fallback;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.filter(Boolean).map(String).join('\n') || fallback;
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return fallback;
    }
  }
  return String(v);
};

const sanitiseButtons = (buttons?: AlertButton[]): AlertButton[] | undefined => {
  if (!Array.isArray(buttons)) return undefined;
  return buttons
    .filter(Boolean)
    .map((b) => ({
      text: toStr(b.text, 'OK'),
      style: b.style,
      onPress: b.onPress,
      isPreferred: b.isPreferred,
    }));
};

const originalAlert: AlertFn = Alert.alert.bind(Alert);

export const safeAlert: AlertFn = (title, message, buttons, options) => {
  const safeTitle = toStr(title, 'Xatolik');
  const safeMessage = message == null ? undefined : toStr(message, '');
  const safeButtons = sanitiseButtons(buttons);
  // Defer so a throw in AlertManager doesn't crash the current render.
  setTimeout(() => {
    try {
      originalAlert(safeTitle, safeMessage, safeButtons, options);
    } catch (err) {
      // Last-resort: console log instead of letting the exception escape.
      // eslint-disable-next-line no-console
      console.warn('[safeAlert] native alert threw', err, { safeTitle, safeMessage });
    }
  }, 0);
};

// Install globally so ALL `Alert.alert(...)` call sites across the codebase
// get the safe behaviour without having to edit each file.
// @ts-expect-error — overriding RN's exported function in place.
Alert.alert = safeAlert;
