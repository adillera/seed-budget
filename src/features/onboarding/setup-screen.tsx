import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { BackLink, HintScrollView, Screen, Text } from '@/components/ui';

const FIELD = require('@/assets/images/onboarding/05-field.jpg');

export type SetupScreenProps = {
  title: string;
  body: string;
  /** The cards. They scroll between the copy and the CTA. */
  children: ReactNode;
  /** The fixed bottom action (a full-width inverse Button). */
  cta: ReactNode;
};

/**
 * Chrome shared by the onboarding setup steps: field photo + scrim, round back button,
 * white title and copy, a scrolling card area with a "Scroll for more" hint, and a fixed CTA.
 */
export function SetupScreen({ title, body, children, cta }: SetupScreenProps) {
  return (
    <View className="flex-1 bg-green-house">
      <StatusBar style="light" />
      <View className="absolute inset-0">
        <Image source={FIELD} contentFit="cover" className="flex-1" />
      </View>
      <View className="absolute inset-0 bg-black-alpha-50" />

      <Screen transparent edges={['top', 'bottom']} contentClassName="pt-2 pb-3">
        <BackLink variant="circle" />
        <View className="gap-2">
          <Text variant="heroLarge" color="textWhite" accessibilityRole="header">
            {title}
          </Text>
          <Text color="textWhiteSoft">
            {body}
          </Text>
        </View>

        <HintScrollView
          className="flex-1"
          contentContainerClassName="gap-3 pt-2 pb-3"
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </HintScrollView>

        {cta}
      </Screen>
    </View>
  );
}
