import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup, Button, icons, Text } from '@/components/ui';
import { formatMonthYear } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { space } from '@/theme';

import { GrowthAvatar } from './growth-avatar';
import type { HomeSummary } from './summary';

const PHOTO = require('@/assets/images/onboarding/03-seedling.jpg');

export type HeroProps = { month: Date; summary: HomeSummary };

/**
 * Full-bleed photo hero: brand + month, what's left this month, spent and bills tiles,
 * the growth avatar and "Add an entry". Runs under the status bar (top inset in style).
 */
export function Hero({ month, summary }: HeroProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="overflow-hidden bg-green-house">
      <View className="absolute inset-0">
        <Image source={PHOTO} contentFit="cover" className="flex-1" />
      </View>
      <View className="absolute inset-0 bg-black-alpha-50" />

      <View
        className="w-full max-w-content self-center gap-4 px-3 md:px-4 lg:px-6 pb-4"
        style={{ paddingTop: insets.top + space[3] }}>
        <View className="flex-row items-center justify-between gap-3">
          <BrandLockup />
          <Text variant="smallBold" color="textWhiteSoft">
            {formatMonthYear(month).toUpperCase()}
          </Text>
        </View>

        <View>
          <Text color="textWhiteSoft">Income this month</Text>
          <Text variant="heroLarge" color="textWhite" accessibilityRole="header">
            {formatMoney(summary.netCents)}
          </Text>
        </View>

        <View className="flex-row items-end gap-2">
          <StatTile label="Spent" cents={summary.spentCents} />
          <StatTile label="Bills / mo" cents={summary.billsMonthlyCents} />
          <View className="ml-auto">
            <GrowthAvatar stage={summary.stage} keptPercent={summary.keptPercent} />
          </View>
        </View>

        <Button variant="inverse" fullWidth icon={icons.plus} onPress={() => router.push('/add-entry')}>
          Add an entry
        </Button>
      </View>
    </View>
  );
}

function StatTile({ label, cents }: { label: string; cents: number }) {
  return (
    <View className="bg-white-alpha-10 border border-white-alpha-20 rounded-card px-3 py-2">
      <Text variant="small" color="textWhiteSoft">
        {label}
      </Text>
      <Text variant="bodyStrong" color="textWhite">
        {formatMoney(cents)}
      </Text>
    </View>
  );
}
