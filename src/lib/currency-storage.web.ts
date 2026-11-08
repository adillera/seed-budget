/** Web twin of currency-storage.ts, on localStorage (blocked storage → default currency). */
const KEY = 'currency';

export function readCurrencyCode(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeCurrencyCode(code: string) {
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    // Storage blocked (private mode): the choice still applies for this session.
  }
}

export function clearCurrencyCode() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: nothing stored to clear.
  }
}
