import '@/global.css';
import '@/theme/interop';

import { DefaultTheme, Stack, ThemeProvider, type NativeStackNavigationOptions, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { DATABASE_NAME, migrate } from '@/db/migrate';
import { useOnboarded } from '@/lib/onboarding';
import { colors, fonts } from '@/theme';
import { useAppFonts } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync();

// Sheets (add-entry) open over the tabs, even after a deep link or a web reload.
export const unstable_settings = { anchor: '(tabs)' };

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.greenAccent,
    background: colors.neutralWarm,
    card: colors.white,
    text: colors.textBlack,
    border: colors.hairline,
    notification: colors.red,
  },
  fonts: {
    regular: { fontFamily: fonts.sans.regular, fontWeight: '400' },
    medium: { fontFamily: fonts.sans.semibold, fontWeight: '600' },
    bold: { fontFamily: fonts.sans.bold, fontWeight: '700' },
    heavy: { fontFamily: fonts.sans.bold, fontWeight: '700' },
  },
};

/**
 * Entry sheets (add-entry, entry/[key]). Native: a system form sheet sized to its content.
 * Web: Expo Router renders form sheets as plain routes, so it's a transparent modal and
 * SheetFrame's web twin draws the scrim and panel over the tabs.
 */
const SHEET_OPTIONS = Platform.select<NativeStackNavigationOptions>({
  web: {
    presentation: 'transparentModal',
    animation: 'none',
    headerShown: false,
    contentStyle: { backgroundColor: 'transparent' },
  },
  default: {
    presentation: 'formSheet',
    sheetGrabberVisible: true,
    sheetAllowedDetents: 'fitToContents',
    headerShown: false,
    contentStyle: { backgroundColor: colors.white },
  },
});

export default function RootLayout() {
  const [loaded, error] = useAppFonts();
  // On web, `onboarded` is null until the client has read storage (see src/lib/onboarding.web.ts).
  const onboarded = useOnboarded();
  const ready = (loaded || !!error) && onboarded !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.neutralWarm },
            headerStyle: { backgroundColor: colors.neutralWarm },
            headerShadowVisible: false,
            headerTintColor: colors.greenAccent,
            headerTitleStyle: { fontFamily: fonts.sans.semibold, color: colors.textBlack },
          }}>
          {/* First launch only. Gated with explicit redirects, not Stack.Protected: in SDK 58 a
              guard flip doesn't move off a nested onboarding screen (plan 04). (tabs)/_layout
              redirects to /onboarding until onboarded; onboarding/_layout redirects to / once it is. */}
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="add-entry" options={SHEET_OPTIONS} />
          <Stack.Screen name="entry/[key]" options={SHEET_OPTIONS} />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
