import { View } from 'react-native';

import { formatShortDate } from '@/lib/dates';

import { Icon, icons } from './icon';
import { Text } from './text';
import { FieldLabel } from './text-field';

const lockedBox = 'min-h-field rounded-field border border-ceramic bg-ceramic flex-row items-center gap-2 px-3';

/** The locked date box both DateField twins render for `disabled`: a grey ceramic box, no picker. */
export function LockedDate({ label, value }: { label: string; value: Date }) {
  return (
    <View className="gap-1">
      <FieldLabel label={label} />
      <View
        className={lockedBox}
        accessible
        accessibilityLabel={`${label}: ${formatShortDate(value)}`}
        aria-disabled>
        <Icon name={icons.calendar} size={18} color="textBlackSoft" />
        <Text color="textBlackSoft" className="flex-1">
          {formatShortDate(value)}
        </Text>
      </View>
    </View>
  );
}
