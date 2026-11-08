import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, Icon, icons, Text, type IconName } from '@/components/ui';
import { updateCategory, type ListedCategory } from '@/db/categories';

import { CategoryFields, duplicateNameMessage, toCategoryInput, type CategoryDraft } from './category-fields';

export type CategoryRowProps = {
  category: ListedCategory;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  /** Saved: close the edit and reload. */
  onSaved: () => void;
  onDelete: () => void;
};

/** One category card: name and description with edit and delete, or its inline edit form. */
export function CategoryRow({ category, editing, onEdit, onCancel, onSaved, onDelete }: CategoryRowProps) {
  if (editing) return <CategoryEditor category={category} onCancel={onCancel} onSaved={onSaved} />;
  return (
    <Card tight>
      <View className="flex-row items-center gap-1">
        <View className="flex-1">
          <Text variant="bodyStrong" numberOfLines={1}>
            {category.name}
          </Text>
          {category.description && (
            <Text variant="small" color="textBlackSoft" numberOfLines={2}>
              {category.description}
            </Text>
          )}
        </View>
        <IconButton icon={icons.pencil} label={`Edit ${category.name}`} onPress={onEdit} />
        <IconButton icon={icons.trash} label={`Delete ${category.name}`} onPress={onDelete} />
      </View>
    </Card>
  );
}

function IconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="size-tap-target items-center justify-center rounded-circle active:bg-black-alpha-6">
      <Icon name={icon} size={18} />
    </Pressable>
  );
}

function CategoryEditor({ category, onCancel, onSaved }: Pick<CategoryRowProps, 'category' | 'onCancel' | 'onSaved'>) {
  const db = useSQLiteContext();
  const [draft, setDraft] = useState<CategoryDraft>({
    name: category.name,
    description: category.description ?? '',
    kind: category.kind,
  });
  const [nameError, setNameError] = useState<string | undefined>();
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const input = toCategoryInput(draft);
  const kindLocked = category.entryCount + category.billCount > 0;

  const change = (next: CategoryDraft) => {
    setDraft(next);
    setNameError(undefined);
    setFailed(false);
  };

  const save = async () => {
    if (saving || !input.name) return;
    setSaving(true);
    setFailed(false);
    try {
      await updateCategory(db, category.id, input);
      onSaved();
    } catch (error) {
      const duplicate = duplicateNameMessage(error);
      if (duplicate) setNameError(duplicate);
      else {
        console.error('Categories: saving failed', error);
        setFailed(true);
      }
      setSaving(false);
    }
  };

  return (
    <Card tight>
      <CategoryFields draft={draft} onChange={change} kindLocked={kindLocked} nameError={nameError} />
      {/* Extra space and a neutral Cancel keep the actions from reading as more Type options. */}
      <View className="flex-row gap-2 mt-4">
        <View className="flex-1">
          <Button variant="darkOutline" fullWidth disabled={saving} onPress={onCancel}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button fullWidth disabled={!input.name} loading={saving} onPress={save}>
            Save
          </Button>
        </View>
      </View>
      {failed && (
        <Text variant="small" color="red">
          Couldn’t save. Try again.
        </Text>
      )}
    </Card>
  );
}
