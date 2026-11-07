import { Pressable, View } from 'react-native';

import { Icon, icons, Text } from '@/components/ui';

export type ItemRowProps = {
  title: string;
  detail?: string;
  /** Short tag on the right, e.g. "Expense". */
  meta?: string;
  onRemove: () => void;
  /** Accessibility label of the remove button, e.g. "Remove Needs". */
  removeLabel: string;
};

/** A row in an onboarding list (categories, bills): title, detail, meta and a remove ✕. */
export function ItemRow({ title, detail, meta, onRemove, removeLabel }: ItemRowProps) {
  return (
    <View className="bg-neutral-warm rounded-card flex-row items-center gap-2 pl-3 py-2">
      <View className="flex-1">
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {detail && (
          <Text variant="small" color="textBlackSoft" numberOfLines={1}>
            {detail}
          </Text>
        )}
      </View>
      {meta && (
        <Text variant="small" color="textBlackSoft">
          {meta}
        </Text>
      )}
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        className="size-tap-target items-center justify-center active:opacity-pressed">
        <Icon name={icons.close} size={18} color="textBlackSoft" />
      </Pressable>
    </View>
  );
}
