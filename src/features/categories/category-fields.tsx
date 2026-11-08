import { View } from 'react-native';

import { ChoiceChips, FieldLabel, Text, TextField } from '@/components/ui';
import { DuplicateCategoryNameError, type CategoryInput } from '@/db/categories';
import type { CategoryKind } from '@/db/schema';

export type CategoryDraft = { name: string; description: string; kind: CategoryKind };

export type CategoryFieldsProps = {
  draft: CategoryDraft;
  onChange: (draft: CategoryDraft) => void;
  /** The category has entries or bills: show a note instead of the Type chips. */
  kindLocked?: boolean;
  /** Shown under Name (e.g. a duplicate name). */
  nameError?: string;
};

const KIND_OPTIONS = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
] as const;

const NAME_MAX = 40;

/** Name, Description and Type: the add card and a row's inline edit. */
export function CategoryFields({ draft, onChange, kindLocked, nameError }: CategoryFieldsProps) {
  return (
    <View className="gap-3">
      <TextField
        labelPosition="above"
        label="Name"
        placeholder="e.g. Groceries"
        maxLength={NAME_MAX}
        value={draft.name}
        onChangeText={(name) => onChange({ ...draft, name })}
        state={nameError ? 'invalid' : undefined}
        message={nameError}
      />
      <TextField
        labelPosition="above"
        label="Description"
        optionalHint="(optional)"
        placeholder="e.g. Rice, veggies, weekly market run"
        value={draft.description}
        onChangeText={(description) => onChange({ ...draft, description })}
      />
      <View className="gap-2">
        <FieldLabel label="Type" />
        {kindLocked ? (
          <Text variant="small" color="textBlackSoft">
            Type can’t change once it has entries.
          </Text>
        ) : (
          <ChoiceChips
            layout="stretch"
            label="Type"
            options={KIND_OPTIONS}
            value={draft.kind}
            onChange={(kind) => onChange({ ...draft, kind })}
          />
        )}
      </View>
    </View>
  );
}

/** Trimmed values to save; an empty description saves NULL. */
export const toCategoryInput = (draft: CategoryDraft): CategoryInput => ({
  name: draft.name.trim(),
  description: draft.description.trim() || null,
  kind: draft.kind,
});

/** The Name field's message for a duplicate, or null for other failures. */
export const duplicateNameMessage = (error: unknown) =>
  error instanceof DuplicateCategoryNameError ? `You already have a category called “${error.takenName}”.` : null;
