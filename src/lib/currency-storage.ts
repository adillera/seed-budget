import Storage from 'expo-sqlite/kv-store';

/** Device-local currency code (native: expo-sqlite kv-store, sync). Web twin: currency-storage.web.ts. */
const KEY = 'currency';

export function readCurrencyCode(): string | null {
  return Storage.getItemSync(KEY);
}

export function writeCurrencyCode(code: string) {
  Storage.setItemSync(KEY, code);
}

export function clearCurrencyCode() {
  Storage.removeItemSync(KEY);
}
