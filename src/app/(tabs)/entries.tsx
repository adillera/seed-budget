import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { FlatList, View } from 'react-native';

import { Button, Card, icons, Text } from '@/components/ui';
import { loadEntryList, type ListedBill, type ListedEntry } from '@/db/entries';
import { postDueBills } from '@/db/recurring';
import { EntryRow, joinDetail } from '@/features/entries/entry-row';
import { groupByMonth } from '@/features/entries/group';
import { PhotoHero } from '@/features/home/photo-hero';
import { formatMonthYear, formatShortDate, fromLocalISODate, toLocalISODate, today } from '@/lib/dates';
import { frequencyLabel } from '@/lib/frequency';
import { CURRENCY } from '@/lib/money';

const PHOTO = require('@/assets/images/onboarding/04-sprout.jpg');

type Section =
  | { type: 'recurring'; key: 'recurring'; bills: ListedBill[] }
  | { type: 'month'; key: string; month: string; entries: ListedEntry[] }
  | { type: 'empty'; key: 'empty' }
  | { type: 'error'; key: 'error' };

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; entries: ListedEntry[]; bills: ListedBill[] };

const COLUMN = 'w-full max-w-content self-center px-3 md:px-4 lg:px-6';

const openEntry = (key: string) => router.push(`/entry/${key}`);

/** Every logged entry: recurring bills first, then one-off entries grouped by month. */
export default function Entries() {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({ status: 'loading' });

  // Post due bills, then reload, on every focus (the add/edit sheets write while this tab sits underneath).
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      let active = true;
      postDueBills(db, toLocalISODate(today()))
        .then(() => loadEntryList(db))
        .then((data) => {
          if (active) setState({ status: 'ready', ...data });
        })
        .catch((error: unknown) => {
          console.error('Entries: loading failed', error);
          if (active) setState({ status: 'error' });
        });
      return () => {
        active = false;
        setStatusBarStyle('dark');
      };
    }, [db]),
  );

  const sections = useMemo((): Section[] => {
    if (state.status === 'loading') return [];
    if (state.status === 'error') return [{ type: 'error', key: 'error' }];
    const { entries, bills } = state;
    if (entries.length === 0 && bills.length === 0) return [{ type: 'empty', key: 'empty' }];
    return [
      ...(bills.length > 0 ? [{ type: 'recurring', key: 'recurring', bills } as const] : []),
      ...groupByMonth(entries).map((g) => ({ type: 'month', key: g.month, ...g }) as const),
    ];
  }, [state]);

  return (
    <View className="flex-1 bg-neutral-warm">
      <FlatList
        data={sections}
        keyExtractor={(s) => s.key}
        ListHeaderComponent={
          <View className="pb-4">
            <EntriesHero />
          </View>
        }
        contentContainerClassName="pb-4"
        ItemSeparatorComponent={Gap}
        renderItem={({ item }) => <View className={COLUMN}>{renderSection(item)}</View>}
      />
    </View>
  );
}

function Gap() {
  return <View className="h-4" />;
}

function EntriesHero() {
  return (
    <PhotoHero photo={PHOTO}>
      <View className="gap-1">
        <Text variant="heroLarge" color="textWhite" accessibilityRole="header">
          Entries
        </Text>
        <Text color="textWhiteSoft">Every {CURRENCY.name} in and out, all in one place.</Text>
      </View>
      <Button variant="inverse" fullWidth icon={icons.plus} onPress={() => router.push('/add-entry')}>
        Add an entry
      </Button>
    </PhotoHero>
  );
}

function renderSection(section: Section) {
  switch (section.type) {
    case 'empty':
      return (
        <Card>
          <Text color="textBlackSoft">
            Nothing planted yet. Tap “Add an entry” to record your first expense or income.
          </Text>
        </Card>
      );
    case 'error':
      return (
        <Card>
          <Text color="red">Couldn’t load your entries. Leave this tab and come back to try again.</Text>
        </Card>
      );
    case 'recurring':
      return (
        <SectionCard title="Recurring" note="Each due date is posted as an entry below.">
          {section.bills.map((b) => (
            <EntryRow
              key={b.key}
              title={b.category_name}
              detail={joinDetail([
                b.name,
                frequencyLabel(b.frequency),
                `${b.frequency === 'once' ? 'due' : 'next'} ${formatShortDate(b.next_due_date)}`,
              ])}
              amountCents={b.amount_cents}
              kind={b.kind}
              onPress={() => openEntry(b.key)}
            />
          ))}
        </SectionCard>
      );
    case 'month':
      return (
        <SectionCard title={formatMonthYear(fromLocalISODate(`${section.month}-01`))}>
          {section.entries.map((e) => (
            <EntryRow
              key={e.key}
              title={e.category_name}
              detail={joinDetail([e.note, formatShortDate(e.date), e.recurring ? 'Recurring' : null])}
              amountCents={e.amount_cents}
              kind={e.kind}
              onPress={() => openEntry(e.key)}
            />
          ))}
        </SectionCard>
      );
  }
}

function SectionCard({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <View>
        <Text variant="h2" accessibilityRole="header">
          {title}
        </Text>
        {note && (
          <Text variant="small" color="textBlackSoft">
            {note}
          </Text>
        )}
      </View>
      <Card tight>
        <View className="gap-3">{children}</View>
      </Card>
    </View>
  );
}
