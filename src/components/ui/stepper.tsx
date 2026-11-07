import { useState } from 'react';
import { View } from 'react-native';

import { size } from '@/theme';

import { Icon, icons } from './icon';
import { PressScale } from './press-scale';
import { Text } from './text';

export type StepperProps = {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  /** Appended to the button names for screen readers ("Decrease {label}"). */
  label: string;
};

const buttonClass =
  'size-stepper-button rounded-circle border border-input-border bg-white items-center justify-center';

/** Minus / count / plus with 32px circular buttons. */
export function Stepper({
  value,
  defaultValue = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
  onChange,
  label,
}: StepperProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const slop = (size.tapTarget - size.stepperButton) / 2;

  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    setInternal(clamped);
    onChange?.(clamped);
  };

  return (
    <View className="flex-row items-center gap-2">
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        disabled={current <= min}
        hitSlop={slop}
        onPress={() => set(current - step)}
        className={buttonClass}>
        <Icon name={icons.minus} size={16} />
      </PressScale>
      <Text
        variant="bodyStrong"
        className="min-w-stepper-button text-center"
        accessibilityLabel={`${label} ${current}`}>
        {current}
      </Text>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        disabled={current >= max}
        hitSlop={slop}
        onPress={() => set(current + step)}
        className={buttonClass}>
        <Icon name={icons.plus} size={16} />
      </PressScale>
    </View>
  );
}
