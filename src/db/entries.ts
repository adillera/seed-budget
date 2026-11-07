import type { SQLiteDatabase } from 'expo-sqlite';

import type { BillFrequency, CategoryKind } from './schema';

export type EntryCategory = { id: number; name: string; kind: CategoryKind };

/** Every category in list order, for the entry form's picker. */
export function loadEntryCategories(db: SQLiteDatabase) {
  return db.getAllAsync<EntryCategory>('SELECT id, name, kind FROM categories ORDER BY sort_order, id');
}

/** Recurring choices only: a one-time entry is a transaction, not a `once` bill. */
export type EntryRepeat = 'once' | Exclude<BillFrequency, 'once'>;

export type NewEntry = {
  categoryId: number;
  /** Positive integer cents. */
  amountCents: number;
  /** Trimmed; null when blank. */
  note: string | null;
  repeat: EntryRepeat;
  /** Local YYYY-MM-DD: the entry's date, or a bill's next due date. */
  date: string;
};

/**
 * Saves the entry form. One-time → a transaction on `date`. Anything else → a bill whose next
 * due date is `date` and whose name is the note (no transaction, so Home doesn't count it twice).
 */
export async function addEntry(db: SQLiteDatabase, entry: NewEntry) {
  if (entry.repeat === 'once') {
    await db.runAsync(
      'INSERT INTO transactions (category_id, amount_cents, date, note) VALUES (?, ?, ?, ?)',
      entry.categoryId,
      entry.amountCents,
      entry.date,
      entry.note,
    );
    return;
  }
  await db.runAsync(
    'INSERT INTO bills (category_id, name, amount_cents, frequency, next_due_date) VALUES (?, ?, ?, ?, ?)',
    entry.categoryId,
    entry.note,
    entry.amountCents,
    entry.repeat,
    entry.date,
  );
}
