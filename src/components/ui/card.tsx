import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { shadow } from '@/theme';

import { PressScale } from './press-scale';

export type CardProps = {
  children: ReactNode;
  /** 16 padding instead of 24. */
  tight?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/**
 * The default content card: white on the neutralWarm canvas.
 * Place cards with a space[3] gap; separate content with whitespace, not dividers.
 */
export function Card({ children, tight, className, style, onPress, accessibilityLabel }: CardProps) {
  const cardClass = `bg-white rounded-card gap-2 ${tight ? 'p-3' : 'p-4'} ${className ?? ''}`;

  if (onPress) {
    return (
      <PressScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={cardClass}
        style={[styles.shadow, style]}>
        {children}
      </PressScale>
    );
  }
  return (
    <View className={cardClass} style={[styles.shadow, style]}>
      {children}
    </View>
  );
}

// Multi-layer shadows stay on style: NativeWind flattens them on native.
const styles = { shadow: { boxShadow: shadow.card } } as const;
