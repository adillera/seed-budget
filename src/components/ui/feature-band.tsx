import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './text';

export type FeatureBandProps = {
  title: string;
  body?: string;
  /** An inverse + outlineInverse Button pair. */
  actions?: ReactNode;
  /** Image or illustration. Shown first below 768, 40% on the right from 768. */
  media?: ReactNode;
};

/**
 * A greenHouse band with copy and optional media.
 * Below 768 the column is reversed so the media (last child) sits on top; from 768 it's a 60/40 row.
 */
export function FeatureBand({ title, body, actions, media }: FeatureBandProps) {
  return (
    <View className="bg-green-house overflow-hidden flex-col-reverse md:flex-row">
      <View className="p-5 gap-3 md:w-3/5 md:justify-center">
        <Text variant="h1" color="textWhite" accessibilityRole="header">
          {title}
        </Text>
        {body && (
          <Text variant="bodyLarge" color="textWhiteSoft">
            {body}
          </Text>
        )}
        {actions && <View className="flex-row flex-wrap gap-2 mt-2">{actions}</View>}
      </View>
      {media && <View className="bg-green-uplift min-h-media md:w-2/5 md:min-h-0">{media}</View>}
    </View>
  );
}
