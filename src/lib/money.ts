import type { Currency } from './currencies';

/**
 * Money is always integer hundredths of the chosen currency (switching currency relabels, never
 * converts). These are pure; components get them bound to the current currency from
 * `useMoney()` (src/lib/currency.ts). Output is ours, not Intl's currency style, so it's the same
 * on iOS, Android and web: sign + symbol + `1,234.50`.
 */

/** Largest amount accepted (999,999,999.99), well inside safe-integer range. */
const MAX_CENTS = 99_999_999_999;

const exact = {
  0: new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  2: new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
} as const;

const plain = {
  0: new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: false }),
  2: new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }),
} as const;

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** A symbol that is just the code ("KWD") gets a space before the number. */
function withSymbol(currency: Currency, number: string, negative: boolean) {
  const gap = currency.symbol === currency.code ? ' ' : '';
  return `${negative ? '-' : ''}${currency.symbol}${gap}${number}`;
}

/** "₱1,500.50", "¥1,501", "KWD 1,500.50" */
export function formatMoney(cents: number, currency: Currency) {
  // Round in the currency's own digits first so a tiny negative never shows as "-₱0.00".
  const value = Math.abs(cents) / 100;
  const text = exact[currency.digits].format(value);
  const negative = cents < 0 && /[1-9]/.test(text);
  return withSymbol(currency, text, negative);
}

/** "₱10K", "-₱2.5M": for tight spots like chart axes, never for the exact amount. */
export function formatMoneyCompact(cents: number, currency: Currency) {
  return withSymbol(currency, compact.format(Math.abs(cents) / 100), cents < 0);
}

/** "1500.50" (or "1501" for 0-decimal currencies): no symbol or grouping, for CSV export. */
export function formatAmountPlain(cents: number, currency: Currency) {
  const text = plain[currency.digits].format(Math.abs(cents) / 100);
  return cents < 0 ? `-${text}` : text;
}

/**
 * Parses what a person types into hundredths: "1500", "1,500.50", ".5" and "₱ 20" are fine.
 * Returns null for empty, negative, non-numeric, too many decimals (any for 0-decimal currencies,
 * more than 2 otherwise) or too large. No floating point: whole and fraction parts are separate.
 */
export function parseMoney(text: string, currency: Currency): number | null {
  const cleaned = text
    .replace(/[\s,]/g, '')
    .replace(currency.symbol, '')
    .replace(new RegExp(currency.code, 'i'), '');
  const match = /^(\d*)(?:\.(\d*))?$/.exec(cleaned);
  if (!match) return null;
  const [, whole, fraction = ''] = match;
  if (whole === '' && fraction === '') return null;
  if (fraction.length > currency.digits) return null;
  const cents = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
  return cents <= MAX_CENTS ? cents : null;
}
