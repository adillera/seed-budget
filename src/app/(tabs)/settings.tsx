import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { HintScrollView, Text } from '@/components/ui';
import { loadExportCounts, type ExportCounts } from '@/db/export';
import { postDueBills } from '@/db/recurring';
import { PhotoHero } from '@/features/home/photo-hero';
import { CurrencyCard } from '@/features/settings/currency-card';
import { ExportCard } from '@/features/settings/export-card';
import { ResetCard } from '@/features/settings/reset-card';
import { toLocalISODate, today } from '@/lib/dates';

const PHOTO = require('@/assets/images/onboarding/04-sprout.jpg');

/** App currency, data export and Start over. */
export default function Settings() {
  const db = useSQLiteContext();
  const [counts, setCounts] = useState<ExportCounts | null>(null);

  // Post due bills, then count, on every focus (entries may have changed on other tabs).
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      let active = true;
      postDueBills(db, toLocalISODate(today()))
        .then(() => loadExportCounts(db))
        .then((next) => {
          if (active) setCounts(next);
        })
        .catch((error: unknown) => console.error('Settings: counting failed', error));
      return () => {
        active = false;
        setStatusBarStyle('dark');
      };
    }, [db]),
  );

  return (
    <View className="flex-1 bg-neutral-warm">
      <HintScrollView className="flex-1" contentContainerClassName="pb-4" keyboardShouldPersistTaps="handled">
        <PhotoHero photo={PHOTO}>
          <View className="gap-1">
            <Text variant="heroLarge" color="textWhite" accessibilityRole="header">
              Settings
            </Text>
            <Text color="textWhiteSoft">Tune how Seed shows your money.</Text>
          </View>
        </PhotoHero>

        <View className="w-full max-w-content self-center px-3 md:px-4 lg:px-6 pt-4 gap-4">
          <CurrencyCard />
          <ExportCard counts={counts} />
          <ResetCard counts={counts} />
        </View>
      </HintScrollView>
    </View>
  );
}
