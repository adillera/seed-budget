import { useSyncExternalStore } from 'react';

/**
 * Web twin of `onboarding.ts`, on localStorage (expo-sqlite's kv-store needs wasm + COOP/COEP
 * headers on web). The server can't read localStorage, so the server snapshot is `null` (unknown)
 * and the root layout renders nothing until the client knows.
 */
const KEY = 'onboarded';

let onboarded: boolean | undefined;
const listeners = new Set<() => void>();

function read() {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean | null {
  if (onboarded === undefined) onboarded = read();
  return onboarded;
}

const getServerSnapshot = (): boolean | null => null;

/** `true` once onboarding is complete; `null` on the server and during hydration. */
export function useOnboarded() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Saves completion and notifies subscribers; the root layout's route guard then leaves onboarding. */
export function completeOnboarding() {
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    // Storage blocked (private mode): onboarding still completes for this session.
  }
  onboarded = true;
  listeners.forEach((listener) => listener());
}

/** Clears completion (Settings → Start over); the tabs layout then redirects to onboarding. */
export function resetOnboarding() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: onboarding still restarts for this session.
  }
  onboarded = false;
  listeners.forEach((listener) => listener());
}
