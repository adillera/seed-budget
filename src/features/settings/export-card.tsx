import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, icons, Text } from '@/components/ui';
import { loadExportData, type ExportCounts } from '@/db/export';
import { postDueBills } from '@/db/recurring';
import { getCurrency } from '@/lib/currency';
import { toLocalISODate, today } from '@/lib/dates';

import { buildCsv } from './csv';
import { saveCsvFile } from './save-file';

export type ExportCardProps = {
  /** null while loading. */
  counts: ExportCounts | null;
};

/** Counts of what's in the app and a button that saves it all as one CSV file. */
export function ExportCard({ counts }: ExportCardProps) {
  const db = useSQLiteContext();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      const date = toLocalISODate(today());
      await postDueBills(db, date);
      const csv = buildCsv(await loadExportData(db), getCurrency());
      await saveCsvFile(`seed-export-${date}.csv`, csv);
    } catch (error) {
      console.error('Settings: export failed', error);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Text variant="h1" color="greenBrand" accessibilityRole="header">
        Export your data
      </Text>
      <View className="gap-3">
        <Text variant="small">
          Save everything as one CSV file you can keep on your phone or open in a spreadsheet: your starting
          budget, recurring bills, categories and every entry.
        </Text>
        <View className="flex-row rounded-card bg-ceramic px-2 py-3">
          <Count label="Entries" value={counts?.entries} />
          <Count label="Bills" value={counts?.bills} />
          <Count label="Categories" value={counts?.categories} />
        </View>
        <Button fullWidth icon={icons.download} loading={saving} disabled={saving} onPress={save}>
          Save as CSV
        </Button>
        {failed && (
          <Text variant="small" color="red">
            Couldn’t save the file. Please try again.
          </Text>
        )}
      </View>
    </Card>
  );
}

function Count({ label, value }: { label: string; value: number | undefined }) {
  return (
    <View className="flex-1 items-center" accessible accessibilityLabel={`${value ?? 'Loading'} ${label}`}>
      <Text variant="h1" color="greenBrand">
        {value ?? '–'}
      </Text>
      <Text variant="small" color="textBlackSoft">
        {label}
      </Text>
    </View>
  );
}
