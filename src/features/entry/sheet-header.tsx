import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon, icons, Text } from '@/components/ui';

/** Leaves the sheet route: back to whatever opened it, or Home after a deep link or reload. */
export function closeSheet() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Sheet title (h1, greenBrand) and the round ✕ close button. */
export function SheetHeader({ title }: { title: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text variant="h1" accessibilityRole="header" className="flex-1">
        {title}
      </Text>
      <Pressable
        onPress={closeSheet}
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="size-tap-target rounded-circle bg-ceramic items-center justify-center active:bg-black-alpha-6">
        <Icon name={icons.close} size={20} color="textBlackSoft" />
      </Pressable>
    </View>
  );
}
