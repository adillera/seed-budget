import { useRef, useState } from 'react';
import { Pressable, ScrollView, View, type ScrollViewInstance, type ScrollViewProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { duration, space } from '@/theme';

import { Icon, icons } from './icon';
import { Text } from './text';

/** Scrolling this far counts as "the person has found the scroll"; the hint then stays hidden. */
const SCROLLED = space[3];
/** Share of the viewport that tapping the hint scrolls by. */
const PAGE = 0.8;
/** Only hint when more than this is hidden below (bottom padding and shadows don't count). */
const HIDDEN_MIN = space[4];

export type HintScrollViewProps = Omit<ScrollViewProps, 'onLayout' | 'onContentSizeChange'> & {
  /** Classes for the outer container (size it here, e.g. `flex-1` or `max-h-field-list`). */
  className?: string;
};

/**
 * ScrollView with a "Scroll for more" chip centered over its bottom. The chip shows while more
 * than 24 of content is hidden below and the person hasn't scrolled yet. It fades out after the
 * first scroll of 16 or when the end is in view, and scrolls down 80% of the viewport when tapped.
 * State changes only when visibility flips, never per scroll frame.
 */
export function HintScrollView({ className, onScroll, children, ...rest }: HintScrollViewProps) {
  const ref = useRef<ScrollViewInstance>(null);
  const metrics = useRef({ viewport: 0, content: 0, y: 0 });
  const [overflows, setOverflows] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const update = () => {
    const { viewport, content, y } = metrics.current;
    const next = viewport > 0 && content - (y + viewport) > HIDDEN_MIN;
    if (next !== overflows) setOverflows(next);
  };

  const scrollDown = () => {
    const { viewport, y } = metrics.current;
    ref.current?.scrollTo({ y: y + viewport * PAGE, animated: true });
  };

  return (
    <View className={className}>
      <ScrollView
        {...rest}
        ref={ref}
        scrollEventThrottle={16}
        onLayout={(e) => {
          metrics.current.viewport = e.nativeEvent.layout.height;
          update();
        }}
        onContentSizeChange={(_w, h) => {
          metrics.current.content = h;
          update();
        }}
        onScroll={(e) => {
          metrics.current.y = e.nativeEvent.contentOffset.y;
          if (!dismissed && metrics.current.y >= SCROLLED) setDismissed(true);
          onScroll?.(e);
        }}>
        {children}
      </ScrollView>
      <ScrollHint visible={overflows && !dismissed} onPress={scrollDown} />
    </View>
  );
}

function ScrollHint({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  if (!visible) return null;
  return (
    <View className="absolute left-0 right-0 bottom-3 items-center" pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(duration.button)} exiting={FadeOut.duration(duration.button)}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Scroll for more"
          hitSlop={4}
          className="h-scroll-hint px-3 rounded-pill bg-green-house flex-row items-center gap-1 active:opacity-pressed">
          <Icon name={icons.chevronDown} size={16} color="textWhite" />
          <Text variant="smallStrong" color="textWhite">
            Scroll for more
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
