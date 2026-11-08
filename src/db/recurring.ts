import type { SQLiteDatabase } from 'expo-sqlite';

import { nextOccurrenceAfter, occurrencesBetween } from '@/lib/recurrence';

import type { BillFrequency } from './schema';

type DueBill = {
  id: number;
  category_id: number;
  name: string | null;
  amount_cents: number;
  frequency: BillFrequency;
  start_date: string;
  next_due_date: string;
};

/**
 * Posts every bill occurrence due on or before `today` (local YYYY-MM-DD) as a transaction linked
 * by `bill_id`, then moves the bill's `next_due_date` past today. A `once` bill is deleted after
 * its one posting. Idempotent: posted dates are behind `next_due_date`, so a second run finds
 * nothing. Runs before Home and Entries load; returns how many entries it posted.
 */
export async function postDueBills(db: SQLiteDatabase, today: string) {
  let posted = 0;
  await db.withTransactionAsync(async () => {
    const due = await db.getAllAsync<DueBill>(
      `SELECT id, category_id, name, amount_cents, frequency, start_date, next_due_date
         FROM bills WHERE next_due_date <= ?`,
      today,
    );
    for (const bill of due) {
      for (const date of occurrencesBetween(bill.start_date, bill.frequency, bill.next_due_date, today)) {
        await db.runAsync(
          'INSERT INTO transactions (category_id, amount_cents, date, note, bill_id) VALUES (?, ?, ?, ?, ?)',
          bill.category_id,
          bill.amount_cents,
          date,
          bill.name,
          bill.id,
        );
        posted += 1;
      }
      const next = nextOccurrenceAfter(bill.start_date, bill.frequency, today);
      if (next === null) {
        // A one-time bill, now posted: it's an entry, no longer a bill.
        await db.runAsync('UPDATE transactions SET bill_id = NULL WHERE bill_id = ?', bill.id);
        await db.runAsync('DELETE FROM bills WHERE id = ?', bill.id);
      } else {
        await db.runAsync('UPDATE bills SET next_due_date = ? WHERE id = ?', next, bill.id);
      }
    }
  });
  return posted;
}
