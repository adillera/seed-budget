import { Redirect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { Button, Text } from '@/components/ui';
import { loadEntryByKey, type EditableEntry } from '@/db/entries';
import { EntryForm } from '@/features/entry/entry-form';
import { SheetFrame } from '@/features/entry/sheet-frame';
import { closeSheet } from '@/features/entry/sheet-header';
import { useOnboarded } from '@/lib/onboarding';

type State = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; entry: EditableEntry };

/** "Edit entry" sheet for /entry/e-<id> (transaction) or /entry/b-<id> (bill). */
export default function EditEntry() {
  const onboarded = useOnboarded();
  const db = useSQLiteContext();
  const { key } = useLocalSearchParams<{ key: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    loadEntryByKey(db, key)
      .then((entry) => {
        if (active) setState(entry ? { status: 'ready', entry } : { status: 'missing' });
      })
      .catch((error: unknown) => {
        console.error('Edit entry: loading failed', error);
        if (active) setState({ status: 'missing' });
      });
    return () => {
      active = false;
    };
  }, [db, key]);

  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <SheetFrame title="Edit entry">
      {state.status === 'loading' ? null : state.status === 'ready' ? (
        <EntryForm key={state.entry.key} initial={state.entry} />
      ) : (
        <>
          <Text color="textBlackSoft">This entry no longer exists.</Text>
          <Button variant="outline" fullWidth onPress={closeSheet}>
            Close
          </Button>
        </>
      )}
    </SheetFrame>
  );
}
