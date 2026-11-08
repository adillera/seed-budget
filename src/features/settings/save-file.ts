import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Native: writes the CSV to the cache directory and opens the share sheet, which offers
 * Save to Files / Drive and other apps. Web twin: save-file.web.ts (a download).
 * Resolves when the sheet closes; throws if sharing isn't available or the write fails.
 */
export async function saveCsvFile(fileName: string, contents: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(contents);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Save your Seed data',
  });
}
