import { useState } from 'react';
import { type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shadow, space } from '@/theme';

import { Icon, icons, type IconName } from './icon';
import { PressScale } from './press-scale';

export type FloatButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  /** Accessible name, e.g. "Add expense". */
  label: string;
  icon?: IconName;
  size?: 'md' | 'mini';
  /** Pin to the bottom-right of the screen, clear of the safe area. */
  fixed?: boolean;
  /** Extra bottom offset, e.g. a tab bar height. */
  bottomInset?: number;
};

/** The circular primary action. The most elevated element; one per screen at most. */
export function FloatButton({
  label,
  icon = icons.plus,
  size = 'md',
  fixed,
  bottomInset = 0,
  ...rest
}: FloatButtonProps) {
  const insets = useSafeAreaInsets();
  const [pressed, setPressed] = useState(false);

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      containerClassName={fixed ? 'absolute' : undefined}
      // Safe-area offsets are runtime values, so they stay on style.
      containerStyle={
        fixed
          ? { right: space[3] + insets.right, bottom: space[3] + insets.bottom + bottomInset }
          : undefined
      }
      className={`rounded-circle bg-green-accent items-center justify-center ${size === 'mini' ? 'size-float-mini' : 'size-float'}`}
      // Multi-layer shadows stay on style: NativeWind flattens them on native.
      style={{ boxShadow: pressed ? shadow.floatActive : shadow.float }}
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        rest.onPressOut?.(e);
      }}>
      <Icon name={icon} size={size === 'mini' ? 18 : 24} color="textWhite" />
    </PressScale>
  );
}
