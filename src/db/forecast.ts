import type { SQLiteDatabase } from 'expo-sqlite';

import type { HomeBill } from './home';
import { STARTING_BUDGET_NOTE } from './onboarding';

/** Income and expense transactions on one local date, starting budget left out. */
export type ForecastDaySum = { date: string; incomeCents: number; expenseCents: number };

export type ForecastData = {
  /** Earliest transaction date (the starting budget included), or null with no transactions. */
  firstDate: string | null;
  /** The onboarding starting budget row, if it still exists. */
  starting: { cents: number; date: string } | null;
  dailySums: ForecastDaySum[];
  /** Every bill; after postDueBills, `next_due_date` is the first occurrence still to come. */
  bills: HomeBill[];
};

/** Raw rows for the Forecast tab. Totals: features/forecast/forecast.ts. Call postDueBills first. */
export async function loadForecastData(db: SQLiteDatabase): Promise<ForecastData> {
  const [first, starting, dailySums, bills] = await Promise.all([
    db.getFirstAsync<{ date: string | null }>('SELECT MIN(date) AS date FROM transactions'),
    db.getFirstAsync<{ cents: number; date: string }>(
      'SELECT amount_cents AS cents, date FROM transactions WHERE note = ? ORDER BY date, id LIMIT 1',
      STARTING_BUDGET_NOTE,
    ),
    db.getAllAsync<ForecastDaySum>(
      `SELECT t.date,
              SUM(CASE WHEN c.kind = 'income' THEN t.amount_cents ELSE 0 END) AS incomeCents,
              SUM(CASE WHEN c.kind = 'expense' THEN t.amount_cents ELSE 0 END) AS expenseCents
         FROM transactions t JOIN categories c ON c.id = t.category_id
        WHERE t.note IS NOT ?
        GROUP BY t.date`,
      STARTING_BUDGET_NOTE,
    ),
    db.getAllAsync<HomeBill>(
      `SELECT b.category_id, c.kind, b.amount_cents, b.frequency, b.start_date, b.next_due_date
         FROM bills b JOIN categories c ON c.id = b.category_id`,
    ),
  ]);
  return { firstDate: first?.date ?? null, starting: starting ?? null, dailySums, bills };
}
