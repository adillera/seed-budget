import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing } from '@/theme';

import { Icon, icons } from './icon';
import { Text } from './text';

export type AccordionItem = { title: string; body: ReactNode };

export type AccordionProps = {
  items: readonly AccordionItem[];
  /** Index of the panel open at first. */
  defaultOpen?: number;
};

/** Expander list. One panel open at a time; rows separated by a black-a10 rule. */
export function Accordion({ items, defaultOpen }: AccordionProps) {
  const [open, setOpen] = useState<number | undefined>(defaultOpen);

  return (
    <View>
      {items.map((item, index) => (
        <Row
          key={`${item.title}-${index}`}
          item={item}
          open={open === index}
          onToggle={() => setOpen(open === index ? undefined : index)}
        />
      ))}
    </View>
  );
}

function Row({ item, open, onToggle }: { item: AccordionItem; open: boolean; onToggle: () => void }) {
  const [contentHeight, setContentHeight] = useState(0);
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(open ? 1 : 0, { duration: duration.expander, easing: easing.expander }));
  }, [open, progress]);

  const panelStyle = useAnimatedStyle(() => ({
    height: contentHeight * progress.value,
    opacity: progress.value,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${180 * progress.value}deg` }],
  }));

  return (
    <View className="border-b border-b-black-alpha-10">
      <Pressable
        accessibilityRole="button"
        aria-expanded={open}
        onPress={onToggle}
        className="flex-row items-center gap-3 min-h-field py-3">
        <Text variant="bodyStrong" className="flex-1">
          {item.title}
        </Text>
        <Animated.View style={chevronStyle}>
          <Icon name={icons.chevronDown} size={18} color="greenAccent" />
        </Animated.View>
      </Pressable>
      {/* overflow on style: NativeWind doesn't style Reanimated views on native. */}
      <Animated.View style={[{ overflow: 'hidden' }, panelStyle]} accessibilityElementsHidden={!open}>
        <View
          className="absolute left-0 right-0 top-0 pb-3"
          onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
          {typeof item.body === 'string' ? (
            <Text variant="small" color="textBlackSoft">
              {item.body}
            </Text>
          ) : (
            item.body
          )}
        </View>
      </Animated.View>
    </View>
  );
}
