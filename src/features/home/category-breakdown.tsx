import { Pressable, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { size } from '@/theme';

import type { CategorySpend } from './summary';

const LINK_SLOP = (size.tapTarget - 24) / 2;

/** "Where it's going": this month's spending per expense category, with share bars. */
export function CategoryBreakdown({ categories }: { categories: CategorySpend[] }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="h1" accessibilityRole="header">
          Where it’s going
        </Text>
        {/* No action yet (plan 05): editing categories is a later feature. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit categories"
          hitSlop={LINK_SLOP}
          className="active:opacity-pressed">
          <Text variant="bodyStrong" color="greenAccent">
            Edit categories
          </Text>
        </Pressable>
      </View>

      <Card tight>
        <View className="gap-3">
          {categories.map((c) => {
            const percent = Math.round(c.share * 100);
            return (
              <View
                key={c.id}
                className="gap-2"
                accessible
                accessibilityLabel={`${c.name}: ${formatMoney(c.cents)}, ${percent}% of this month’s spending`}>
                <View className="flex-row items-baseline gap-2">
                  <Text variant="bodyStrong">{c.name}</Text>
                  <Text variant="small" color="textBlackSoft" numberOfLines={1} className="flex-1">
                    {c.description ?? ''}
                  </Text>
                  <Text variant="small" color="textBlackSoft">
                    {formatMoney(c.cents)}
                  </Text>
                </View>
                <View className="h-progress-bar rounded-pill bg-ceramic overflow-hidden">
                  {/* Computed width: a layout value, not a token. */}
                  <View className="h-full rounded-pill bg-green-accent" style={{ width: `${percent}%` }} />
                </View>
              </View>
            );
          })}
          <Text variant="small" color="textBlackSoft">
            Recurring bills and entries are counted per month.
          </Text>
        </View>
      </Card>
    </View>
  );
}
