import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { duration, easing } from '@/theme';

import { Icon, icons } from './icon';
import { Text } from './text';

export type CheckboxProps = {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
};

/** Checkbox whose mark springs in on `easing.option`. Checked fills greenAccent. */
export function Checkbox({ label, checked, defaultChecked = false, onChange }: CheckboxProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isChecked = checked ?? internal;

  const scale = useSharedValue(isChecked ? 1 : 0);
  useEffect(() => {
    scale.set(withTiming(isChecked ? 1 : 0, {
      duration: duration.button,
      easing: isChecked ? easing.option : undefined,
    }));
  }, [isChecked, scale]);
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={isChecked}
      accessibilityLabel={label}
      onPress={() => {
        setInternal(!isChecked);
        onChange?.(!isChecked);
      }}
      className="flex-row items-center gap-3 min-h-tap-target">
      <View
        className={`size-checkbox rounded-field border-2 items-center justify-center ${
          isChecked ? 'bg-green-accent border-green-accent' : 'border-text-black'
        }`}>
        <Animated.View style={markStyle}>
          <Icon name={icons.check} size={16} color="textWhite" />
        </Animated.View>
      </View>
      <Text className="flex-1">{label}</Text>
    </Pressable>
  );
}
