import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Card, HintScrollView, Text } from '@/components/ui';
import { loadForecastData, type ForecastData } from '@/db/forecast';
import { postDueBills } from '@/db/recurring';
import { BalanceChart } from '@/features/forecast/balance-chart';
import { DateRangeCard } from '@/features/forecast/date-range-card';
import { buildForecast, dayOne, defaultTo, maxTo } from '@/features/forecast/forecast';
import { SummaryCard } from '@/features/forecast/summary-card';
import { PhotoHero } from '@/features/home/photo-hero';
import { toLocalISODate, today as todayDate } from '@/lib/dates';

const PHOTO = require('@/assets/images/onboarding/02-breaking.jpg');

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: ForecastData; today: string };

/** The running balance from day one to a chosen To date: totals and a balance-over-time chart. */
export default function Forecast() {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({ status: 'loading' });
  // Picked To date for this session; null = the default (a month from today).
  const [pickedTo, setPickedTo] = useState<string | null>(null);

  // Post due bills, then reload, on every focus (entries may have changed on other tabs).
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      let active = true;
      const today = toLocalISODate(todayDate());
      postDueBills(db, today)
        .then(() => loadForecastData(db))
        .then((data) => {
          if (active) setState({ status: 'ready', data, today });
        })
        .catch((error: unknown) => {
          console.error('Forecast: loading failed', error);
          if (active) setState({ status: 'error' });
        });
      return () => {
        active = false;
        setStatusBarStyle('dark');
      };
    }, [db]),
  );

  const view = useMemo(() => {
    if (state.status !== 'ready') return null;
    const from = dayOne(state.data, state.today);
    const max = maxTo(state.today);
    let to = pickedTo ?? defaultTo(state.today);
    if (to <= from) to = defaultTo(state.today);
    if (to > max) to = max;
    return { from, to, max, forecast: buildForecast(state.data, from, to) };
  }, [state, pickedTo]);

  return (
    <View className="flex-1 bg-neutral-warm">
      <HintScrollView className="flex-1" contentContainerClassName="pb-4">
        <PhotoHero photo={PHOTO}>
          <View className="gap-1">
            <Text variant="heroLarge" color="textWhite" accessibilityRole="header">
              Forecast
            </Text>
            <Text color="textWhiteSoft">See where your money lands, day by day.</Text>
          </View>
        </PhotoHero>

        <View className="w-full max-w-content self-center px-3 md:px-4 lg:px-6 pt-4 gap-4">
          {state.status === 'error' && (
            <Card>
              <Text color="red">Couldn’t load your forecast. Leave this tab and come back to try again.</Text>
            </Card>
          )}
          {state.status === 'ready' && view && (
            <>
              <DateRangeCard
                from={view.from}
                to={view.to}
                today={state.today}
                maxTo={view.max}
                starting={state.data.starting}
                onChangeTo={setPickedTo}
              />
              <SummaryCard forecast={view.forecast} to={view.to} />
              <BalanceChart
                key={`${view.from}:${view.to}:${view.forecast.points.length}`}
                points={view.forecast.points}
                days={view.forecast.days}
              />
            </>
          )}
        </View>
      </HintScrollView>
    </View>
  );
}
