import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useState } from 'react';

import { Card, Screen, Text } from '@/components/ui';
import { loadHomeData, type RecentEntry } from '@/db/home';
import { postDueBills } from '@/db/recurring';
import { CategoryBreakdown } from '@/features/home/category-breakdown';
import { Hero } from '@/features/home/hero';
import { RecentEntries } from '@/features/home/recent-entries';
import { summarize, type HomeSummary } from '@/features/home/summary';
import { monthBounds, toLocalISODate, today } from '@/lib/dates';

type HomeState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; month: Date; summary: HomeSummary; recent: RecentEntry[] };

export default function Home() {
  const db = useSQLiteContext();
  const [state, setState] = useState<HomeState>({ status: 'loading' });

  // Reload on every focus so entries added elsewhere show up; light status bar over the photo.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      let active = true;
      const month = today();
      const { start, end } = monthBounds(month);
      // Post due bill occurrences first, so the month counts them as transactions.
      postDueBills(db, toLocalISODate(month))
        .then(() => loadHomeData(db, start, end))
        .then((data) => {
          if (active) setState({ status: 'ready', month, summary: summarize(data, start, end), recent: data.recent });
        })
        .catch((error: unknown) => {
          console.error('Home: loading failed', error);
          if (active) setState({ status: 'error' });
        });
      return () => {
        active = false;
        setStatusBarStyle('dark');
      };
    }, [db]),
  );

  if (state.status === 'loading') return <Screen>{null}</Screen>;
  if (state.status === 'error') {
    return (
      <Screen>
        <Card>
          <Text color="red">Couldn’t load your budget. Leave this tab and come back to try again.</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll edges={[]} header={<Hero month={state.month} summary={state.summary} />}>
      <CategoryBreakdown categories={state.summary.categories} />
      <RecentEntries entries={state.recent} />
    </Screen>
  );
}
