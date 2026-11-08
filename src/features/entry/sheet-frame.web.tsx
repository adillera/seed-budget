import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { SheetFrameProps } from './sheet-frame';
import { closeSheet, SheetHeader } from './sheet-header';

export type { SheetFrameProps } from './sheet-frame';

/**
 * Web twin: Expo Router renders form sheets as plain routes on web, so the route is a
 * transparentModal and this draws the sheet over the screen below it: a black-a50 scrim that
 * closes on press, Escape to close, and a white bottom panel (max 720) with a grabber.
 */
export function SheetFrame({ title, children }: SheetFrameProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSheet();
    };
    // Capture phase: a focused TextInput would otherwise keep the Escape key to itself.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return (
    <View className="flex-1 justify-end pt-7">
      <Pressable
        className="absolute inset-0 bg-black-alpha-50 cursor-default"
        onPress={closeSheet}
        accessibilityLabel="Close sheet"
      />
      <View
        role="dialog"
        aria-modal
        aria-label={title}
        className="shrink w-full max-w-content self-center bg-white rounded-t-card">
        <View className="items-center pt-2">
          <View className="w-grabber-width h-grabber-height rounded-pill bg-input-border" />
        </View>
        <ScrollView
          className="grow-0"
          contentContainerClassName="px-3 md:px-4 pt-3 pb-4 gap-3"
          keyboardShouldPersistTaps="handled">
          <SheetHeader title={title} />
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
