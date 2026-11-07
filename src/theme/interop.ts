/**
 * Lets third-party components accept `className` (NativeWind v4 `cssInterop`).
 * Core React Native components work without this. Imported once by the root layout.
 * Reanimated views can't take classes on native even with this: put classes on a plain
 * inner/outer View and keep only animated values on the Animated component.
 */
import { Image } from 'expo-image';
import { TabSlot } from 'expo-router/ui';
import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Image, { className: 'style' });
cssInterop(TabSlot, { className: 'style' });
