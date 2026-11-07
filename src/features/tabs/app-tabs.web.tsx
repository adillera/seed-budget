import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text, type IconName } from '@/components/ui';

import { TABS } from './tabs';

/**
 * Web tab bar. There is no system tab bar on web (NativeTabs falls back to an iPad-style one),
 * so this uses headless expo-router/ui tabs styled like the mockup: white bar, hairline top
 * border, green active icon and label.
 */
export function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      {/* flex-1 lets the screen shrink to the space above the bar (its default is flexShrink 0,
          which grows the page and pushes the bar below the fold). */}
      <TabSlot className="flex-1" />
      <TabList asChild>
        <View
          className="flex-row bg-white border-t border-t-hairline px-3 pt-2"
          style={{ paddingBottom: insets.bottom + 8 }}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton icon={tab.icon} label={tab.label} />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'> & { icon: IconName; label: string };

function TabButton({ icon, label, isFocused, ...props }: TabButtonProps) {
  const color = isFocused ? 'greenAccent' : 'textBlackSoft';
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      aria-selected={!!isFocused}
      className="flex-1 min-h-tap-target active:opacity-pressed">
      {/* Layout on an inner View: TabTrigger's own style on the Pressable lays children in a row. */}
      <View className="flex-1 flex-col items-center justify-center gap-1">
        <Icon name={icon} size={24} color={color} />
        <Text variant="smallStrong" color={color}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
