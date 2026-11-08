import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { formatShortDate } from '@/lib/dates';
import { useMoney } from '@/lib/currency';

import type { Forecast } from './forecast';

export type SummaryCardProps = { forecast: Forecast; to: string };

/** Coming in, going out and the balance on the To date, green or red. */
export function SummaryCard({ forecast, to }: SummaryCardProps) {
  const { format: formatMoney } = useMoney();
  const negative = forecast.endBalanceCents < 0;
  return (
    <Card>
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="h1" accessibilityRole="header">
          Summary
        </Text>
        <Text variant="small" color="textBlackSoft">
          {forecast.days} {forecast.days === 1 ? 'day' : 'days'}
        </Text>
      </View>

      <View className="flex-row gap-2">
        <Tile label="Coming in" value={`+${formatMoney(forecast.incomeCents)}`} />
        <Tile label="Going out" value={`−${formatMoney(forecast.expenseCents)}`} />
      </View>

      <View
        className={`flex-row items-center gap-3 rounded-card px-3 py-3 ${negative ? 'bg-invalid-tint' : 'bg-green-light'}`}>
        <View className="flex-1">
          <Text variant="smallBold" color={negative ? 'red' : 'greenBrand'}>
            {negative ? 'IN THE RED' : 'IN THE GREEN'}
          </Text>
          <Text variant="small" color="textBlackSoft">
            Balance on {formatShortDate(to)}
          </Text>
        </View>
        <Text variant="h1" color={negative ? 'red' : 'greenBrand'} adjustsFontSizeToFit numberOfLines={1}>
          {formatMoney(forecast.endBalanceCents)}
        </Text>
      </View>
    </Card>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-card bg-ceramic px-3 py-2">
      <Text variant="small" color="textBlackSoft">
        {label}
      </Text>
      <Text variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}
