import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '@/theme';

import { SheetHeader } from './sheet-header';

export type SheetFrameProps = { title: string; children: ReactNode };

/**
 * Native: the route is a system form sheet (grabber, dimming, drag to dismiss and keyboard
 * avoidance come from the OS), sized to fit this column. Web: sheet-frame.web.tsx draws all that.
 */
export function SheetFrame({ title, children }: SheetFrameProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="bg-white px-3 pt-5 gap-3"
      style={{ paddingBottom: Math.max(insets.bottom, space[3]) }}>
      <SheetHeader title={title} />
      {children}
    </View>
  );
}
