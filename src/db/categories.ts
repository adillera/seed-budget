import type { SQLiteDatabase } from 'expo-sqlite';

import { STARTING_BUDGET_NOTE } from './onboarding';
import type { CategoryKind } from './schema';

/** A category on the Categories tab, with what's logged under it. */
export type ListedCategory = {
  id: number;
  name: string;
  description: string | null;
  kind: CategoryKind;
  entryCount: number;
  billCount: number;
  hasStartingBudget: boolean;
};

export type CategoryInput = { name: string; description: string | null; kind: CategoryKind };

/** The name is taken (names are unique ignoring case). */
export class DuplicateCategoryNameError extends Error {
  constructor(readonly takenName: string) {
    super(`A category called "${takenName}" already exists`);
    this.name = 'DuplicateCategoryNameError';
  }
}

/** A used category's kind can't change: it would flip every entry under it. */
export class CategoryKindLockedError extends Error {
  constructor() {
    super('A category with entries or bills keeps its kind');
    this.name = 'CategoryKindLockedError';
  }
}

/** Every category in list order, with its transaction and bill counts. */
export async function loadCategoryList(db: SQLiteDatabase): Promise<ListedCategory[]> {
  const rows = await db.getAllAsync<Omit<ListedCategory, 'hasStartingBudget'> & { hasStartingBudget: number }>(
    `SELECT c.id, c.name, c.description, c.kind,
       (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) AS entryCount,
       (SELECT COUNT(*) FROM bills b WHERE b.category_id = c.id) AS billCount,
       EXISTS (SELECT 1 FROM transactions t WHERE t.category_id = c.id AND t.note = ?) AS hasStartingBudget
     FROM categories c
     ORDER BY c.sort_order, c.id`,
    STARTING_BUDGET_NOTE,
  );
  return rows.map((r) => ({ ...r, hasStartingBudget: r.hasStartingBudget === 1 }));
}

// The name column is COLLATE NOCASE, so `=` ignores case here.
async function assertNameFree(db: SQLiteDatabase, name: string, exceptId: number | null) {
  const taken = await db.getFirstAsync<{ name: string }>(
    'SELECT name FROM categories WHERE name = ? AND id IS NOT ?',
    name,
    exceptId,
  );
  if (taken) throw new DuplicateCategoryNameError(taken.name);
}

/** Adds a category at the end of the list. */
export async function addCategory(db: SQLiteDatabase, input: CategoryInput) {
  await assertNameFree(db, input.name, null);
  await db.runAsync(
    `INSERT INTO categories (name, description, kind, sort_order)
     VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories))`,
    input.name,
    input.description,
    input.kind,
  );
}

/** Renames a category, changes its description, and its kind while nothing is logged under it. */
export async function updateCategory(db: SQLiteDatabase, id: number, input: CategoryInput) {
  await assertNameFree(db, input.name, id);
  await db.withTransactionAsync(async () => {
    const current = await db.getFirstAsync<{ kind: CategoryKind; used: number }>(
      `SELECT kind,
         EXISTS (SELECT 1 FROM transactions WHERE category_id = ?)
           OR EXISTS (SELECT 1 FROM bills WHERE category_id = ?) AS used
       FROM categories WHERE id = ?`,
      id,
      id,
      id,
    );
    if (!current) throw new Error(`Category ${id} not found`);
    if (current.kind !== input.kind && current.used === 1) throw new CategoryKindLockedError();
    await db.runAsync(
      'UPDATE categories SET name = ?, description = ?, kind = ? WHERE id = ?',
      input.name,
      input.description,
      input.kind,
      id,
    );
  });
}

/**
 * Deletes a category with every transaction and bill under it, in one transaction. A bill's
 * posted entries share its category, so deleting by category_id covers them.
 */
export async function deleteCategory(db: SQLiteDatabase, id: number) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM transactions WHERE category_id = ?', id);
    await db.runAsync('DELETE FROM bills WHERE category_id = ?', id);
    await db.runAsync('DELETE FROM categories WHERE id = ?', id);
  });
}
