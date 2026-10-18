import { router } from 'expo-router';

/**
 * Safe wrapper around router.back() that falls back to a sensible home
 * when the navigation stack is empty.
 *
 * Expo Router raises "The action 'GO_BACK' was not handled by any
 * navigator" when a screen is the first entry in its stack — for example
 * when the user lands on /face via a deep link or router.replace() instead
 * of router.push(). Instead of crashing the UI with an in-app toast, we
 * route the user to a reasonable default (/) so the back button always
 * does something useful.
 */
export function safeBack(fallback: string = '/') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
