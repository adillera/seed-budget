import { useMemo, useSyncExternalStore } from 'react';

import { DEFAULT_CURRENCY, findCurrency, type Currency } from './currencies';
import { clearCurrencyCode, readCurrencyCode, writeCurrencyCode } from './currency-storage';
import { formatMoney, formatMoneyCompact, parseMoney } from './money';

/**
 * The app's currency: a device-local setting (currency-storage.ts / .web.ts). Read lazily so web
 * only touches localStorage on the client; an unknown stored code falls back to the default.
 * Components format money only through `useMoney()`, so a switch re-renders every amount.
 */
let current: Currency | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The current currency, for code outside React (db writes). */
export function getCurrency(): Currency {
  if (current === undefined) current = findCurrency(readCurrencyCode()) ?? DEFAULT_CURRENCY;
  return current;
}

// The server can't read storage; the root layout renders nothing there anyway (it waits for the
// onboarding flag), so the default is never shown.
const getServerSnapshot = () => DEFAULT_CURRENCY;

/** Saves the currency and re-renders every `useCurrency`/`useMoney` subscriber. */
export function setCurrencyCode(code: string) {
  const next = findCurrency(code);
  if (!next) return;
  writeCurrencyCode(next.code);
  current = next;
  listeners.forEach((listener) => listener());
}

/** Forgets the stored choice, back to the default (Settings → Start over). */
export function resetCurrency() {
  clearCurrencyCode();
  current = DEFAULT_CURRENCY;
  listeners.forEach((listener) => listener());
}

export function useCurrency(): Currency {
  return useSyncExternalStore(subscribe, getCurrency, getServerSnapshot);
}

/** Money helpers bound to the current currency. */
export function useMoney() {
  const currency = useCurrency();
  return useMemo(
    () => ({
      currency,
      format: (cents: number) => formatMoney(cents, currency),
      formatCompact: (cents: number) => formatMoneyCompact(cents, currency),
      parse: (text: string) => parseMoney(text, currency),
    }),
    [currency],
  );
}
