import type { HomeBill, HomeData } from '@/db/home';
import { occurrencesBetween } from '@/lib/recurrence';

/**
 * A bill's occurrences still to come this month, in cents: its due dates from `next_due_date`
 * (or the month start, if later) to the month end. Posted occurrences are transactions already,
 * and next_due_date is past them, so nothing counts twice.
 */
export function upcomingCents(
  bill: Pick<HomeBill, 'amount_cents' | 'frequency' | 'start_date' | 'next_due_date'>,
  monthStart: string,
  monthEnd: string,
) {
  const from = bill.next_due_date > monthStart ? bill.next_due_date : monthStart;
  return occurrencesBetween(bill.start_date, bill.frequency, from, monthEnd).length * bill.amount_cents;
}

/** 0 mound · 1 sprout · 2 seedling · 3 sapling · 4 tree. */
export type GrowthStage = 0 | 1 | 2 | 3 | 4;

/** Stage from the share of this month's income that's left (net ÷ gross). */
export function growthStage(netCents: number, grossIncomeCents: number): GrowthStage {
  if (netCents <= 0 || grossIncomeCents <= 0) return 0;
  const kept = netCents / grossIncomeCents;
  if (kept >= 0.5) return 4;
  if (kept >= 0.25) return 3;
  if (kept >= 0.1) return 2;
  return 1;
}

export type CategorySpend = {
  id: number;
  name: string;
  description: string | null;
  cents: number;
  /** 0..1 share of all expense this month; 0 when there's none. */
  share: number;
};

export type HomeSummary = {
  /** Income − expenses this month (transactions + bill occurrences still to come). Can be negative. */
  netCents: number;
  grossIncomeCents: number;
  /** Expense transactions this month so far (posted bills included). */
  spentCents: number;
  /** Expense bill occurrences this month: posted + still to come. */
  billsMonthlyCents: number;
  /** Expense categories in list order. */
  categories: CategorySpend[];
  stage: GrowthStage;
  /** Whole percent of income kept (0 when there's no income or nothing left). */
  keptPercent: number;
};

export function summarize(data: Omit<HomeData, 'recent'>, monthStart: string, monthEnd: string): HomeSummary {
  const perCategory = new Map<number, number>();
  const add = (id: number, cents: number) => perCategory.set(id, (perCategory.get(id) ?? 0) + cents);

  let incomeEntries = 0;
  let spentCents = 0;
  let postedBillsCents = 0;
  for (const e of data.entrySums) {
    add(e.category_id, e.cents);
    if (e.kind === 'income') incomeEntries += e.cents;
    else {
      spentCents += e.cents;
      postedBillsCents += e.billCents;
    }
  }

  let incomeUpcoming = 0;
  let expenseUpcoming = 0;
  for (const b of data.bills) {
    const cents = upcomingCents(b, monthStart, monthEnd);
    add(b.category_id, cents);
    if (b.kind === 'income') incomeUpcoming += cents;
    else expenseUpcoming += cents;
  }

  const grossIncomeCents = incomeEntries + incomeUpcoming;
  const expenseCents = spentCents + expenseUpcoming;
  const billsMonthlyCents = postedBillsCents + expenseUpcoming;
  const netCents = grossIncomeCents - expenseCents;

  const categories = data.categories
    .filter((c) => c.kind === 'expense')
    .map((c) => {
      const cents = perCategory.get(c.id) ?? 0;
      return { id: c.id, name: c.name, description: c.description, cents, share: expenseCents > 0 ? cents / expenseCents : 0 };
    });

  const keptPercent = netCents > 0 && grossIncomeCents > 0 ? Math.floor((netCents / grossIncomeCents) * 100) : 0;

  return {
    netCents,
    grossIncomeCents,
    spentCents,
    billsMonthlyCents,
    categories,
    stage: growthStage(netCents, grossIncomeCents),
    keptPercent,
  };
}
