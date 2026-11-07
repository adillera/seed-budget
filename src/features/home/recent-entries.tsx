import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { RecentEntry } from '@/db/home';
import { formatShortDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

/** The latest entries, newest first, or an empty state. */
export function RecentEntries({ entries }: { entries: RecentEntry[] }) {
  return (
    <View className="gap-3">
      <Text variant="h1" accessibilityRole="header">
        Recent entries
      </Text>
      <Card tight>
        {entries.length === 0 ? (
          <Text color="textBlackSoft">
            Nothing planted yet. Add your first expense or income to see it here.
          </Text>
        ) : (
          <View className="gap-3">
            {entries.map((e) => {
              const sign = e.kind === 'income' ? '+' : '−';
              const detail = [e.note, formatShortDate(e.date)].filter(Boolean).join(' · ');
              return (
                <View key={e.id} className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {e.category_name}
                    </Text>
                    <Text variant="small" color="textBlackSoft" numberOfLines={1}>
                      {detail}
                    </Text>
                  </View>
                  <Text variant="bodyStrong">
                    {sign}
                    {formatMoney(e.amount_cents)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </View>
  );
}
