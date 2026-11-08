import { Image } from 'expo-image';
import { View } from 'react-native';

import { Text } from './text';

const MARK_LIGHT = require('@/assets/images/logo/seed-mark-light.svg');

/** "Seed: Budget" mark and wordmark, in white, for photo and dark grounds. */
export function BrandLockup() {
  return (
    <View className="flex-row items-center gap-2">
      <Image source={MARK_LIGHT} contentFit="contain" className="size-logo-mark" />
      <Text variant="bodyStrong" color="textWhite">
        Seed: <Text color="textWhite">Budget</Text>
      </Text>
    </View>
  );
}
