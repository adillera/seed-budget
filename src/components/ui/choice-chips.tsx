import { View } from 'react-native';

import { size } from '@/theme';

import { PressScale } from './press-scale';
import { Text } from './text';

export type ChoiceOption<T extends string> = { label: string; value: T };

export type ChoiceChipsProps<T extends string> = {
  /** Uppercase label on the left of the chips. */
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * - inline (default): label on the left, chips sized to their text.
   * - stretch: no visible label (it stays the accessibility label), equal-width full-height pills.
   */
  layout?: 'inline' | 'stretch';
};

const chipClass = {
  on: 'min-h-button-sm px-4 rounded-pill border bg-green-accent border-green-accent items-center justify-center',
  off: 'min-h-button-sm px-4 rounded-pill border bg-white border-green-accent items-center justify-center',
} as const;

const stretchClass = {
  on: 'min-h-button px-4 rounded-pill border bg-green-accent border-green-accent items-center justify-center',
  off: 'min-h-button px-4 rounded-pill border bg-white border-green-accent items-center justify-center',
} as const;

/** A single choice from a few pill options (radio group). Selected is filled greenAccent. */
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  layout = 'inline',
}: ChoiceChipsProps<T>) {
  const stretch = layout === 'stretch';
  const slop = stretch ? undefined : (size.tapTarget - size.buttonSm) / 2;
  const classes = stretch ? stretchClass : chipClass;
  return (
    <View className="flex-row items-center gap-3" accessibilityRole="radiogroup" accessibilityLabel={label}>
      {!stretch && <Text variant="fieldLabel">{label}</Text>}
      <View className={stretch ? 'flex-1 flex-row gap-2' : 'flex-row gap-2 flex-wrap'}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <PressScale
              key={o.value}
              accessibilityRole="radio"
              accessibilityLabel={o.label}
              aria-checked={selected}
              hitSlop={slop}
              onPress={() => onChange(o.value)}
              containerClassName={stretch ? 'flex-1' : undefined}
              className={selected ? classes.on : classes.off}>
              <Text variant={stretch ? 'buttonLabel' : 'buttonLabelSm'} color={selected ? 'textWhite' : 'greenAccent'}>
                {o.label}
              </Text>
            </PressScale>
          );
        })}
      </View>
    </View>
  );
}
