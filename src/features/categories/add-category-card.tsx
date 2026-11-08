import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { addCategory } from '@/db/categories';

import { CategoryFields, duplicateNameMessage, toCategoryInput, type CategoryDraft } from './category-fields';

const EMPTY: CategoryDraft = { name: '', description: '', kind: 'expense' };

/** "Add a category": Name, Description, Type. Clears Name and Description after adding; Type stays. */
export function AddCategoryCard({ onAdded }: { onAdded: () => void }) {
  const db = useSQLiteContext();
  const [draft, setDraft] = useState(EMPTY);
  const [nameError, setNameError] = useState<string | undefined>();
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const input = toCategoryInput(draft);

  const change = (next: CategoryDraft) => {
    setDraft(next);
    setNameError(undefined);
    setFailed(false);
  };

  const add = async () => {
    if (saving || !input.name) return;
    setSaving(true);
    setFailed(false);
    try {
      await addCategory(db, input);
      setDraft({ ...EMPTY, kind: draft.kind });
      onAdded();
    } catch (error) {
      const duplicate = duplicateNameMessage(error);
      if (duplicate) setNameError(duplicate);
      else {
        console.error('Categories: adding failed', error);
        setFailed(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Text variant="h1" accessibilityRole="header">
        Add a category
      </Text>
      <CategoryFields draft={draft} onChange={change} nameError={nameError} />
      <View className="mt-4">
        <Button fullWidth disabled={!input.name} loading={saving} onPress={add}>
          Add category
        </Button>
      </View>
      {failed && (
        <Text variant="small" color="red">
          Couldn’t add it. Try again.
        </Text>
      )}
    </Card>
  );
}
