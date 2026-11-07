import { createContext, use, useReducer, type ReactNode } from 'react';

import type { BillFrequency, CategoryKind } from '@/db/schema';

/**
 * Onboarding draft: everything the setup steps collect, kept in memory until "Plant the seeds"
 * saves it (src/db/onboarding.ts). Killing the app mid-flow starts over with the defaults.
 */

export type DraftCategory = { key: string; name: string; description?: string; kind: CategoryKind };

export type DraftBill = {
  key: string;
  categoryKey: string;
  name?: string;
  amountCents: number;
  frequency: BillFrequency;
  /** Local date, YYYY-MM-DD. */
  nextDueDate: string;
};

export type OnboardingDraft = {
  categories: DraftCategory[];
  /** What the person typed in the starting budget field (parsed on save; empty = 0). */
  startingAmountText: string;
  bills: DraftBill[];
};

export const NAME_MAX = 30;
export const DESCRIPTION_MAX = 60;
export const BILL_NAME_MAX = 40;

/** Kakeibo's four expense categories, plus Income. */
const DEFAULT_CATEGORIES: readonly Omit<DraftCategory, 'key'>[] = [
  { name: 'Income', description: 'Salary, side work, allowances', kind: 'income' },
  { name: 'Needs', description: 'Rent, food, bills, transport', kind: 'expense' },
  { name: 'Wants', description: 'Eating out, shopping, hobbies', kind: 'expense' },
  { name: 'Culture', description: 'Books, courses, music, museums', kind: 'expense' },
  { name: 'Unexpected', description: 'Repairs, medical, gifts', kind: 'expense' },
];

// Keys from a counter (not Math.random) so they're stable and deterministic.
let nextKey = 0;
const newKey = (prefix: string) => `${prefix}-${++nextKey}`;

function initialDraft(): OnboardingDraft {
  return {
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, key: newKey('cat') })),
    startingAmountText: '',
    bills: [],
  };
}

type Action =
  | { type: 'addCategory'; category: Omit<DraftCategory, 'key'> }
  | { type: 'removeCategory'; key: string }
  | { type: 'setStartingAmount'; text: string }
  | { type: 'addBill'; bill: Omit<DraftBill, 'key'> }
  | { type: 'removeBill'; key: string };

function reducer(draft: OnboardingDraft, action: Action): OnboardingDraft {
  switch (action.type) {
    case 'addCategory':
      return { ...draft, categories: [...draft.categories, { ...action.category, key: newKey('cat') }] };
    case 'removeCategory':
      return {
        ...draft,
        categories: draft.categories.filter((c) => c.key !== action.key),
        // A category's bills go with it (the Fields step confirms first).
        bills: draft.bills.filter((b) => b.categoryKey !== action.key),
      };
    case 'setStartingAmount':
      return { ...draft, startingAmountText: action.text };
    case 'addBill':
      return { ...draft, bills: [...draft.bills, { ...action.bill, key: newKey('bill') }] };
    case 'removeBill':
      return { ...draft, bills: draft.bills.filter((b) => b.key !== action.key) };
  }
}

/** True when a category with this name (trimmed, ignoring case) already exists. */
export function hasCategoryNamed(draft: OnboardingDraft, name: string) {
  const n = name.trim().toLowerCase();
  return draft.categories.some((c) => c.name.toLowerCase() === n);
}

/** The starting budget is filed under the first income category. */
export function startingBudgetCategory(draft: OnboardingDraft) {
  return draft.categories.find((c) => c.kind === 'income');
}

/** Setup needs at least one income and one expense category. */
export function hasRequiredKinds(draft: OnboardingDraft) {
  return (
    draft.categories.some((c) => c.kind === 'income') &&
    draft.categories.some((c) => c.kind === 'expense')
  );
}

type DraftContext = { draft: OnboardingDraft; dispatch: (action: Action) => void };

const Context = createContext<DraftContext | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, undefined, initialDraft);
  return <Context value={{ draft, dispatch }}>{children}</Context>;
}

export function useOnboardingDraft() {
  const ctx = use(Context);
  if (!ctx) throw new Error('useOnboardingDraft must be used inside OnboardingDraftProvider');
  return ctx;
}
