import type { SQLiteDatabase } from 'expo-sqlite';

/** Name of the app database, opened once by SQLiteProvider in the root layout. */
export const DATABASE_NAME = 'seed.db';

const DATABASE_VERSION = 1;

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

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
