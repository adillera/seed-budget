import { router, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { Icon, icons } from './icon';
import { Text } from './text';

export type BackLinkProps = {
  children?: string;
  /** Where to go. Default: router.back(). */
  href?: Href;
  onPress?: () => void;
  /**
   * - link (default): chevron + label in greenAccent, on light screens.
   * - circle: a translucent white circle with a white chevron, on photo and dark screens.
   *   The label is used for accessibility only.
   */
  variant?: 'link' | 'circle';
};

/** Chevron + "Back" in greenAccent 14/700. Use on deep sub-screens instead of breadcrumbs. */
export function BackLink({ children = 'Back', href, onPress, variant = 'link' }: BackLinkProps) {
  const go = () => {
    if (onPress) onPress();
    else if (href) router.navigate(href);
    else router.back();
  };

  if (variant === 'circle') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={children}
        onPress={go}
        className="size-tap-target rounded-circle bg-white-alpha-30 items-center justify-center self-start active:opacity-pressed">
        <Icon name={icons.chevronLeft} size={18} color="textWhite" />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={children}
      hitSlop={8}
      onPress={go}
      className="flex-row items-center gap-1 self-start min-h-tap-target active:opacity-pressed">
      <Icon name={icons.chevronLeft} size={14} color="greenAccent" />
      <Text variant="smallBold" color="greenAccent">
        {children}
      </Text>
    </Pressable>
  );
}
