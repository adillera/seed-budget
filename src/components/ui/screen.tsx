import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: ReactNode;
  /** Wrap content in a ScrollView. */
  scroll?: boolean;
  /** Safe-area edges to inset. Default top only (a Stack header covers the rest). */
  edges?: Edge[];
  /** Classes for the centered content column. */
  contentClassName?: string;
  /** No canvas color, for full-bleed backgrounds layered behind the screen (e.g. onboarding photos). */
  transparent?: boolean;
  /** Style for the centered content column. */
  contentStyle?: StyleProp<ViewStyle>;
};

/** Screen shell: neutralWarm canvas, safe area, responsive gutter (16/24/40), max reading width. */
export function Screen({
  children,
  scroll,
  edges = ['top'],
  contentClassName,
  transparent,
  contentStyle,
}: ScreenProps) {
  const column = `w-full max-w-content self-center gap-3 px-3 md:px-4 lg:px-6 ${contentClassName ?? ''}`;

  return (
    <SafeAreaView edges={edges} className={transparent ? 'flex-1 bg-transparent' : 'flex-1 bg-neutral-warm'}>
      {scroll ? (
        <ScrollView contentContainerClassName="py-4" keyboardShouldPersistTaps="handled">
          <View className={column} style={contentStyle}>
            {children}
          </View>
        </ScrollView>
      ) : (
        <View className={`flex-1 ${column}`} style={contentStyle}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
