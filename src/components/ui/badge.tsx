import { View } from 'react-native';

import { Text } from './text';

export type BadgeProps = { children: string };

/** Small mint pill for a tag or status next to a heading (e.g. the category an amount is filed under). */
export function Badge({ children }: BadgeProps) {
  return (
    <View className="bg-green-light rounded-pill px-3 py-1 self-start">
      <Text variant="smallStrong" color="greenBrand">
        {children}
      </Text>
    </View>
  );
}
