import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { CategoryKind } from '@/db/schema';
import { formatMoney } from '@/lib/money';

export type EntryRowProps = {
  /** The category name. */
  title: string;
  /** e.g. "Groceries · Nov 8, 2026" or "Rent · Monthly · next Dec 5, 2026". */
  detail: string;
  amountCents: number;
  kind: CategoryKind;
  onPress: () => void;
};

/** One entry or bill: category, detail line and the signed amount. Pressing it opens the edit sheet. */
export function EntryRow({ title, detail, amountCents, kind, onPress }: EntryRowProps) {
  const sign = kind === 'income' ? '+' : '−';
  const amount = formatMoney(amountCents);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detail}, ${kind === 'income' ? 'plus' : 'minus'} ${amount}`}
      accessibilityHint="Opens it to edit or delete"
      className="min-h-tap-target flex-row items-center gap-3 rounded-field active:bg-black-alpha-6">
      <View className="flex-1">
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="small" color="textBlackSoft" numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Text variant="bodyStrong">
        {sign}
        {amount}
      </Text>
    </Pressable>
  );
}

/** Detail line pieces, joined with " · " and blanks dropped. */
export const joinDetail = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ');
