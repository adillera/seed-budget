import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { formatShortDate } from '@/lib/dates';
import { colors } from '@/theme';

import { Icon, icons } from './icon';
import { Text } from './text';
import { FieldLabel } from './text-field';

export type DateFieldProps = {
  /** Uppercase label above the box. Also the accessibility label. */
  label: string;
  /** A local date (time is ignored). */
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
};

const box = 'min-h-field rounded-field border border-input-border bg-white flex-row items-center gap-2 px-3';

/**
 * Date picker in the boxed form style (matches TextField `above`).
 * iOS: the system compact picker inside the box. Android: tapping opens the system dialog.
 * Web: date-field.web.tsx (a browser date input).
 */
export function DateField({ label, value, onChange, minimumDate }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <View className="gap-1">
        <FieldLabel label={label} />
        <View className={box}>
          <Icon name={icons.calendar} size={18} color="textBlackSoft" />
          <DateTimePicker
            value={value}
            mode="date"
            display="compact"
            minimumDate={minimumDate}
            accentColor={colors.greenAccent}
            themeVariant="light"
            onValueChange={(_, date) => onChange(date)}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="gap-1">
      <FieldLabel label={label} />
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatShortDate(value)}`}
        accessibilityHint="Opens a calendar"
        className={box}>
        <Icon name={icons.calendar} size={18} color="textBlackSoft" />
        <Text className="flex-1">{formatShortDate(value)}</Text>
      </Pressable>
      {open && (
        // Android dialog presentation: opens on mount, so unmount after set or dismiss.
        <DateTimePicker
          value={value}
          mode="date"
          presentation="dialog"
          minimumDate={minimumDate}
          accentColor={colors.greenAccent}
          onValueChange={(_, date) => {
            setOpen(false);
            onChange(date);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </View>
  );
}
