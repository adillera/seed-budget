import { View } from 'react-native';

import { fromLocalISODate, toLocalISODate } from '@/lib/dates';

import type { DateFieldProps } from './date-field';
import { LockedDate } from './date-field-locked';
import { Icon, icons } from './icon';
import { FieldLabel } from './text-field';

export type { DateFieldProps } from './date-field';

/** Web twin of date-field.tsx: a browser date input styled as the boxed form field. */
export function DateField({ label, value, onChange, minimumDate, maximumDate, disabled }: DateFieldProps) {
  if (disabled) return <LockedDate label={label} value={value} />;
  return (
    <View className="gap-1">
      <FieldLabel label={label} />
      <View className="min-h-field rounded-field border border-input-border bg-white flex-row items-center gap-2 px-3">
        <Icon name={icons.calendar} size={18} color="textBlackSoft" />
        <input
          type="date"
          aria-label={label}
          value={toLocalISODate(value)}
          min={minimumDate ? toLocalISODate(minimumDate) : undefined}
          max={maximumDate ? toLocalISODate(maximumDate) : undefined}
          onChange={(e) => {
            // Cleared or partial input gives "": keep the last valid date.
            if (e.target.value) onChange(fromLocalISODate(e.target.value));
          }}
          className="flex-1 min-h-field bg-transparent border-0 outline-none font-manrope text-body text-text-black"
        />
      </View>
    </View>
  );
}
