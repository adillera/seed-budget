import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { Button, Modal, Text } from '@/components/ui';
import { deleteCategory, type ListedCategory } from '@/db/categories';

import { countLabel } from './counts';

export type DeleteCategoryDialogProps = {
  /** The category to delete; null keeps the dialog closed. */
  category: ListedCategory | null;
  onClose: () => void;
  onDeleted: () => void;
};

/** Confirms deleting a category and says what goes with it. */
export function DeleteCategoryDialog({ category, onClose, onDeleted }: DeleteCategoryDialogProps) {
  const db = useSQLiteContext();
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  // Keep the last category while the dialog fades out, so its title doesn't go blank.
  const [shown, setShown] = useState(category);
  if (category && category !== shown) setShown(category);

  const close = () => {
    if (deleting) return;
    setFailed(false);
    onClose();
  };

  const remove = async () => {
    if (!shown || deleting) return;
    setDeleting(true);
    setFailed(false);
    try {
      await deleteCategory(db, shown.id);
      onDeleted();
    } catch (error) {
      console.error('Categories: deleting failed', error);
      setFailed(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open={category !== null} onClose={close} title={`Delete “${shown?.name ?? ''}”?`}>
      {shown && <Text color="textBlackSoft">{consequence(shown)}</Text>}
      <Button variant="destructive" fullWidth loading={deleting} onPress={remove}>
        Delete category
      </Button>
      {failed && (
        <Text variant="small" color="red">
          Couldn’t delete it. Try again.
        </Text>
      )}
    </Modal>
  );
}

function consequence({ entryCount, billCount, hasStartingBudget }: ListedCategory) {
  const parts = [
    entryCount > 0 ? countLabel(entryCount, 'entry', 'entries') : null,
    billCount > 0 ? countLabel(billCount, 'recurring bill', 'recurring bills') : null,
  ].filter(Boolean);
  const lines: string[] = [];
  if (parts.length > 0) lines.push(`Its ${parts.join(' and ')} will be deleted too.`);
  if (hasStartingBudget) lines.push('That includes your starting budget.');
  lines.push('This can’t be undone.');
  return lines.join(' ');
}
