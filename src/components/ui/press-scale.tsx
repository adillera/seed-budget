import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { duration, scalePress } from '@/theme';

export type PressScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** Classes of the animated (scaling) element: fill, border, radius, padding. */
  className?: string;
  /** Style of the animated element (for values that can't be classes, like boxShadow). */
  style?: StyleProp<ViewStyle>;
  /** Classes of the outer Pressable (layout: width, alignSelf, position). */
  containerClassName?: string;
  /** Style of the outer Pressable (computed layout, e.g. safe-area offsets). */
  containerStyle?: StyleProp<ViewStyle>;
};

/** Pressable that scales its content to `scalePress` while pressed. Disabled = `opacity-disabled`, no scale. */
export function PressScale({
  children,
  className,
  style,
  containerClassName,
  containerStyle,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      className={`${disabled ? 'opacity-disabled' : ''} ${containerClassName ?? ''}`}
      style={containerStyle}
      aria-disabled={!!disabled}
      onPressIn={(e) => {
        scale.set(withTiming(scalePress, { duration: duration.button }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withTiming(1, { duration: duration.button }));
        onPressOut?.(e);
      }}>
      {/* Classes go on the inner View: NativeWind doesn't style Reanimated views on native. */}
      <Animated.View style={animatedStyle}>
        <View className={className} style={style}>
          {children}
        </View>
      </Animated.View>
    </Pressable>
  );
}
