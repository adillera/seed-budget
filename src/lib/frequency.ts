import type { BillFrequency } from '@/db/schema';

/** Picker options for bill frequencies, in picker order (labels shown to people). */
export const FREQUENCY_OPTIONS: readonly { label: string; value: BillFrequency }[] = [
  { label: 'One-time', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Every 2 weeks', value: 'biweekly' },
  { label: 'Twice a month', value: 'semimonthly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Every 2 months', value: 'bimonthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Twice a year', value: 'semiannually' },
  { label: 'Yearly', value: 'yearly' },
];

/** "Every 2 weeks" for `biweekly`. */
export const frequencyLabel = (f: BillFrequency) =>
  FREQUENCY_OPTIONS.find((o) => o.value === f)?.label ?? f;
