import type { ExportData } from '@/db/export';
import type { Currency } from '@/lib/currencies';
import { frequencyLabel } from '@/lib/frequency';
import { formatAmountPlain } from '@/lib/money';

/** One header row, one row per record; `record` says which kind of row it is. */
export const CSV_COLUMNS = [
  'record',
  'date',
  'category',
  'kind',
  'amount',
  'currency',
  'repeats',
  'start_date',
  'next_due_date',
  'note',
  'description',
] as const;

type Column = (typeof CSV_COLUMNS)[number];
type Row = Partial<Record<Column, string | null>>;

/** RFC 4180: quote a field holding a comma, quote or line break, doubling inner quotes. */
export function csvField(value: string | null | undefined) {
  const text = value ?? '';
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The whole export as CSV text: categories, starting budget, bills, entries. Amounts are plain
 * decimals in the currency's digits (no symbol). CRLF line ends and a UTF-8 BOM so spreadsheet
 * apps (Excel) read non-ASCII names and notes correctly.
 */
export function buildCsv(data: ExportData, currency: Currency) {
  const amount = (cents: number) => ({ amount: formatAmountPlain(cents, currency), currency: currency.code });

  const rows: Row[] = [
    ...data.categories.map((c) => ({ record: 'category', category: c.name, kind: c.kind, description: c.description })),
    ...data.starting.map((t) => ({
      record: 'starting_budget',
      date: t.date,
      category: t.category,
      kind: t.kind,
      ...amount(t.amount_cents),
    })),
    ...data.bills.map((b) => ({
      record: 'bill',
      category: b.category,
      kind: b.kind,
      ...amount(b.amount_cents),
      repeats: frequencyLabel(b.frequency),
      start_date: b.start_date,
      next_due_date: b.next_due_date,
      note: b.name,
    })),
    ...data.entries.map((t) => ({
      record: 'entry',
      date: t.date,
      category: t.category,
      kind: t.kind,
      ...amount(t.amount_cents),
      note: t.note,
    })),
  ];

  const lines = [
    CSV_COLUMNS.join(','),
    ...rows.map((row) => CSV_COLUMNS.map((column) => csvField(row[column])).join(',')),
  ];
  return `﻿${lines.join('\r\n')}\r\n`;
}
