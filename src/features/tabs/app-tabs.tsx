import { NativeTabs } from 'expo-router/native-tabs';

import { colors, fonts } from '@/theme';

import { TABS } from './tabs';

/** System tab bar on iOS and Android (Liquid Glass on iOS 26 ignores the background color). */
export function AppTabs() {
  return (
    <NativeTabs
      tintColor={colors.greenAccent}
      iconColor={{ default: colors.textBlackSoft, selected: colors.greenAccent }}
      labelStyle={{
        default: { fontFamily: fonts.sans.semibold, color: colors.textBlackSoft },
        selected: { fontFamily: fonts.sans.semibold, color: colors.greenAccent },
      }}
      backgroundColor={colors.white}>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon sf={{ default: tab.icon.ios, selected: tab.sfSelected }} md={tab.icon.android} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
