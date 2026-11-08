import { Image, type ImageSource } from 'expo-image';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '@/theme';

export type PhotoHeroProps = {
  /** A bundled photo (`require('@/assets/images/…')`). */
  photo: ImageSource | number;
  children: ReactNode;
};

/**
 * Full-bleed photo under a black-a50 scrim, with the content in the centered column. Runs under
 * the status bar (top inset in style): use it as a `Screen` header with `edges={[]}` (Home) or a
 * list header (Entries), and set a light status bar while focused.
 */
export function PhotoHero({ photo, children }: PhotoHeroProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="overflow-hidden bg-green-house">
      <View className="absolute inset-0">
        <Image source={photo} contentFit="cover" className="flex-1" />
      </View>
      <View className="absolute inset-0 bg-black-alpha-50" />
      <View
        className="w-full max-w-content self-center gap-4 px-3 md:px-4 lg:px-6 pb-4"
        style={{ paddingTop: insets.top + space[3] }}>
        {children}
      </View>
    </View>
  );
}
