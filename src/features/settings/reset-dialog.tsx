import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { Button, Modal, Text } from '@/components/ui';
import type { ExportCounts } from '@/db/export';
import { resetAllData } from '@/db/reset';
import { countLabel } from '@/features/categories/counts';
import { DEFAULT_CURRENCY_CODE } from '@/lib/currencies';
import { resetCurrency } from '@/lib/currency';
import { resetOnboarding } from '@/lib/onboarding';

export type ResetDialogProps = {
  open: boolean;
  counts: ExportCounts | null;
  onClose: () => void;
};

/**
 * Confirms Start over. Rows go first in one transaction; only then the currency and, last, the
 * onboarded flag, whose change makes the tabs layout redirect to /onboarding. A failed delete
 * clears nothing else.
 */
export function ResetDialog({ open, counts, onClose }: ResetDialogProps) {
  const db = useSQLiteContext();
  const [resetting, setResetting] = useState(false);
  const [failed, setFailed] = useState(false);

  const close = () => {
    if (resetting) return;
    setFailed(false);
    onClose();
  };

  const reset = async () => {
    if (resetting) return;
    setResetting(true);
    setFailed(false);
    try {
      await resetAllData(db);
    } catch (error) {
      console.error('Settings: reset failed', error);
      setFailed(true);
      setResetting(false);
      return;
    }
    resetCurrency();
    resetOnboarding();
  };

  return (
    <Modal open={open} onClose={close} title="Reset Seed: Budget?">
      <Text color="textBlackSoft">{consequence(counts)}</Text>
      <Button variant="destructive" fullWidth loading={resetting} onPress={reset}>
        Reset everything
      </Button>
      {failed && (
        <Text variant="small" color="red">
          Couldn’t reset. Try again.
        </Text>
      )}
    </Modal>
  );
}

function consequence(counts: ExportCounts | null) {
  const what = counts
    ? [
        counts.startingBudgets > 0 ? 'your starting budget' : null,
        countLabel(counts.entries, 'entry', 'entries'),
        countLabel(counts.bills, 'recurring bill', 'recurring bills'),
        countLabel(counts.categories, 'category', 'categories'),
      ].filter(Boolean)
    : ['all your entries, bills and categories'];
  const list = what.length > 1 ? `${what.slice(0, -1).join(', ')} and ${what[what.length - 1]}` : what[0];
  return `This deletes ${list}, and sets the currency back to ${DEFAULT_CURRENCY_CODE}. It can’t be undone. Save a CSV first if you want a copy.`;
}
