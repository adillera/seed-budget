import type { HomeBill, HomeData } from '@/db/home';
import type { BillFrequency } from '@/db/schema';

/** How many times a bill repeats per month. `once` is handled by its due date instead. */
const PER_MONTH: Record<Exclude<BillFrequency, 'once'>, number> = {
  daily: 365 / 12,
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
  bimonthly: 1 / 2,
  quarterly: 1 / 3,
  semiannually: 1 / 6,
  yearly: 1 / 12,
};

/**
 * A bill's monthly equivalent in whole cents. A one-time bill counts in full only in the month
 * it's due (YYYY-MM-DD strings compare correctly as text).
 */
export function monthlyCents(
  bill: Pick<HomeBill, 'amount_cents' | 'frequency' | 'next_due_date'>,
  monthStart: string,
  monthEnd: string,
) {
  if (bill.frequency === 'once') {
    return bill.next_due_date >= monthStart && bill.next_due_date <= monthEnd ? bill.amount_cents : 0;
  }
  return Math.round(bill.amount_cents * PER_MONTH[bill.frequency]);
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
  /** Income − expenses this month (entries + bills per month). Can be negative. */
  netCents: number;
  grossIncomeCents: number;
  /** Expense entries this month. */
  spentCents: number;
  /** Expense bills per month. */
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
  for (const e of data.entrySums) {
    add(e.category_id, e.cents);
    if (e.kind === 'income') incomeEntries += e.cents;
    else spentCents += e.cents;
  }

  let incomeBills = 0;
  let billsMonthlyCents = 0;
  for (const b of data.bills) {
    const cents = monthlyCents(b, monthStart, monthEnd);
    add(b.category_id, cents);
    if (b.kind === 'income') incomeBills += cents;
    else billsMonthlyCents += cents;
  }

  const grossIncomeCents = incomeEntries + incomeBills;
  const expenseCents = spentCents + billsMonthlyCents;
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
