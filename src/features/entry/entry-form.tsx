import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, ChoiceChips, DateField, Modal, SelectField, Text, TextField } from '@/components/ui';
import {
  addEntry,
  deleteEntry,
  loadEntryCategories,
  updateEntry,
  type EditableEntry,
  type EntryCategory,
  type EntryRepeat,
} from '@/db/entries';
import type { CategoryKind } from '@/db/schema';
import { fromLocalISODate, toLocalISODate, today } from '@/lib/dates';
import { FREQUENCY_OPTIONS } from '@/lib/frequency';
import { CURRENCY, formatMoney, parseMoney } from '@/lib/money';

import { closeSheet } from './sheet-header';

export const ENTRY_NOTE_MAX = 60;

const KIND_OPTIONS = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
] as const;

/** Amount as the person would type it: "1500" or "1500.50". */
const amountText = (cents: number) => (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));

export type EntryFormProps = {
  /** Edit mode: the saved row. Without it the form adds a new entry. */
  initial?: EditableEntry;
};

/**
 * Add or edit an entry: kind, amount, category, note, repeats and date. One-time saves a
 * transaction; any other repeat saves a bill (src/db/entries.ts). Edit mode adds Delete.
 * The starting budget hides kind, note and repeats: Home finds it by its note.
 * Closes the sheet once saved or deleted.
 */
export function EntryForm({ initial }: EntryFormProps) {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<EntryCategory[] | null>(null);
  const [kind, setKind] = useState<CategoryKind>(initial?.kind ?? 'expense');
  const [amountInput, setAmountInput] = useState(initial ? amountText(initial.amountCents) : '');
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [chosenCategoryId, setChosenCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [note, setNote] = useState(initial?.note ?? '');
  const [repeat, setRepeat] = useState<EntryRepeat>(initial?.repeat ?? 'once');
  const [date, setDate] = useState(() => (initial ? fromLocalISODate(initial.date) : today()));
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const startingBudget = initial?.isStartingBudget ?? false;

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
    const amountCents = parseMoney(amountInput);
    if (amountCents === null || amountCents <= 0) {
      setAmountInvalid(true);
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    try {
      const entry = {
        categoryId: category.id,
        amountCents,
        // The starting budget keeps its note and stays a one-time entry.
        note: startingBudget ? (initial?.note ?? null) : note.trim() || null,
        repeat: startingBudget ? ('once' as const) : repeat,
        date: toLocalISODate(date),
      };
      if (initial) await updateEntry(db, initial.key, entry);
      else await addEntry(db, entry);
      closeSheet();
    } catch (error) {
      console.error('Add entry: saving failed', error);
      setSaveFailed(true);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!initial || saving) return;
    setSaving(true);
    setDeleteFailed(false);
    try {
      await deleteEntry(db, initial.key);
      setConfirmingDelete(false);
      closeSheet();
    } catch (error) {
      console.error('Edit entry: deleting failed', error);
      setDeleteFailed(true);
      setSaving(false);
    }
  };

  return (
    <View className="gap-3">
      {startingBudget ? (
        <Text variant="small" color="textBlackSoft">
          Your starting budget. It’s capital, so Home leaves it out of monthly income.
        </Text>
      ) : (
        <ChoiceChips layout="stretch" label="Entry type" options={KIND_OPTIONS} value={kind} onChange={changeKind} />
      )}

      <TextField
        labelPosition="above"
        label="Amount"
        prefix={CURRENCY.symbol}
        inputSize="lg"
        placeholder="0.00"
        keyboardType="decimal-pad"
        autoFocus={!initial}
        value={amountInput}
        onChangeText={(text) => {
          setAmountInput(text);
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
        {!startingBudget && (
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
        )}
      </View>

      {!startingBudget && (
        <SelectField
          labelPosition="above"
          label="Repeats"
          options={FREQUENCY_OPTIONS}
          value={repeat}
          onChange={(v) => setRepeat(v as EntryRepeat)}
        />
      )}

      <DateField label="Date" value={date} onChange={setDate} />

      {noCategories && (
        <Text variant="small" color="textBlackSoft">
          Add one in Categories to log {kind === 'income' ? 'income' : 'an expense'}.
        </Text>
      )}
      {saveFailed && <Text color="red">Couldn’t save. Try again.</Text>}

      <Button fullWidth loading={saving} disabled={!category} onPress={save}>
        {initial ? 'Save changes' : kind === 'income' ? 'Save income' : 'Save expense'}
      </Button>

      {initial && (
        <>
          <Button variant="destructiveSubtle" fullWidth disabled={saving} onPress={() => setConfirmingDelete(true)}>
            Delete entry
          </Button>
          <Modal open={confirmingDelete} onClose={() => setConfirmingDelete(false)} title="Delete this entry?">
            <Text color="textBlackSoft">
              {[category?.name, formatMoney(initial.amountCents), initial.note].filter(Boolean).join(' · ')}. This
              can’t be undone.
            </Text>
            {deleteFailed && <Text color="red">Couldn’t delete. Try again.</Text>}
            <Button variant="destructive" fullWidth loading={saving} onPress={remove}>
              Delete
            </Button>
            <Button variant="outline" fullWidth onPress={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
          </Modal>
        </>
      )}
    </View>
  );
}
