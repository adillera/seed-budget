import { Pressable, View } from 'react-native';

import { Text } from './text';

export type DropdownItem = string | { label: string; value?: string; destructive?: boolean };

export type DropdownMenuProps<T extends DropdownItem> = {
  items: readonly T[];
  onSelect: (item: T, index: number) => void;
};

/** A quiet neutralCool menu of large items. No border. */
export function DropdownMenu<T extends DropdownItem>({ items, onSelect }: DropdownMenuProps<T>) {
  return (
    <View className="bg-neutral-cool rounded-card py-2 overflow-hidden" accessibilityRole="menu">
      {items.map((item, index) => {
        const label = typeof item === 'string' ? item : item.label;
        const destructive = typeof item !== 'string' && item.destructive;
        return (
          <Pressable
            key={`${label}-${index}`}
            accessibilityRole="menuitem"
            onPress={() => onSelect(item, index)}
            className="px-4 py-2 active:bg-black-alpha-6">
            <Text variant="h2" color={destructive ? 'red' : 'textBlack'}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
