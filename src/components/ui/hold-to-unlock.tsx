import * as Haptics from 'expo-haptics';
import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, duration, opacity, size, whiteAlpha } from '@/theme';

import { PressScale } from './press-scale';
import { Text } from './text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = (size.holdRing - size.holdRingStroke) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type HoldToUnlockProps = {
  /** 0 → 1. Owned by the parent so it can drive other visuals (background, text) from it. */
  progress: SharedValue<number>;
  /** Called once, when the ring reaches 100%. */
  onComplete: () => void;
  /** Label at rest. Also the accessibility label. */
  label?: string;
  /** Label while held. */
  holdingLabel?: string;
  accessibilityHint?: string;
  /** Button face content (e.g. the seed mark). */
  children: ReactNode;
};

/**
 * Press-and-hold control: a white circle (rest opacity 0.7, 1 while held) inside a progress ring
 * that fills over `duration.hold` and drains back over `duration.release` on an early release.
 * Screen readers complete it with the `activate` action instead of holding.
 * Use on dark or photo grounds only (white ring and label).
 */
export function HoldToUnlock({
  progress,
  onComplete,
  label = 'Hold to unlock',
  holdingLabel = 'Keep holding',
  accessibilityHint,
  children,
}: HoldToUnlockProps) {
  const [holding, setHolding] = useState(false);
  const completed = useRef(false);
  const face = useSharedValue<number>(opacity.rest);

  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  const faceStyle = useAnimatedStyle(() => ({ opacity: face.value }));
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View className="items-center gap-3">
      <View className="size-hold-ring items-center justify-center">
        {/* Rotated so the arc starts at 12 o'clock and runs clockwise. */}
        <View className="absolute inset-0" style={{ transform: [{ rotate: '-90deg' }] }}>
          <Svg width={size.holdRing} height={size.holdRing}>
            <Circle
              cx={size.holdRing / 2}
              cy={size.holdRing / 2}
              r={RADIUS}
              stroke={whiteAlpha.a30}
              strokeWidth={size.holdRingStroke}
              fill="none"
            />
            <AnimatedCircle
              cx={size.holdRing / 2}
              cy={size.holdRing / 2}
              r={RADIUS}
              stroke={colors.textWhite}
              strokeWidth={size.holdRingStroke}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              fill="none"
              animatedProps={ringProps}
            />
          </Svg>
        </View>

        <PressScale
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName !== 'activate') return;
            progress.set(1);
            finish();
          }}
          onPressIn={() => {
            if (completed.current) return;
            setHolding(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            face.set(withTiming(1, { duration: duration.button }));
            // ReduceMotion.Never: the fill is a timer, not decoration. With the system default it
            // would jump straight to 1 when reduce motion is on.
            progress.set(
              withTiming(
                1,
                {
                  duration: duration.hold * (1 - progress.get()),
                  easing: Easing.linear,
                  reduceMotion: ReduceMotion.Never,
                },
                (finished) => {
                  if (finished) scheduleOnRN(finish);
                },
              ),
            );
          }}
          onPressOut={() => {
            setHolding(false);
            face.set(withTiming(opacity.rest, { duration: duration.button }));
            if (completed.current) return;
            progress.set(
              withTiming(0, {
                duration: duration.release * progress.get(),
                easing: Easing.linear,
                reduceMotion: ReduceMotion.Never,
              }),
            );
          }}>
          <Animated.View style={faceStyle}>
            <View className="size-hold-button rounded-circle bg-white items-center justify-center">
              {children}
            </View>
          </Animated.View>
        </PressScale>
      </View>

      <Text variant="bodyStrong" color="textWhite" aria-hidden>
        {holding ? holdingLabel : label}
      </Text>
    </View>
  );
}
