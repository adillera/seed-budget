import type { SQLiteDatabase } from 'expo-sqlite';

import { BILL_FREQUENCIES } from './schema';

/** Name of the app database, opened once by SQLiteProvider in the root layout. */
export const DATABASE_NAME = 'seed.db';

const DATABASE_VERSION = 3;

/**
 * Migrates seed.db with `PRAGMA user_version`. Never edit a released step: add a new
 * `if (version === N)` block and bump DATABASE_VERSION.
 */
export async function migrate(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        description TEXT,
        kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
        sort_order INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE bills (
        id INTEGER PRIMARY KEY NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        name TEXT,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
        next_due_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        amount_cents INTEGER NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    version = 1;
  }

  if (version === 1) {
    // v2: more bill frequencies (one-time, daily, twice a month, every 2 months, quarterly,
    // twice a year). SQLite can't alter a CHECK, so rebuild the table and copy the rows.
    // The list is a constant, not user input, so inlining it is safe.
    const frequencies = BILL_FREQUENCIES.map((f) => `'${f}'`).join(', ');
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE bills_v2 (
          id INTEGER PRIMARY KEY NOT NULL,
          category_id INTEGER NOT NULL REFERENCES categories(id),
          name TEXT,
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          frequency TEXT NOT NULL CHECK (frequency IN (${frequencies})),
          next_due_date TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO bills_v2 (id, category_id, name, amount_cents, frequency, next_due_date, created_at)
          SELECT id, category_id, name, amount_cents, frequency, next_due_date, created_at FROM bills;
        DROP TABLE bills;
        ALTER TABLE bills_v2 RENAME TO bills;
      `);
    });
    version = 2;
  }

  if (version === 2) {
    // v3: recurring bills post real entries (plan 08). transactions.bill_id links a posted
    // occurrence to its bill (NULL for one-off entries; detached by code, foreign keys aren't
    // enforced). bills.start_date is the anchor every occurrence is computed from;
    // next_due_date becomes the first occurrence not yet posted.
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        ALTER TABLE transactions ADD COLUMN bill_id INTEGER REFERENCES bills(id);
        ALTER TABLE bills ADD COLUMN start_date TEXT NOT NULL DEFAULT '';
        UPDATE bills SET start_date = next_due_date;
      `);
    });
    version = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
