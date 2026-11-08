import { router } from 'expo-router';
import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { RecentEntry } from '@/db/home';
import { EntryRow, joinDetail } from '@/features/entries/entry-row';
import { formatShortDate } from '@/lib/dates';
import { frequencyLabel } from '@/lib/frequency';

/** The latest entries and bills, newest first, or an empty state. */
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
            {entries.map((e) => (
              <EntryRow
                key={e.key}
                title={e.category_name}
                detail={
                  e.type === 'entry'
                    ? joinDetail([e.note, formatShortDate(e.date), e.recurring ? 'Recurring' : null])
                    : joinDetail([e.name, frequencyLabel(e.frequency), `next ${formatShortDate(e.next_due_date)}`])
                }
                amountCents={e.amount_cents}
                kind={e.kind}
                onPress={() => router.push(`/entry/${e.key}`)}
              />
            ))}
          </View>
        )}
      </Card>
    </View>
  );
}
