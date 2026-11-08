import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import type { ExportCounts } from '@/db/export';

import { ResetDialog } from './reset-dialog';

export type ResetCardProps = {
  /** For the confirm copy; null while loading. */
  counts: ExportCounts | null;
};

/** Start over: the outline button opens the confirm dialog, which does the reset. */
export function ResetCard({ counts }: ResetCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Text variant="h1" color="red" accessibilityRole="header">
        Start over
      </Text>
      <View className="gap-3">
        <Text variant="small" color="textBlackSoft">
          Resetting clears your starting budget, recurring bills, categories, entries and settings, then takes you
          back to the beginning of onboarding.
        </Text>
        <Button variant="destructiveOutline" fullWidth onPress={() => setOpen(true)}>
          Reset Seed: Budget
        </Button>
      </View>
      <ResetDialog open={open} counts={counts} onClose={() => setOpen(false)} />
    </Card>
  );
}
