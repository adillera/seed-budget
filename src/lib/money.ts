/** Money is always integer cents. One currency for now; a setting can replace this constant later. */
/** `name` is the singular word for copy ("Every peso in and out"). */
export const CURRENCY = { code: 'PHP', symbol: '₱', locale: 'en-PH', name: 'peso' } as const;

/** Largest amount accepted (₱999,999,999.99), well inside safe-integer range. */
const MAX_CENTS = 99_999_999_999;

const formatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "₱1,500.50" */
export function formatMoney(cents: number) {
  return formatter.format(cents / 100);
}

/**
 * Parses what a person types into cents: "1500", "1,500.50", ".5" and "₱ 20" are fine.
 * Returns null for empty, negative, non-numeric, more than 2 decimals or too large.
 * No floating point: whole and fraction parts are parsed separately.
 */
export function parseMoney(text: string): number | null {
  const cleaned = text.replace(/[\s,]/g, '').replace(CURRENCY.symbol, '');
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match) return null;
  const [, whole, fraction = ''] = match;
  if (whole === '' && fraction === '') return null;
  const cents = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
  return cents <= MAX_CENTS ? cents : null;
}
