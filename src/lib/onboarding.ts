import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

/**
 * Whether this device has finished onboarding (native: expo-sqlite kv-store, read synchronously
 * so the first render already knows). The web twin is `onboarding.web.ts`.
 */
const KEY = 'onboarded';

let onboarded = Storage.getItemSync(KEY) === '1';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): boolean | null => onboarded;

/** `true` once onboarding is complete. Never `null` on native (web returns `null` while unknown). */
export function useOnboarded() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Saves completion and notifies subscribers; the root layout's route guard then leaves onboarding. */
export function completeOnboarding() {
  Storage.setItemSync(KEY, '1');
  onboarded = true;
  listeners.forEach((listener) => listener());
}

/** Clears completion (Settings → Start over); the tabs layout then redirects to onboarding. */
export function resetOnboarding() {
  Storage.removeItemSync(KEY);
  onboarded = false;
  listeners.forEach((listener) => listener());
}
