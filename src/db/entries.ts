import type { SQLiteDatabase } from 'expo-sqlite';

import { STARTING_BUDGET_NOTE } from './onboarding';
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
 * Saves the entry form. One-time → a transaction on `date`. Anything else → a bill starting on
 * `date` (its start and next due date) named after the note. postDueBills posts its occurrences.
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
    'INSERT INTO bills (category_id, name, amount_cents, frequency, start_date, next_due_date) VALUES (?, ?, ?, ?, ?, ?)',
    entry.categoryId,
    entry.note,
    entry.amountCents,
    entry.repeat,
    entry.date,
    entry.date,
  );
}

/** Row key shared by Entries, Home and the edit route: `e-<id>` transaction, `b-<id>` bill. */
export type EntryKey = { type: 'entry' | 'bill'; id: number };

export const entryKey = (type: EntryKey['type'], id: number) => `${type === 'entry' ? 'e' : 'b'}-${id}`;

/** `e-12` → { type: 'entry', id: 12 }; anything else → null. */
export function parseEntryKey(key: string): EntryKey | null {
  const match = /^([eb])-([1-9]\d*)$/.exec(key);
  if (!match) return null;
  return { type: match[1] === 'e' ? 'entry' : 'bill', id: Number(match[2]) };
}

export type ListedEntry = {
  key: string;
  id: number;
  amount_cents: number;
  /** Local YYYY-MM-DD. */
  date: string;
  note: string | null;
  category_name: string;
  kind: CategoryKind;
  /** Posted from a bill (SQLite returns 0/1). */
  recurring: number;
};

export type ListedBill = {
  key: string;
  id: number;
  amount_cents: number;
  name: string | null;
  frequency: BillFrequency;
  /** Local YYYY-MM-DD. */
  next_due_date: string;
  category_name: string;
  kind: CategoryKind;
};

/** Everything for the Entries tab: transactions newest first, bills by next due date. */
export async function loadEntryList(db: SQLiteDatabase) {
  const [entries, bills] = await Promise.all([
    db.getAllAsync<Omit<ListedEntry, 'key'>>(
      `SELECT t.id, t.amount_cents, t.date, t.note, t.bill_id IS NOT NULL AS recurring,
              c.name AS category_name, c.kind
         FROM transactions t JOIN categories c ON c.id = t.category_id
        ORDER BY t.date DESC, t.id DESC`,
    ),
    db.getAllAsync<Omit<ListedBill, 'key'>>(
      `SELECT b.id, b.amount_cents, b.name, b.frequency, b.next_due_date, c.name AS category_name, c.kind
         FROM bills b JOIN categories c ON c.id = b.category_id
        ORDER BY b.next_due_date, b.id`,
    ),
  ]);
  return {
    entries: entries.map((e): ListedEntry => ({ ...e, key: entryKey('entry', e.id) })),
    bills: bills.map((b): ListedBill => ({ ...b, key: entryKey('bill', b.id) })),
  };
}

/** One row, in the entry form's shape. A `once` bill reads as One-time on its due date. */
export type EditableEntry = NewEntry & {
  key: string;
  kind: CategoryKind;
  /** The onboarding starting budget (its note must stay as is). */
  isStartingBudget: boolean;
};

export async function loadEntryByKey(db: SQLiteDatabase, key: string): Promise<EditableEntry | null> {
  const parsed = parseEntryKey(key);
  if (!parsed) return null;
  if (parsed.type === 'entry') {
    const row = await db.getFirstAsync<{ category_id: number; kind: CategoryKind; amount_cents: number; note: string | null; date: string }>(
      `SELECT t.category_id, c.kind, t.amount_cents, t.note, t.date
         FROM transactions t JOIN categories c ON c.id = t.category_id
        WHERE t.id = ?`,
      parsed.id,
    );
    if (!row) return null;
    return {
      key,
      kind: row.kind,
      categoryId: row.category_id,
      amountCents: row.amount_cents,
      note: row.note,
      repeat: 'once',
      date: row.date,
      isStartingBudget: row.note === STARTING_BUDGET_NOTE,
    };
  }
  const row = await db.getFirstAsync<{
    category_id: number;
    kind: CategoryKind;
    amount_cents: number;
    name: string | null;
    frequency: BillFrequency;
    next_due_date: string;
  }>(
    `SELECT b.category_id, c.kind, b.amount_cents, b.name, b.frequency, b.next_due_date
       FROM bills b JOIN categories c ON c.id = b.category_id
      WHERE b.id = ?`,
    parsed.id,
  );
  if (!row) return null;
  return {
    key,
    kind: row.kind,
    categoryId: row.category_id,
    amountCents: row.amount_cents,
    note: row.name,
    repeat: row.frequency,
    date: row.next_due_date,
    isStartingBudget: false,
  };
}

/**
 * Saves an edit. Same table → UPDATE. One-time ↔ recurring moves the row (delete + insert in
 * one transaction), so the row gets a new id. A `once` bill saved as One-time becomes an entry.
 */
export async function updateEntry(db: SQLiteDatabase, key: string, entry: NewEntry) {
  const parsed = parseEntryKey(key);
  if (!parsed) throw new Error(`Bad entry key ${key}`);
  const target = entry.repeat === 'once' ? 'entry' : 'bill';

  if (parsed.type !== target) {
    await db.withTransactionAsync(async () => {
      await deleteRow(db, parsed);
      await addEntry(db, entry);
    });
    return;
  }
  if (target === 'entry') {
    await db.runAsync(
      'UPDATE transactions SET category_id = ?, amount_cents = ?, date = ?, note = ? WHERE id = ?',
      entry.categoryId,
      entry.amountCents,
      entry.date,
      entry.note,
      parsed.id,
    );
    return;
  }
  await db.runAsync(
    'UPDATE bills SET category_id = ?, name = ?, amount_cents = ?, frequency = ?, start_date = ?, next_due_date = ? WHERE id = ?',
    entry.categoryId,
    entry.note,
    entry.amountCents,
    entry.repeat,
    entry.date,
    entry.date,
    parsed.id,
  );
}

/** Deletes one entry or bill. A bill's posted occurrences stay, as plain entries. */
export async function deleteEntry(db: SQLiteDatabase, key: string) {
  const parsed = parseEntryKey(key);
  if (!parsed) throw new Error(`Bad entry key ${key}`);
  await db.withTransactionAsync(() => deleteRow(db, parsed));
}

/** The delete itself, without a transaction (callers wrap it; expo-sqlite can't nest them). */
async function deleteRow(db: SQLiteDatabase, { type, id }: EntryKey) {
  if (type === 'entry') {
    await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
    return;
  }
  // Detach first: foreign keys aren't enforced, and the history should outlive the bill.
  await db.runAsync('UPDATE transactions SET bill_id = NULL WHERE bill_id = ?', id);
  await db.runAsync('DELETE FROM bills WHERE id = ?', id);
}
