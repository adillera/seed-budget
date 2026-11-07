import type { SQLiteDatabase } from 'expo-sqlite';

import { startingBudgetCategory, type OnboardingDraft } from '@/features/onboarding/draft';
import { toLocalISODate, today } from '@/lib/dates';
import { parseMoney } from '@/lib/money';

export const STARTING_BUDGET_NOTE = 'Starting budget';

/**
 * Writes the onboarding draft in one transaction: categories (in list order), the starting
 * budget as an income transaction (skipped when 0) and the bills. Parameterized queries only.
 *
 * Onboarding defines the starting state, so it first clears rows left by an earlier run (the
 * flag was reset but seed.db kept). Without that, re-inserting the default category names hits
 * their UNIQUE constraint and the save fails.
 */
export async function saveOnboarding(db: SQLiteDatabase, draft: OnboardingDraft) {
  const startingCents = parseMoney(draft.startingAmountText) ?? 0;
  const incomeCategory = startingBudgetCategory(draft);

  await db.withTransactionAsync(async () => {
    // Children first: bills and transactions reference categories.
    await db.runAsync('DELETE FROM bills');
    await db.runAsync('DELETE FROM transactions');
    await db.runAsync('DELETE FROM categories');

    const ids = new Map<string, number>();
    for (const [i, c] of draft.categories.entries()) {
      const result = await db.runAsync(
        'INSERT INTO categories (name, description, kind, sort_order) VALUES (?, ?, ?, ?)',
        c.name,
        c.description ?? null,
        c.kind,
        i,
      );
      ids.set(c.key, result.lastInsertRowId);
    }

    if (startingCents > 0 && incomeCategory) {
      await db.runAsync(
        'INSERT INTO transactions (category_id, amount_cents, date, note) VALUES (?, ?, ?, ?)',
        ids.get(incomeCategory.key)!,
        startingCents,
        toLocalISODate(today()),
        STARTING_BUDGET_NOTE,
      );
    }

    for (const b of draft.bills) {
      const categoryId = ids.get(b.categoryKey);
      if (categoryId === undefined) throw new Error(`Bill ${b.key} has no saved category`);
      await db.runAsync(
        'INSERT INTO bills (category_id, name, amount_cents, frequency, next_due_date) VALUES (?, ?, ?, ?, ?)',
        categoryId,
        b.name ?? null,
        b.amountCents,
        b.frequency,
        b.nextDueDate,
      );
    }
  });
}
