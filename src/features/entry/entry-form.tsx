import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, ChoiceChips, DateField, SelectField, Text, TextField } from '@/components/ui';
import { addEntry, loadEntryCategories, type EntryCategory, type EntryRepeat } from '@/db/entries';
import type { CategoryKind } from '@/db/schema';
import { toLocalISODate, today } from '@/lib/dates';
import { FREQUENCY_OPTIONS } from '@/lib/frequency';
import { CURRENCY, formatMoney, parseMoney } from '@/lib/money';

import { closeSheet } from './sheet-header';

export const ENTRY_NOTE_MAX = 60;

const KIND_OPTIONS = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
] as const;

/**
 * Add an entry: kind, amount, category, note, repeats and date. One-time saves a transaction;
 * any other repeat saves a bill (src/db/entries.ts). Closes the sheet once saved.
 */
export function EntryForm() {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<EntryCategory[] | null>(null);
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [amountText, setAmountText] = useState('');
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [chosenCategoryId, setChosenCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [repeat, setRepeat] = useState<EntryRepeat>('once');
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadEntryCategories(db)
      .then((rows) => {
        if (active) setCategories(rows);
      })
      .catch((error: unknown) => {
        console.error('Add entry: loading categories failed', error);
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, [db]);

  const ofKind = (categories ?? []).filter((c) => c.kind === kind);
  // The pick only counts while it's in the current kind; otherwise the kind's first category.
  const category = ofKind.find((c) => c.id === chosenCategoryId) ?? ofKind[0];
  const noCategories = categories !== null && ofKind.length === 0;

  const changeKind = (next: CategoryKind) => {
    setKind(next);
    setChosenCategoryId(null);
  };

  const save = async () => {
    if (saving || !category) return;
    const amountCents = parseMoney(amountText);
    if (amountCents === null || amountCents <= 0) {
      setAmountInvalid(true);
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    try {
      await addEntry(db, {
        categoryId: category.id,
        amountCents,
        note: note.trim() || null,
        repeat,
        date: toLocalISODate(date),
      });
      closeSheet();
    } catch (error) {
      console.error('Add entry: saving failed', error);
      setSaveFailed(true);
      setSaving(false);
    }
  };

  return (
    <View className="gap-3">
      <ChoiceChips layout="stretch" label="Entry type" options={KIND_OPTIONS} value={kind} onChange={changeKind} />

      <TextField
        labelPosition="above"
        label="Amount"
        prefix={CURRENCY.symbol}
        inputSize="lg"
        placeholder="0.00"
        keyboardType="decimal-pad"
        autoFocus
        value={amountText}
        onChangeText={(text) => {
          setAmountText(text);
          setAmountInvalid(false);
        }}
        state={amountInvalid ? 'invalid' : undefined}
        message={amountInvalid ? `Enter an amount above ${formatMoney(0)}` : undefined}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <SelectField
            labelPosition="above"
            label="Category"
            options={ofKind.map((c) => ({ label: c.name, value: String(c.id) }))}
            value={category ? String(category.id) : undefined}
            placeholder={noCategories ? `No ${kind} categories yet` : undefined}
            onChange={(v) => setChosenCategoryId(Number(v))}
          />
        </View>
        <View className="flex-1">
          <TextField
            labelPosition="above"
            label="Note"
            placeholder="e.g. Groceries"
            value={note}
            onChangeText={setNote}
            maxLength={ENTRY_NOTE_MAX}
          />
        </View>
      </View>

      <SelectField
        labelPosition="above"
        label="Repeats"
        options={FREQUENCY_OPTIONS}
        value={repeat}
        onChange={(v) => setRepeat(v as EntryRepeat)}
      />

      <DateField label="Date" value={date} onChange={setDate} />

      {noCategories && (
        <Text variant="small" color="textBlackSoft">
          Add one in Categories to log {kind === 'income' ? 'income' : 'an expense'}.
        </Text>
      )}
      {saveFailed && <Text color="red">Couldn’t save. Try again.</Text>}

      <Button fullWidth loading={saving} disabled={!category} onPress={save}>
        {kind === 'income' ? 'Save income' : 'Save expense'}
      </Button>
    </View>
  );
}
