import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { ListedCategory } from '@/db/categories';
import type { CategoryKind } from '@/db/schema';

import { CategoryRow } from './category-row';
import { countLabel } from './counts';

export type CategorySectionProps = {
  kind: CategoryKind;
  categories: ListedCategory[];
  editingId: number | null;
  onEdit: (id: number | null) => void;
  onSaved: () => void;
  onDelete: (category: ListedCategory) => void;
};

const TITLE: Record<CategoryKind, string> = { income: 'Income', expense: 'Expenses' };

/** "Income" or "Expenses": a heading with the count, then one card per category. */
export function CategorySection({ kind, categories, editingId, onEdit, onSaved, onDelete }: CategorySectionProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text variant="h1" accessibilityRole="header">
          {TITLE[kind]}
        </Text>
        <Text variant="small" color="textBlackSoft">
          {countLabel(categories.length, 'category', 'categories')}
        </Text>
      </View>
      {categories.length === 0 ? (
        <Card tight>
          <Text color="textBlackSoft">No {kind} categories yet.</Text>
        </Card>
      ) : (
        categories.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            editing={editingId === c.id}
            onEdit={() => onEdit(c.id)}
            onCancel={() => onEdit(null)}
            onSaved={onSaved}
            onDelete={() => onDelete(c)}
          />
        ))
      )}
    </View>
  );
}
