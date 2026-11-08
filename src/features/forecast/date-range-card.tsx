import { View } from 'react-native';

import { Card, DateField, Text } from '@/components/ui';
import { addDays, formatShortDate, fromLocalISODate, toLocalISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

export type DateRangeCardProps = {
  /** Day one (locked From), YYYY-MM-DD. */
  from: string;
  to: string;
  today: string;
  maxTo: string;
  /** The starting budget row, if any. */
  starting: { cents: number; date: string } | null;
  onChangeTo: (to: string) => void;
};

const AHEAD = 'Pick how far ahead to look with the To date.';

/** From (locked to day one) and To, with a note on where the forecast starts. */
export function DateRangeCard({ from, to, today, maxTo, starting, onChangeTo }: DateRangeCardProps) {
  const when = from === today ? 'today' : formatShortDate(from);
  return (
    <Card>
      <Text variant="h1" accessibilityRole="header">
        Date range
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <DateField label="From" value={fromLocalISODate(from)} onChange={() => {}} disabled />
        </View>
        <View className="flex-1">
          <DateField
            label="To"
            value={fromLocalISODate(to)}
            minimumDate={fromLocalISODate(addDays(from, 1))}
            maximumDate={fromLocalISODate(maxTo)}
            onChange={(date) => onChangeTo(toLocalISODate(date))}
          />
        </View>
      </View>
      <View className="rounded-field bg-ceramic p-3">
        {starting && starting.date === from ? (
          <Text color="textBlackSoft">
            The forecast always starts on the day you planted your{' '}
            <Text variant="bodyStrong" color="greenAccent">
              {formatMoney(starting.cents)}
            </Text>{' '}
            starting budget ({when}). {AHEAD}
          </Text>
        ) : from === today ? (
          <Text color="textBlackSoft">The forecast starts today. {AHEAD}</Text>
        ) : (
          <Text color="textBlackSoft">
            The forecast starts on your first entry ({when}). {AHEAD}
          </Text>
        )}
      </View>
    </Card>
  );
}
