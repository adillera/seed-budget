import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, DateField, SelectField, Text, TextField } from '@/components/ui';
import { saveOnboarding } from '@/db/onboarding';
import type { BillFrequency } from '@/db/schema';
import { BILL_NAME_MAX, startingBudgetCategory, useOnboardingDraft } from '@/features/onboarding/draft';
import { ItemRow } from '@/features/onboarding/item-row';
import { SetupScreen } from '@/features/onboarding/setup-screen';
import { formatShortDate, toLocalISODate, today } from '@/lib/dates';
import { FREQUENCY_OPTIONS, frequencyLabel } from '@/lib/frequency';
import { CURRENCY, formatMoney, parseMoney } from '@/lib/money';
import { completeOnboarding } from '@/lib/onboarding';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Onboarding step 2: the starting budget and recurring bills. "Plant the seeds" saves everything. */
export default function Plough() {
  const db = useSQLiteContext();
  const { draft, dispatch } = useOnboardingDraft();

  const income = startingBudgetCategory(draft);
  // Every category from the Fields step, with its type, so a recurring entry can go anywhere.
  const categoryOptions = draft.categories.map((c) => ({
    label: `${c.name} · ${c.kind === 'income' ? 'Income' : 'Expense'}`,
    value: c.key,
  }));
  // Most bills are expenses: default to the first expense category.
  const defaultCategory =
    draft.categories.find((c) => c.kind === 'expense')?.key ?? draft.categories[0]?.key;
  const categoryName = (key: string) => draft.categories.find((c) => c.key === key)?.name ?? '';

  // Bill form. Category and frequency stay between bills; the rest resets after each add.
  const [chosenCategory, setChosenCategory] = useState(defaultCategory);
  const [billName, setBillName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [dueDate, setDueDate] = useState(today);

  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  // The chosen category may have been removed on the Fields step: fall back to the default.
  const categoryKey = categoryOptions.some((o) => o.value === chosenCategory)
    ? chosenCategory
    : defaultCategory;

  const startingInvalid =
    draft.startingAmountText.trim() !== '' && parseMoney(draft.startingAmountText) === null;
  const billCents = parseMoney(amountText);
  const billAmountInvalid = amountText.trim() !== '' && (billCents === null || billCents === 0);
  const canAddBill = categoryKey !== undefined && billCents !== null && billCents > 0;

  const addBill = () => {
    if (!canAddBill) return;
    dispatch({
      type: 'addBill',
      bill: {
        categoryKey,
        name: billName.trim() || undefined,
        amountCents: billCents,
        frequency,
        nextDueDate: toLocalISODate(dueDate),
      },
    });
    setBillName('');
    setAmountText('');
    setDueDate(today());
  };

  const plant = async () => {
    if (startingInvalid || saving) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await saveOnboarding(db, draft);
      // Flips the root route guard: the router leaves onboarding for index.
      completeOnboarding();
    } catch (error) {
      console.warn('saveOnboarding failed', error);
      setSaveFailed(true);
      setSaving(false);
    }
  };

  return (
    <SetupScreen
      title="Plough the field."
      body="Start with what you have, then add the bills that keep coming back."
      cta={
        <View className="gap-2">
          {saveFailed && (
            <View className="bg-white rounded-card p-3">
              <Text variant="small" color="red">
                Couldn’t save your budget. Try again.
              </Text>
            </View>
          )}
          <Button
            variant="inverse"
            fullWidth
            loading={saving}
            disabled={startingInvalid}
            onPress={plant}>
            Plant the seeds
          </Button>
        </View>
      }>
      <Card tight>
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="h1" accessibilityRole="header">
            Starting budget
          </Text>
          {income && <Badge>{income.name}</Badge>}
        </View>
        <TextField
          labelPosition="above"
          label="Amount"
          prefix={CURRENCY.symbol}
          inputSize="lg"
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={draft.startingAmountText}
          onChangeText={(text) => dispatch({ type: 'setStartingAmount', text })}
          state={startingInvalid ? 'invalid' : undefined}
          message={
            startingInvalid
              ? 'Enter an amount like 1500 or 1500.50.'
              : `The money you have to plant right now. We’ll file it under ${income?.name ?? 'Income'}.`
          }
        />
      </Card>

      <Card tight>
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="h1" accessibilityRole="header">
            Recurring bills
          </Text>
          <Text variant="small" color="textBlackSoft">
            {plural(draft.bills.length, 'bill', 'bills')}
          </Text>
        </View>

        {draft.bills.length === 0 ? (
          <View className="bg-neutral-warm rounded-card p-3">
            <Text color="textBlackSoft">
              No bills yet. Add rent, electricity, water or anything else that repeats.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {draft.bills.map((b) => {
              const title = b.name ?? categoryName(b.categoryKey);
              return (
                <ItemRow
                  key={b.key}
                  title={title}
                  detail={`${formatMoney(b.amountCents)} · ${frequencyLabel(b.frequency)} · ${b.frequency === 'once' ? 'Due' : 'Next'} ${formatShortDate(b.nextDueDate)}`}
                  onRemove={() => dispatch({ type: 'removeBill', key: b.key })}
                  removeLabel={`Remove ${title}`}
                />
              );
            })}
          </View>
        )}

        <View className="gap-3 pt-2">
          <SelectField
            labelPosition="above"
            label="Category"
            options={categoryOptions}
            value={categoryKey}
            onChange={setChosenCategory}
          />
          <TextField
            labelPosition="above"
            label="Bill name"
            optionalHint="(optional)"
            placeholder="e.g. Electricity, rent, water"
            value={billName}
            onChangeText={setBillName}
            maxLength={BILL_NAME_MAX}
          />
          <TextField
            labelPosition="above"
            label="Amount"
            prefix={CURRENCY.symbol}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amountText}
            onChangeText={setAmountText}
            state={billAmountInvalid ? 'invalid' : undefined}
            message={billAmountInvalid ? 'Enter an amount more than 0, like 1200.' : undefined}
          />
          <SelectField
            labelPosition="above"
            label="How often"
            options={FREQUENCY_OPTIONS}
            value={frequency}
            onChange={(v) => setFrequency(v as BillFrequency)}
          />
          <DateField label="Next due date" value={dueDate} onChange={setDueDate} minimumDate={today()} />
          <Button variant="outline" fullWidth disabled={!canAddBill} onPress={addBill}>
            Add bill
          </Button>
        </View>
      </Card>
    </SetupScreen>
  );
}
