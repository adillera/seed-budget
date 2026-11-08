import { router } from 'expo-router';
import { View } from 'react-native';

import { BrandLockup, Button, icons, Text } from '@/components/ui';
import { formatMonthYear } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

import { GrowthAvatar } from './growth-avatar';
import { PhotoHero } from './photo-hero';
import type { HomeSummary } from './summary';

const PHOTO = require('@/assets/images/onboarding/03-seedling.jpg');

export type HeroProps = { month: Date; summary: HomeSummary };

/**
 * Home's photo hero: brand + month, what's left this month, spent and bills tiles,
 * the growth avatar and "Add an entry".
 */
export function Hero({ month, summary }: HeroProps) {
  return (
    <PhotoHero photo={PHOTO}>
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
    </PhotoHero>
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
