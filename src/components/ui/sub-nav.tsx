import { Pressable, ScrollView, View } from 'react-native';

import { Text } from './text';

export type SubNavItem<V extends string> = { label: string; value: V };

export type SubNavProps<V extends string> = {
  items: readonly SubNavItem<V>[];
  value: V;
  onChange: (value: V) => void;
};

/** A horizontal tab row. The current tab reads greenBrand with a greenAccent underline. */
export function SubNav<V extends string>({ items, value, onChange }: SubNavProps<V>) {
  return (
    <View className="border-b border-b-hairline">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-4"
        accessibilityRole="tablist">
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              aria-selected={selected}
              onPress={() => onChange(item.value)}
              className={`h-button justify-center border-b-2 -mb-px ${
                selected ? 'border-b-green-accent' : 'border-b-transparent'
              }`}>
              <Text variant="smallStrong" color={selected ? 'greenBrand' : 'textBlackSoft'}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
