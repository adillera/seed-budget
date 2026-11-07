import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, type ColorToken } from '@/theme';

/** SF Symbol name on iOS, Material Symbol name on Android and web. */
export type IconName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

export type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorToken;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 24, color = 'textBlack', style }: IconProps) {
  return <SymbolView name={name} size={size} tintColor={colors[color]} style={style} />;
}

/** Icons the shared components use. */
export const icons = {
  plus: { ios: 'plus', android: 'add', web: 'add' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  chevronDown: { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
} as const satisfies Record<string, IconName>;
