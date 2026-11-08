import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Card, HintScrollView, Text } from '@/components/ui';
import { loadCategoryList, type ListedCategory } from '@/db/categories';
import { AddCategoryCard } from '@/features/categories/add-category-card';
import { CategorySection } from '@/features/categories/category-section';
import { countLabel } from '@/features/categories/counts';
import { DeleteCategoryDialog } from '@/features/categories/delete-category-dialog';
import { PhotoHero } from '@/features/home/photo-hero';

const PHOTO = require('@/assets/images/onboarding/05-field.jpg');

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; categories: ListedCategory[] };

/** Income and expense categories: add one, edit one in place, delete one with everything under it. */
export default function Categories() {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<ListedCategory | null>(null);

  const reload = useCallback(
    () =>
      loadCategoryList(db)
        .then((categories) => setState({ status: 'ready', categories }))
        .catch((error: unknown) => {
          console.error('Categories: loading failed', error);
          setState({ status: 'error' });
        }),
    [db],
  );

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      reload();
      return () => setStatusBarStyle('dark');
    }, [reload]),
  );

  const categories = state.status === 'ready' ? state.categories : null;
  const income = categories?.filter((c) => c.kind === 'income') ?? [];
  const expenses = categories?.filter((c) => c.kind === 'expense') ?? [];

  const sectionProps = {
    editingId,
    onEdit: setEditingId,
    onSaved: () => {
      setEditingId(null);
      reload();
    },
    onDelete: (c: ListedCategory) => {
      setEditingId(null);
      setDeleting(c);
    },
  };

  return (
    <View className="flex-1 bg-neutral-warm">
      <HintScrollView
        className="flex-1"
        contentContainerClassName="pb-4"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <PhotoHero photo={PHOTO}>
          <View className="gap-1">
            <Text variant="heroLarge" color="textWhite" accessibilityRole="header">
              Categories
            </Text>
            {categories && <Text color="textWhiteSoft">{subtitle(income.length, expenses.length)}</Text>}
          </View>
        </PhotoHero>

        <View className="w-full max-w-content self-center px-3 md:px-4 lg:px-6 pt-4 gap-4">
          <AddCategoryCard onAdded={reload} />
          {state.status === 'error' && (
            <Card>
              <Text color="red">Couldn’t load your categories. Leave this tab and come back to try again.</Text>
            </Card>
          )}
          {categories && (
            <>
              <CategorySection kind="income" categories={income} {...sectionProps} />
              <CategorySection kind="expense" categories={expenses} {...sectionProps} />
            </>
          )}
        </View>
      </HintScrollView>

      <DeleteCategoryDialog
        category={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          reload();
        }}
      />
    </View>
  );
}

function subtitle(income: number, expenses: number) {
  if (income + expenses === 0) return 'No categories yet. Add one below.';
  return `${countLabel(income, 'category', 'categories')} coming in, ${countLabel(expenses, 'category', 'categories')} going out.`;
}
