import {
  Calendar,
  ChartLine,
  Check,
  ChevronDown,
  ChevronLeft,
  House,
  LayoutGrid,
  List,
  Minus,
  Pencil,
  Plus,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, iconStroke, type ColorToken } from '@/theme';

/** A Lucide icon component (https://lucide.dev/icons). */
export type IconName = LucideIcon;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorToken;
  /** Defaults to `iconStroke.regular`. */
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name: Glyph, size = 24, color = 'textBlack', strokeWidth = iconStroke.regular, style }: IconProps) {
  return <Glyph size={size} color={colors[color]} strokeWidth={strokeWidth} style={style} />;
}

/** Icons the shared components use. */
export const icons = {
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  calendar: Calendar,
  home: House,
  entries: List,
  categories: LayoutGrid,
  forecast: ChartLine,
  pencil: Pencil,
  trash: Trash2,
} as const satisfies Record<string, IconName>;
