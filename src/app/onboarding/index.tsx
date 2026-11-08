import { Image } from 'expo-image';
import { router, useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { BrandLockup, HoldToUnlock, Screen, Text } from '@/components/ui';

/** Bare soil → leafy sprout. Credits: assets/images/onboarding/CREDITS.md. */
const PHOTOS = [
  require('@/assets/images/onboarding/01-soil.jpg'),
  require('@/assets/images/onboarding/02-breaking.jpg'),
  require('@/assets/images/onboarding/03-seedling.jpg'),
  require('@/assets/images/onboarding/04-sprout.jpg'),
];
const STAGES = PHOTOS.length - 1;

const MARK = require('@/assets/images/logo/seed-mark.svg');

/** Photo `index` (≥ 1) fades in over its slice of the hold, on top of the previous one. */
function PhotoLayer({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const layerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [(index - 1) / STAGES, index / STAGES], [0, 1], Extrapolation.CLAMP),
  }));
  return (
    // absoluteFill stays on `style`: NativeWind can't style Reanimated views on native.
    <Animated.View style={[StyleSheet.absoluteFill, layerStyle]}>
      <Image source={PHOTOS[index]} contentFit="cover" className="flex-1" />
    </Animated.View>
  );
}

export default function Onboarding() {
  const progress = useSharedValue(0);
  // After the Fields step covers this screen, empty the ring and remount HoldToUnlock so it can
  // run again on the way back. Reset once the cover transition ends (so the sprout doesn't flash
  // back to soil mid-slide); on focus as a fallback where that event doesn't fire (web).
  const [attempt, setAttempt] = useState(0);
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  useEffect(() => {
    const reset = () => {
      if (progress.get() === 0) return;
      progress.set(0);
      setAttempt((n) => n + 1);
    };
    const offTransition = navigation.addListener('transitionEnd', (e) => {
      if (e.data.closing) reset();
    });
    const offFocus = navigation.addListener('focus', reset);
    return () => {
      offTransition();
      offFocus();
    };
  }, [navigation, progress]);
  const textStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  return (
    <View className="flex-1 bg-green-house">
      <StatusBar style="light" />

      <View className="absolute inset-0">
        <Image source={PHOTOS[0]} contentFit="cover" className="flex-1" />
      </View>
      {PHOTOS.slice(1).map((_, i) => (
        <PhotoLayer key={i + 1} index={i + 1} progress={progress} />
      ))}
      <View className="absolute inset-0 bg-black-alpha-40" />

      <Screen transparent edges={['top', 'bottom']} contentClassName="pt-5 pb-9">
        <Animated.View style={textStyle}>
          <View className="gap-5">
            <BrandLockup />
            <View className="gap-3">
              <Text variant="heroLarge" color="textWhite" accessibilityRole="header">
                Small amounts, planted well, grow.
              </Text>
              <Text variant="bodyLarge" color="textWhiteSoft">
                Give every bit of money a place to take root, and watch your savings sprout.
              </Text>
            </View>
          </View>
        </Animated.View>

        <View className="flex-1" />

        <View className="mb-9">
          <HoldToUnlock
            key={attempt}
            progress={progress}
            onComplete={() => router.push('/onboarding/fields')}
            accessibilityHint="Press and hold for 3 seconds to open Seed: Budget">
            <Image source={MARK} contentFit="contain" className="size-hold-mark" />
          </HoldToUnlock>
        </View>
      </Screen>
    </View>
  );
}
