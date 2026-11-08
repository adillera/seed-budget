import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Deletes every row the app keeps (starting budget, bills, categories, entries) in one
 * transaction, children first: transactions reference bills, and both reference categories.
 * The schema and its migration version stay. Settings → Start over (plan 13).
 */
export async function resetAllData(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM transactions');
    await db.runAsync('DELETE FROM bills');
    await db.runAsync('DELETE FROM categories');
  });
}
