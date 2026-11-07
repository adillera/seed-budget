import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  ChoiceChips,
  HintScrollView,
  Modal,
  Text,
  TextField,
} from '@/components/ui';
import type { CategoryKind } from '@/db/schema';
import {
  DESCRIPTION_MAX,
  hasCategoryNamed,
  hasRequiredKinds,
  NAME_MAX,
  useOnboardingDraft,
  type DraftCategory,
} from '@/features/onboarding/draft';
import { ItemRow } from '@/features/onboarding/item-row';
import { SetupScreen } from '@/features/onboarding/setup-screen';

const KIND_OPTIONS = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
] as const;

const kindLabel: Record<CategoryKind, string> = { income: 'Income', expense: 'Expense' };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Onboarding step 1: review the Kakeibo + Income categories, remove or add your own. */
export default function Fields() {
  const { draft, dispatch } = useOnboardingDraft();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [pendingRemove, setPendingRemove] = useState<DraftCategory | null>(null);

  const trimmed = name.trim();
  const duplicate = trimmed.length > 0 && hasCategoryNamed(draft, trimmed);
  const canAdd = trimmed.length > 0 && !duplicate;
  const ready = hasRequiredKinds(draft);
  const pendingBills = pendingRemove
    ? draft.bills.filter((b) => b.categoryKey === pendingRemove.key).length
    : 0;

  const add = () => {
    if (!canAdd) return;
    const desc = description.trim();
    dispatch({ type: 'addCategory', category: { name: trimmed, description: desc || undefined, kind } });
    setName('');
    setDescription('');
  };

  const remove = (category: DraftCategory) => {
    // A category with bills (added in the next step) asks first: its bills go with it.
    if (draft.bills.some((b) => b.categoryKey === category.key)) setPendingRemove(category);
    else dispatch({ type: 'removeCategory', key: category.key });
  };

  return (
    <SetupScreen
      title="Let’s tend the fields."
      body="Let’s start with the basics. We’ve already prepared the field for you. Keep it as it is, or change it to suit you."
      cta={
        <Button
          variant="inverse"
          fullWidth
          disabled={!ready}
          onPress={() => router.push('/onboarding/plough')}>
          Start ploughing the field
        </Button>
      }>
      <Card tight>
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="h1" accessibilityRole="header">
            Your fields
          </Text>
          <Text variant="small" color="textBlackSoft">
            {plural(draft.categories.length, 'category', 'categories')}
          </Text>
        </View>

        <HintScrollView
          className="max-h-field-list"
          nestedScrollEnabled
          contentContainerClassName="gap-2"
          showsVerticalScrollIndicator={false}>
            {draft.categories.map((c) => (
              <ItemRow
                key={c.key}
                title={c.name}
                detail={c.description}
                meta={kindLabel[c.kind]}
                onRemove={() => remove(c)}
                removeLabel={`Remove ${c.name}`}
              />
            ))}
        </HintScrollView>

        {!ready && (
          <Text variant="small" color="red">
            Keep at least one Income and one Expense field.
          </Text>
        )}

        <View className="gap-3 pt-2">
          <View className="gap-1">
            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <TextField
                  labelPosition="above"
                  label="New category"
                  placeholder="e.g. Groceries"
                  value={name}
                  onChangeText={setName}
                  maxLength={NAME_MAX}
                  state={duplicate ? 'invalid' : undefined}
                  returnKeyType="done"
                  onSubmitEditing={add}
                />
              </View>
              {/* Wrapped: Button aligns itself to the start; this centers it on the input box. */}
              <View className="min-h-field justify-center">
                <Button disabled={!canAdd} onPress={add}>
                  Add
                </Button>
              </View>
            </View>
            {duplicate && (
              <Text variant="micro" color="red">
                You already have a field called {trimmed}.
              </Text>
            )}
          </View>
          <TextField
            labelPosition="above"
            hideLabel
            label="Short description (optional)"
            placeholder="Short description (optional)"
            value={description}
            onChangeText={setDescription}
            maxLength={DESCRIPTION_MAX}
          />
          <ChoiceChips label="Type" options={KIND_OPTIONS} value={kind} onChange={setKind} />
        </View>
      </Card>

      <Modal
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title={`Remove ${pendingRemove?.name ?? ''}?`}>
        <Text color="textBlackSoft">
          Its {plural(pendingBills, 'bill', 'bills')} will be removed too.
        </Text>
        <View className="flex-row gap-2 pt-2">
          <Button
            variant="destructive"
            onPress={() => {
              if (pendingRemove) dispatch({ type: 'removeCategory', key: pendingRemove.key });
              setPendingRemove(null);
            }}>
            Remove
          </Button>
          <Button variant="outline" onPress={() => setPendingRemove(null)}>
            Keep
          </Button>
        </View>
      </Modal>
    </SetupScreen>
  );
}
