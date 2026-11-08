/**
 * Web: downloads the CSV through a temporary `<a download>` (expo-sharing can't share local
 * files on web).
 */
export async function saveCsvFile(fileName: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }));
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Revoke after the click has been handled, or some browsers cancel the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
