import { Redirect } from 'expo-router';

import { EntryForm } from '@/features/entry/entry-form';
import { SheetFrame } from '@/features/entry/sheet-frame';
import { useOnboarded } from '@/lib/onboarding';

/** "Add an entry" sheet, opened from Home's hero (form sheet on native, overlay on web). */
export default function AddEntry() {
  const onboarded = useOnboarded();
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <SheetFrame title="Add an entry">
      <EntryForm />
    </SheetFrame>
  );
}
