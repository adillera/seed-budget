import { NativeTabs } from 'expo-router/native-tabs';

import { colors, fonts } from '@/theme';

import { TABS } from './tabs';

/** System tab bar on iOS and Android (Liquid Glass on iOS 26 ignores the background color and `disableTransparentOnScrollEdge`). */
export function AppTabs() {
  return (
    <NativeTabs
      tintColor={colors.greenAccent}
      iconColor={{ default: colors.textBlackSoft, selected: colors.greenAccent }}
      labelStyle={{
        default: { fontFamily: fonts.sans.semibold, color: colors.textBlackSoft },
        selected: { fontFamily: fonts.sans.semibold, color: colors.greenAccent },
      }}
      backgroundColor={colors.white}
      // iOS 18: UIKit drops the background at the scroll edge (Entries' FlatList trips it mid-list).
      disableTransparentOnScrollEdge>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon src={tab.image} renderingMode="template" />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
